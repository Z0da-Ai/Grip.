import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.set('trust proxy', 1);
// PDFs/images arrive as base64 (~33% bigger), so 12mb covers ~8mb files without allowing abuse.
app.use(express.json({ limit: '12mb' }));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(self)');
  next();
});

// Minimal in-memory rate limiter for the paid AI endpoints (no extra dependency).
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = parseInt(process.env.AI_RATE_LIMIT_PER_MIN || '20', 10);
const hits = new Map<string, { count: number; reset: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
}, RATE_WINDOW_MS).unref();

app.use('/api/ai', (req, res, next) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + RATE_WINDOW_MS });
    return next();
  }
  entry.count += 1;
  if (entry.count > RATE_MAX) {
    res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000).toString());
    return res.status(429).json({ success: false, error: 'طلبات كثيرة، حاول بعد دقيقة.' });
  }
  next();
});

// Cap free-text fields so a single request cannot burn the Gemini quota.
const MAX_TEXT_CHARS = 6000;
app.use('/api/ai', (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key of ['speechText', 'promptText', 'text']) {
      if (typeof req.body[key] === 'string' && req.body[key].length > MAX_TEXT_CHARS) {
        req.body[key] = req.body[key].slice(0, MAX_TEXT_CHARS);
      }
    }
  }
  next();
});

// One place to change the model. gemini-2.5-flash is the documented stable default.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Initialize Google GenAI client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Intelligent local rule-based parser for Arabic & English transcribed text
function extractTasksRuleBased(promptText: string, referenceDateStr?: string) {
  const text = (promptText || '').trim();
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();

  // Normalize Eastern Arabic numerals: ٠١٢٣٤٥٦٧٨٩ -> 0123456789
  const normalized = text
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[،,]/g, ' ');

  // Determine target date
  const targetDate = new Date(refDate);
  // Day-after-tomorrow must be tested first, otherwise "بعد بكرة" matches "بكرة" and gives +1.
  if (/بعد بكرة|بعد غد|day after tomorrow/i.test(normalized)) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (/بكرة|غدا|غداً|tomorrow/i.test(normalized)) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const datePrefix = `${yyyy}-${mm}-${dd}`;

  // Time pattern 1: "من 4 ل 6" or "من 4 إلى 6" or "من 4 لـ 6" or "from 4 to 6"
  const rangeMatch = normalized.match(/من\s*(\d{1,2})(?::(\d{2}))?\s*(?:لـ?|إلى|الى|حتى|-)\s*(\d{1,2})(?::(\d{2}))?/i) ||
                     normalized.match(/from\s*(\d{1,2})\s*(?:to|-)\s*(\d{1,2})/i);

  // Time pattern 2: "الساعة 5 لمدة ساعتين" or "at 5 for 2 hours"
  const durationMatch = normalized.match(/(?:الساعة|ساعة|at)\s*(\d{1,2})\s*(?:لمدة\s*(\d{1,2})\s*ساع[ةات]|for\s*(\d{1,2})\s*hours?)/i);

  let startHour = 16; // default 4 PM
  let startMin = 0;
  let endHour = 18;   // default 6 PM
  let endMin = 0;

  const isEvening = /عصر|مساء|بالليل|pm|عصراً|العصر/i.test(normalized);
  const isMorning = /صبح|صباحاً|صباحا|am|الصبح/i.test(normalized);

  if (rangeMatch) {
    let sH = parseInt(rangeMatch[1], 10);
    let eH = parseInt(rangeMatch[3], 10);
    startMin = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
    endMin = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 0;

    // Convert to 24h: if numbers are small (e.g. 4 to 6) and not explicitly marked morning, assume PM for study
    if (sH < 8 && !isMorning) sH += 12;
    if (eH < 8 && !isMorning) eH += 12;
    if (eH <= sH) eH = sH + 2;

    startHour = sH;
    endHour = eH;
  } else if (durationMatch) {
    let sH = parseInt(durationMatch[1], 10);
    const durHours = parseInt(durationMatch[2] || durationMatch[3] || '2', 10);
    if (sH < 8 && !isMorning) sH += 12;
    startHour = sH;
    endHour = sH + durHours;
  }

  const startTimeIso = new Date(`${datePrefix}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`).toISOString();
  const endTimeIso = new Date(`${datePrefix}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`).toISOString();

  // Extract Title from text
  let extractedTitle = text
    .replace(/(?:عايز أذاكر|عندي|ذاكر|مذاكرة|محاضرة|كورس|حصة|درس|جلسة)\s*/gi, '')
    .replace(/(?:بكرة|غدا|غداً|اليوم|النهارده|tomorrow|today)/gi, '')
    .replace(/من\s*\d+.*$/gi, '')
    .replace(/الساعة\s*\d+.*$/gi, '')
    .replace(/[،,\.\-]/g, '')
    .trim();

  if (!extractedTitle) {
    if (/فسيولوجي/i.test(text)) extractedTitle = 'فسيولوجي';
    else if (/كيمياء/i.test(text)) extractedTitle = 'كيمياء عضوية';
    else if (/فيزياء/i.test(text)) extractedTitle = 'فيزياء';
    else if (/رياضيات/i.test(text)) extractedTitle = 'رياضيات';
    else if (/تمرين/i.test(text)) extractedTitle = 'تمرين رياضي';
    else if (/خوارزميات/i.test(text)) extractedTitle = 'خوارزميات';
    else extractedTitle = 'جلسة مذاكرة وتطبيق';
  }

  const isLecture = /محاضرة|امتحان|كويز|ميتنج|اجتماع|ثابت/i.test(text);
  const isSport = /تمرين|جيم|نادي|جري|رياضة|gym/i.test(text);

  const mainTask = {
    title: isLecture ? `محاضرة ${extractedTitle} (حضور كليّة)` : (isSport ? extractedTitle : `مذاكرة ${extractedTitle}`),
    category: isSport ? 'sport' : 'study',
    startTime: startTimeIso,
    endTime: endTimeIso,
    type: isLecture ? 'FIXED' : 'FLEXIBLE',
    notes: isLecture ? 'حضور بالكلية • منبه وتنبيه قبل موعد المحاضرة' : 'تم استخراج المهمة من الإملاء الصوتي بنجاح',
  };

  const tasks = [mainTask];

  // إذا كانت محاضرة جامعية، نقوم تلقائياً بجدولة جلسة مذاكرة وتطبيق مدتها ساعتان في وقت الفراغ
  if (isLecture) {
    const studyStartHour = Math.max(endHour + 2, 17);
    const studyEndHour = studyStartHour + 2;
    const studyStartIso = new Date(`${datePrefix}T${String(studyStartHour).padStart(2, '0')}:00:00`).toISOString();
    const studyEndIso = new Date(`${datePrefix}T${String(studyEndHour).padStart(2, '0')}:00:00`).toISOString();

    tasks.push({
      title: `مذاكرة ومراجعة: ${extractedTitle} (ساعتان)`,
      category: 'study',
      startTime: studyStartIso,
      endTime: studyEndIso,
      type: 'FLEXIBLE',
      notes: 'جلسة مذاكرة وتطبيق مخصصة للمحاضرة (ساعتان) - تمت جدولتها تلقائياً في التقويم',
    });
  }

  return tasks;
}

// Intelligent local rule-based parser for Arabic & English voice commands (expenses, tasks, intentions, alarms, habits)
function parseVoiceCommandRuleBased(promptText: string, referenceDateStr?: string) {
  const text = (promptText || '').trim();
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();

  // Normalize Eastern Arabic numerals: ٠١٢٣٤٥٦٧٨٩ -> 0123456789
  const normalized = text
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[،,]/g, ' ');

  // 1. Check for Expense (مصروف / فلوس / جنيه / صرفت / اشتريت)
  const isExpense = /(?:صرفت|مصروف|مصاريف|اشتريت|دفع|دفعت|تكلفة|فلوس|جنيه|ج\.?م|egp|شراء|فاتورة)/i.test(normalized);
  const amountMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:جنيه|ج\.?م|egp|pound|\$)?/i);

  if (isExpense && amountMatch) {
    const amountVal = parseFloat(amountMatch[1]);
    if (!isNaN(amountVal) && amountVal > 0) {
      let categoryName = 'أخرى';
      if (/أكل|شرب|قهوة|فطار|غدا|عشا|شاي|عصير|مطعم|ساندوتش|وجبة|حلويات/i.test(normalized)) {
        categoryName = 'أكل ومشاريب';
      } else if (/بنزين|مواصلات|أوبر|تاكسي|مترو|ميكروباص|عربية|تذكرة/i.test(normalized)) {
        categoryName = 'مواصلات';
      } else if (/كتب|كتاب|كورس|ملازم|مكتبة|مذكرة|معهد|جامعة|محاضرة|أدوات/i.test(normalized)) {
        categoryName = 'مذاكرة وكورسات';
      } else if (/خروجة|سينما|فسحة|بلايستيشن|لعبة|ترفيه/i.test(normalized)) {
        categoryName = 'خروجات وترفيه';
      }

      let title = text
        .replace(/(?:سجل|سجلت|ضيف|اضف|صرفت|اشتريت|دفعت|مصروف|تكلفة|بقيمة)\s*/gi, '')
        .replace(/\d+(?:\.\d+)?\s*(?:جنيه|ج\.?م|egp)?/gi, '')
        .replace(/[،,\.\-]/g, '')
        .trim();
      if (!title) title = categoryName;

      return {
        intent: 'ADD_EXPENSE',
        summary: `تسجيل مصروف بقيمة ${amountVal} ج.م (${categoryName}) - ${title}`,
        spokenFeedback: `تم تسجيل مصروف ${amountVal} جنيه في ${categoryName} بنجاح`,
        data: {
          expense: {
            amount: amountVal,
            amountMinor: Math.round(amountVal * 100),
            title,
            categoryName,
            note: 'تمت الإضافة بالأمر الصوتي الذكي',
          },
        },
      };
    }
  }

  // 2. Check for Wake-Up Alarm (منبه الصحوة / اصحيني)
  const isAlarm = /(?:منبه|صحيني|اصحى|أصحى|الصحوة|الصحيه|الصحية|صحية|استيقاظ)/i.test(normalized);
  if (isAlarm) {
    const timeMatch = normalized.match(/(?:الساعة|ساعة|على)?\s*(\d{1,2})(?::(\d{2}))?\s*(?:ونص|ونصف|وربع|وثلث|إلا ربع)?\s*(?:صبح|صباحاً|صباحا|am|ليل|مساء|pm)?/i);
    let hour = 6;
    let min = 30;
    if (timeMatch && timeMatch[1]) {
      hour = parseInt(timeMatch[1], 10);
      if (normalized.includes('ونص') || normalized.includes('ونصف')) min = 30;
      else if (normalized.includes('وربع')) min = 15;
      else if (normalized.includes('وثلث')) min = 20;
      else if (timeMatch[2]) min = parseInt(timeMatch[2], 10);
      else min = 0;

      if (/مساء|بالليل|عصر/i.test(normalized) && hour < 12) hour += 12;
    }
    const timeFormatted = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    return {
      intent: 'SET_WAKE_UP_ALARM',
      summary: `ضبط منبه الصحوة الحاسم على الساعة ${timeFormatted}`,
      spokenFeedback: `تم ضبط منبه الصحوة الحاسم على الساعة ${hour} و ${min} دقيقة بنجاح`,
      data: {
        alarm: {
          time: timeFormatted,
          title: 'منبه الصحوة الحاسم ⏰',
          notes: 'تم الضبط عبر الأمر الصوتي',
        },
      },
    };
  }

  // 3. Check for Intention (النية / النوايا / أنوي)
  const isIntention = /(?:نيتي|النية|أنوي|انوي|نية|هدف اليوم|عازم على)/i.test(normalized);
  if (isIntention) {
    let intentionText = text
      .replace(/(?:نيتي|النية|أنوي|انوي|اضف نية|سجل نية|هدف اليوم)\s*(?:النهاردة|اليوم|إن شاء الله)?\s*(?:هي|هو|إني|اني|ان)?\s*/gi, '')
      .replace(/[،,\.\-]/g, '')
      .trim();
    if (!intentionText) intentionText = text;

    let tag: 'today' | 'routine' | 'idea' | 'urgent' = 'today';
    if (/ماء|مياه|صلاة|رياضة|تنفس|عادة/i.test(normalized)) tag = 'routine';
    else if (/فكرة|تدوينة|مشروع/i.test(normalized)) tag = 'idea';
    else if (/ضروري|مستعجل|مهم جدا/i.test(normalized)) tag = 'urgent';

    return {
      intent: 'ADD_INTENTION',
      summary: `تسجيل نية جديدة: "${intentionText}"`,
      spokenFeedback: `تم تسجيل نيتك بنجاح، بالتوفيق والبركة`,
      data: {
        intention: {
          text: intentionText,
          tag,
        },
      },
    };
  }

  // 4. Check for Habit / Tracker (شرب مياه، تمرين، تركيز عميق)
  if (/شربت مياه|شرب ماء|كوباية مياه|لتر مياه|ترطيب/i.test(normalized)) {
    return {
      intent: 'LOG_TRACKER',
      summary: 'تسجيل شرب كوب ماء 💧',
      spokenFeedback: 'تم تسجيل شرب الماء بنجاح، ممتاز!',
      data: {
        tracker: {
          trackerType: 'water',
          label: 'شرب ماء',
          value: 1,
        },
      },
    };
  }

  // 5. Default to Schedule Task (الجداول والمواعيد)
  const tasks = extractTasksRuleBased(promptText, referenceDateStr);
  const task = tasks[0] || {
    title: text || 'مهمة جديدة',
    category: 'study',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    type: 'FLEXIBLE',
    notes: 'تمت الإضافة عبر الأمر الصوتي',
  };

  const startTimeDate = new Date(task.startTime);
  const timeLabel = isNaN(startTimeDate.getTime())
    ? ''
    : ` (الساعة ${startTimeDate.getHours()}:${String(startTimeDate.getMinutes()).padStart(2, '0')})`;

  return {
    intent: 'SCHEDULE_TASK',
    summary: `إضافة مهمة للجدول: "${task.title}"${timeLabel}`,
    spokenFeedback: `تمت جدولة ${task.title} في الجدول بنجاح`,
    data: {
      task,
    },
  };
}

// Endpoint 0: Universal Smart Voice Assistant for Tasks, Expenses, Intentions, Alarms & Habits
app.post('/api/ai/process-voice-command', async (req: Request, res: Response) => {
  try {
    const { speechText, referenceDate, categories } = req.body;
    const text = (speechText || '').trim();

    if (!text) {
      return res.status(400).json({ success: false, error: 'النص الصوتي فارغ' });
    }

    const refDate = referenceDate || new Date().toISOString().split('T')[0];

    if (!aiClient) {
      const fallbackResult = parseVoiceCommandRuleBased(text, refDate);
      return res.json({
        success: true,
        isFallback: true,
        rawText: text,
        ...fallbackResult,
      });
    }

    const availableCategories = (categories && Array.isArray(categories))
      ? categories.join(', ')
      : 'أكل ومشاريب, مواصلات, مذاكرة وكورسات, خروجات وترفيه, أخرى';

    const systemPrompt = `
أنت المساعد الصوتي والذكاء الاصطناعي الشامل لتطبيق Grip (تطبيق تنظيم الحياة وإدارة التركيز).
وظيفتك فهم الأوامر الصوتية باللغة العربية (الفصحى والعامية المصرية والخليجية) وتصنيفها بدقة وتنفيذ المطلوب.

التصنيفات المتاحة للأمر (intent):
1. "ADD_EXPENSE": عندما يتحدث المستخدم عن تسجيل مصروف أو صرف نقود أو شراء شيء أو دفع فاتورة.
   - مثال: "سجل مصروف 50 جنيه قهوة ومشاريب"، "صرفت 200 بنزين"، "اشتريت كتب بـ 150 جنيه".
   - استخرج:
     * amount (رقم موجب، مثلاً 50)
     * amountMinor (amount مضروباً في 100، مثلاً 5000)
     * title (اسم المصروف، مثلاً "قهوة وشاي")
     * categoryName (اختر الأقرب من التصنيفات المتاحة: ${availableCategories})
     * note (ملاحظة اختيارية)

2. "SCHEDULE_TASK": عندما يطلب المستخدم وضع موعد في الجدول أو مذاكرة أو تمرين أو محاضرة أو مهمة.
   - مثال: "حطلي ميعاد بكرة الساعة 5 العصر مذاكرة فسيولوجي"، "عندي تمرين جيم النهاردة من 7 ل 9 بالليل".
   - استخرج:
     * title (اسم المهمة بالعربية)
     * category ("study" | "work" | "sport" | "sleep" | "personal" | "other")
     * startTime (بصيغة ISO كاملة بناءً على تاريخ اليوم: ${refDate})
     * endTime (بصيغة ISO كاملة)
     * type ("FIXED" للمحاضرات والمواعيد الثابتة، أو "FLEXIBLE" للمذاكرة والتمارين المرنة)
     * notes (ملاحظات)

3. "SET_WAKE_UP_ALARM": عندما يطلب ضبط منبه الصحوة الصباحي (المنبه الحاسم الذي يرن مرة واحدة).
   - مثال: "ظبطلي منبه الصحوة الساعة 6 الصبح"، "عايز اصحى الساعة 7 ونص".
   - استخرج:
     * time (توقيت بصيغة HH:mm مثل "06:30")
     * title ("منبه الصحوة الحاسم ⏰")

4. "ADD_INTENTION": عندما يذكر المستخدم نية يومية، أو هدف معنوي/روحي/تركيزي.
   - مثال: "نيتي النهاردة التركيز التام بدون تشتت"، "اضف نية شرب 3 لتر مياه والاهتمام بالصحة"، "نيتي الإخلاص في العمل".
   - استخرج:
     * text (نص النية بأسلوب لطيف وملهم)
     * tag ("today" | "routine" | "idea" | "urgent")

5. "LOG_TRACKER": عندما يذكر المستخدم إنجاز عادة إيجابية كشرب الماء أو التركيز أو التمرين.
   - مثال: "سجل اني شربت مياه"، "سجلت كوباية مية".
   - استخرج:
     * trackerType ("water" | "deep_work" | "workout")
     * label (اسم العادة)
     * value (العدد أو القيمة)

6. "ANSWER_QUERY": إذا سأل المستخدم سؤالاً استفسارياً (مثل "ايه اللي ورايا النهاردة؟").
   - أرجع إجابة واضحة وموجزة في queryAnswer.

قواعد الاستجابة:
- ضع summary يوضح للمستخدم بالعربية ما تم فهمه (مثال: "تم فهم تسجيل مصروف 50 ج.م في أكل ومشاريب").
- ضع spokenFeedback عبارة قصيرة مشجعة بالعامية المهذبة مناسبة للنطق الصوتي (مثال: "تمام، تم تسجيل المصروف بنجاح").
`;

    const response = await aiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\nنص الأمر الصوتي للمستخدم:\n"${text}"` }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              description: 'ADD_EXPENSE, SCHEDULE_TASK, SET_WAKE_UP_ALARM, ADD_INTENTION, LOG_TRACKER, ANSWER_QUERY, or UNKNOWN',
            },
            summary: { type: Type.STRING },
            spokenFeedback: { type: Type.STRING },
            data: {
              type: Type.OBJECT,
              properties: {
                expense: {
                  type: Type.OBJECT,
                  properties: {
                    amount: { type: Type.NUMBER },
                    amountMinor: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    categoryName: { type: Type.STRING },
                    note: { type: Type.STRING },
                  },
                },
                task: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    category: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    type: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                },
                alarm: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    title: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                },
                intention: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    tag: { type: Type.STRING },
                  },
                },
                tracker: {
                  type: Type.OBJECT,
                  properties: {
                    trackerType: { type: Type.STRING },
                    label: { type: Type.STRING },
                    value: { type: Type.NUMBER },
                  },
                },
                queryAnswer: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                  },
                },
              },
            },
          },
          required: ['intent', 'summary', 'data'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      rawText: text,
      ...parsed,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/process-voice-command:', err);
    // Graceful fallback to rule-based engine on any error
    const fallbackResult = parseVoiceCommandRuleBased(req.body.speechText, req.body.referenceDate);
    return res.json({
      success: true,
      isFallback: true,
      rawText: req.body.speechText || '',
      ...fallbackResult,
    });
  }
});

// Endpoint 1: Extract tasks from text, voice transcription, or image of schedule
app.post('/api/ai/extract-tasks', async (req: Request, res: Response) => {
  try {
    const {
      promptText,
      imageBase64,
      imageMimeType,
      pdfBase64,
      pdfMimeType,
      referenceDate,
      autoScheduleStudySessions = true,
      studyHoursPerLecture = 2,
    } = req.body;

    const basePrompt = `
أنت المساعد الذكي لتطبيق "Grip" (Hold your focus. Kill the drift).
وظيفتك استخراج جدول المهام من النص أو صورة الجدول/الورقة أو ملف الـ PDF.

تاريخ اليوم المرجعي هو: ${referenceDate || new Date().toISOString().split('T')[0]}.

القواعد الصارمة:
1. استخرج المهام بتفاصيلها:
   - title (اسم المهمة بالعربية بدقة حسب ما ورد في الجدول أو النص)
   - category: أحد القيم التالية فقط: ["study", "work", "sport", "sleep", "personal", "other"]
   - startTime: توقيت البدء بصيغة ISO كاملة (YYYY-MM-DDTHH:mm:ss)
   - endTime: توقيت الانتهاء بصيغة ISO كاملة
   - type: إما "FIXED" (للمحاضرات، المواعيد الثابتة، الامتحانات) أو "FLEXIBLE" (للمذاكرة الذاتية، التمارين المرنة)
   - notes: أي ملاحظات إضافية

2. قاعدة المحاضرات الجامعية وجلسات المذاكرة (مهمة للغاية ومطلوبة):
   عندما يحتوي الجدول أو الملف على محاضرات كلية أو دراسية:
   أ) أدرج المحاضرة نفسها كـ موعد حضور ثابت (type: "FIXED")، واكتب في العنوان: "محاضرة [اسم المادة] (حضور كليّة)"، وفي الملاحظات: "حضور بالكلية • منبه وتنبيه قبل موعد المحاضرة".
   ب) ${autoScheduleStudySessions ? `قم تلقائياً بجدولة جلسة مذاكرة ومراجعة مخصصة لكل محاضرة:
      - المدة: ${studyHoursPerLecture} ساعة (${studyHoursPerLecture * 60} دقيقة).
      - النوع: "FLEXIBLE" (مرنة)، والتصنيف: "study".
      - العنوان: "مذاكرة ومراجعة: [اسم المادة] (${studyHoursPerLecture === 2 ? 'ساعتان' : `${studyHoursPerLecture} ساعات`})".
      - الموعد: حدد موعدها في نفس اليوم في أوقات الفراغ المسائية بعد انتهاء المحاضرات (مثلاً من 17:00 إلى 19:00، أو 18:00 إلى 20:00، أو 20:00 إلى 22:00) بحيث لا تتداخل أبداً مع أي محاضرة أخرى.
      - الملاحظات: "جلسة مذاكرة وتطبيق مخصصة للمحاضرة (${studyHoursPerLecture} س) - مجدولة تلقائياً في التقويم".` : ''}

3. إذا لم يذكر تاريخاً صريحاً، افترض اليوم أو الغد حسب السياق.
4. أرجع النتيجة على شكل مصفوفة JSON من المهام.
`;

    if (!aiClient) {
      const fallbackTasks = extractTasksRuleBased(promptText, referenceDate);
      return res.json({
        success: true,
        isFallback: true,
        tasks: fallbackTasks
      });
    }

    const parts: any[] = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType || 'image/jpeg',
          data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
        },
      });
    }
    if (pdfBase64) {
      parts.push({
        inlineData: {
          mimeType: pdfMimeType || 'application/pdf',
          data: pdfBase64.replace(/^data:application\/pdf;base64,/, ''),
        },
      });
    }
    parts.push({
      text: `${basePrompt}\n\nنص المستخدم / البيانات:\n${promptText || 'استخرج جدول المحاضرات وجلسات المذاكرة المخصصة من هذا الملف/الجدول بدقة.'}`
    });

    const response = await aiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              type: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
            required: ['title', 'category', 'startTime', 'endTime', 'type'],
          },
        },
      },
    });

    const text = response.text || '[]';
    const parsed = JSON.parse(text);
    return res.json({ success: true, tasks: parsed });
  } catch (err: any) {
    console.error('Error in /api/ai/extract-tasks:', err);
    // Graceful smart rule-based fallback on any API error
    const fallbackTasks = extractTasksRuleBased(req.body.promptText, req.body.referenceDate);
    return res.json({
      success: true,
      isFallback: true,
      tasks: fallbackTasks
    });
  }
});

// Endpoint 2: Split lecture PDF / syllabus text into topics of 20-40 minutes
app.post('/api/ai/split-topics', async (req: Request, res: Response) => {
  try {
    const {
      moduleTitle,
      lectureTitle,
      contentText,
      pdfBase64,
      pdfMimeType = 'application/pdf',
      minDuration = 20,
      maxDuration = 40,
    } = req.body;

    const promptText = `
أنت المساعد الأكاديمي لتطبيق Grip.
المادة (Module): ${moduleTitle || 'مادة دراسية'}
المحاضرة (Lecture): ${lectureTitle || 'المحاضرة الأولى'}

محتوى المحاضرة / ملف الـ PDF:
"""
${contentText || (pdfBase64 ? 'محتوى ملف الـ PDF المرفق' : 'محاضرة في البرمجة الكائنية Object Oriented Programming تشمل Classes, Objects, Inheritance, Polymorphism, Abstraction, Encapsulation وتطبيقات عملية.')}
"""

المطلوب:
قسّم هذه المحاضرة / ملف الـ PDF إلى مواضيع وجلسات تركيز صغيرة متتالية، كل جلسة تتراوح مدتها الإلزامية بين ${minDuration} إلى ${maxDuration} دقيقة.
أعط لكل موضوع:
1. title: اسم الموضوع بالعربية
2. estimatedMinutes: المدة المقدرة بالدقائق (بين ${minDuration} و ${maxDuration})
3. description: ملخص سريع لما سيتم إنجازه في هذه الجلسة
4. sequenceOrder: رقم ترتيب الموضوع (1, 2, 3...)
`;

    if (!aiClient) {
      return res.json({
        success: true,
        isFallback: true,
        topics: [
          {
            title: 'المقدمة والمفاهيم الأساسية للـ PDF',
            estimatedMinutes: 25,
            description: 'فهم الفكرة العامة والمصطلحات الرئيسية من الملف المرفق',
            sequenceOrder: 1,
          },
          {
            title: 'الشرح التفصيلي والأمثلة المحلولة',
            estimatedMinutes: 35,
            description: 'دراسة الحالات العملية وتحليل القوانين/الأكواد',
            sequenceOrder: 2,
          },
          {
            title: 'حل التدريبات والمسائل التطبيقية',
            estimatedMinutes: 30,
            description: 'تطبيق مباشر واختبار الفهم الذاتي',
            sequenceOrder: 3,
          },
          {
            title: 'المراجعة وتلخيص النقاط الحرجة',
            estimatedMinutes: 20,
            description: 'كتابة ملخص سريع في بطاقات استذكار',
            sequenceOrder: 4,
          },
        ],
      });
    }

    const parts: any[] = [];
    if (pdfBase64) {
      parts.push({
        inlineData: {
          mimeType: pdfMimeType || 'application/pdf',
          data: pdfBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, ''),
        },
      });
    }
    parts.push({ text: promptText });

    const response = await aiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              estimatedMinutes: { type: Type.INTEGER },
              description: { type: Type.STRING },
              sequenceOrder: { type: Type.INTEGER },
            },
            required: ['title', 'estimatedMinutes', 'description', 'sequenceOrder'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    return res.json({ success: true, topics: parsed });
  } catch (err: any) {
    console.error('Error in /api/ai/split-topics:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'حدث خطأ أثناء تقسيم المحاضرة',
      topics: [
        {
          title: 'الجزء الأول من المحاضرة',
          estimatedMinutes: 30,
          description: 'مراجعة الأساسيات',
          sequenceOrder: 1,
        },
        {
          title: 'الجزء الثاني والتطبيقات',
          estimatedMinutes: 30,
          description: 'حل تمارين وتطبيق عملي',
          sequenceOrder: 2,
        },
      ],
    });
  }
});

// Explicit routes for Google Play Store compliance
app.get(['/privacy', '/privacy.html'], (_req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  const filePath = isProd
    ? path.resolve(__dirname, 'dist', 'privacy.html')
    : path.resolve(__dirname, 'public', 'privacy.html');
  res.sendFile(filePath);
});

app.get('/.well-known/assetlinks.json', (_req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  const filePath = isProd
    ? path.resolve(__dirname, 'dist', '.well-known', 'assetlinks.json')
    : path.resolve(__dirname, 'public', '.well-known', 'assetlinks.json');
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(filePath);
});

// Setup Vite middleware in development or serve static in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('/grip-onboarding.html', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'grip-onboarding.html'));
    });
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Grip Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
