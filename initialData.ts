import { GripTask, StudyModule, GripSettings, DailyTrackerRecord } from '../types/grip';

const now = new Date();
const todayStr = now.toISOString().split('T')[0];

function createDate(offsetHours: number, offsetMinutes: number = 0): string {
  const d = new Date();
  d.setHours(d.getHours() + offsetHours);
  d.setMinutes(d.getMinutes() + offsetMinutes);
  d.setSeconds(0);
  return d.toISOString();
}

function createExactToday(hours: number, minutes: number = 0): string {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export const DEFAULT_SETTINGS: GripSettings = {
  freeWindowMinutes: 4,
  baseHoldSeconds: 10,
  midHoldSeconds: 20,
  maxHoldSeconds: 30,
  emergencyExitSeconds: 60,
  allowEmergencyExit: true,
  isDarkMode: false,
  soundEnabled: true,
  hapticEnabled: true,
  language: 'ar',
  showHijriCalendar: true,
  wakeUpTime: '06:30',
  wakeUpEnabled: true,
};

export const INITIAL_MODULES: StudyModule[] = [
  {
    id: 'mod-med-1',
    title: 'علم الأدوية السريري (Clinical Pharmacology)',
    category: 'العلوم الطبية',
    color: '#EDE9FE', // Lavender
    lectures: [
      {
        id: 'lec-med-1-1',
        moduleId: 'mod-med-1',
        title: 'المحاضرة 1: حركية الدواء والديناميكية الدوائية (Pharmacokinetics)',
        order: 1,
        topics: [
          {
            id: 'top-med-1-1-1',
            lectureId: 'lec-med-1-1',
            title: 'الامتصاص والتوزيع الحيوي للأدوية (ADME Parameters)',
            estimatedMinutes: 30,
            isCompleted: true,
            sequenceOrder: 1,
            description: 'معاملات التصفية الكلوية والحجم التوزيعي Vd والتوافر الحيوي'
          },
          {
            id: 'top-med-1-1-2',
            lectureId: 'lec-med-1-1',
            title: 'مستقبلات الأدوية ومنحنى الاستجابة (Agonist vs Antagonist)',
            estimatedMinutes: 35,
            isCompleted: true,
            sequenceOrder: 2,
            description: 'نظريات الربط والفعالية الدوائية Emax ومؤشر الأمان العلاجي'
          },
          {
            id: 'top-med-1-1-3',
            lectureId: 'lec-med-1-1',
            title: 'حساب جرعات المضادات الحيوية في القصور الكلوي',
            estimatedMinutes: 25,
            isCompleted: false,
            sequenceOrder: 3,
            description: 'تعديل جرعات الفانكومايسين والأمينوغليكوزيدات وفق تصفية الكرياتينين'
          }
        ]
      },
      {
        id: 'lec-med-1-2',
        moduleId: 'mod-med-1',
        title: 'المحاضرة 2: أدوية الجهاز القلبي الوعائي (Cardiovascular Drugs)',
        order: 2,
        topics: [
          {
            id: 'top-med-1-2-1',
            lectureId: 'lec-med-1-2',
            title: 'مثبطات الإنزيم المحول للأنجيوتنسين وحاصرات بيتا (ACEi & Beta Blockers)',
            estimatedMinutes: 40,
            isCompleted: false,
            sequenceOrder: 1,
            description: 'بروتوكولات علاج ارتفاع ضغط الدم وقصور القلب الاحتقاني الحاد'
          },
          {
            id: 'top-med-1-2-2',
            lectureId: 'lec-med-1-2',
            title: 'مضادات التخثر الحديثة (DOACs vs Warfarin)',
            estimatedMinutes: 30,
            isCompleted: false,
            sequenceOrder: 2,
            description: 'إدارة حالات الرجفان الأذيني والوقاية من الانصمام الخثاري'
          }
        ]
      }
    ]
  },
  {
    id: 'mod-med-2',
    title: 'التشريح البشري والأنسجة (Human Anatomy & Histology)',
    category: 'العلوم الأساسية',
    color: '#D1FAE5', // Mint
    lectures: [
      {
        id: 'lec-med-2-1',
        moduleId: 'mod-med-2',
        title: 'المحاضرة 1: تشريح القلب والأوعية الكبرى (Cardiovascular Anatomy)',
        order: 1,
        topics: [
          {
            id: 'top-med-2-1-1',
            lectureId: 'lec-med-2-1',
            title: 'تروية الشرايين التاجية وعقد التوصيل الكهربي (Coronary Circulation)',
            estimatedMinutes: 35,
            isCompleted: true,
            sequenceOrder: 1,
            description: 'تشريح الشريان التاجي الأيسر والأيمن ومناطق الاحتشاء القلبي'
          },
          {
            id: 'top-med-2-1-2',
            lectureId: 'lec-med-2-1',
            title: 'صمامات القلب وحجراته مع المحاكاة السريرية (Heart Chambers & Valves)',
            estimatedMinutes: 30,
            isCompleted: false,
            sequenceOrder: 2,
            description: 'علاقة التشريح المورفولوجي بأصوات التسمع القلبي والنفخات'
          }
        ]
      }
    ]
  },
  {
    id: 'mod-med-3',
    title: 'الباطنة والتشخيص السريري (Internal Medicine)',
    category: 'التدريب السريري',
    color: '#E0F2FE', // Light Sky
    lectures: [
      {
        id: 'lec-med-3-1',
        moduleId: 'mod-med-3',
        title: 'المحاضرة 1: اعتلالات الجهاز التنفسي والغازات الشريانية (ABG Analysis)',
        order: 1,
        topics: [
          {
            id: 'top-med-3-1-1',
            lectureId: 'lec-med-3-1',
            title: 'تفسير غازات الدم الشرياني واضطرابات التوازن الحمضي القلوي',
            estimatedMinutes: 35,
            isCompleted: false,
            sequenceOrder: 1,
            description: 'الحماض الاستقلابي بفجوة الأنيون المرتفعة وتدبيره السريري'
          }
        ]
      }
    ]
  }
];

export const INITIAL_TASKS: GripTask[] = [
  {
    id: 'task-1',
    title: 'مرور سريري ومناقشة الحالات (Hospital Clinical Ward Round)',
    category: 'study',
    startTime: createExactToday(9, 0),
    endTime: createExactToday(11, 0),
    type: 'FIXED',
    status: 'done',
    postponeCount: 0,
    notes: 'مستشفى الجامعة - قسم الباطنة العامة وقسم العناية المتوسطة',
  },
  {
    id: 'task-2',
    title: 'مراجعة علم الأدوية السريري - حساب الجرعات والمضادات الحيوية',
    category: 'study',
    startTime: createDate(-0.2), // Running right now or starting now!
    endTime: createDate(1.2),
    type: 'FLEXIBLE',
    status: 'in_progress',
    postponeCount: 1,
    moduleId: 'mod-med-1',
    topicId: 'top-med-1-1-3',
    notes: 'التركيز العالي بدون تشتت. جلسة مذاكرة صامدة مع نظام الاحتجاز.',
  },
  {
    id: 'task-3',
    title: 'تمرين لياقة بدنية وجري استشفائي',
    category: 'sport',
    startTime: createDate(2),
    endTime: createDate(3),
    type: 'FLEXIBLE',
    status: 'pending',
    postponeCount: 0,
    notes: 'تجديد النشاط والصفاء الذهني لطلبة الطب',
  },
  {
    id: 'task-4',
    title: 'حل أسئلة بنك الحالات السريرية (Clinical Cases Q-Bank)',
    category: 'study',
    startTime: createDate(3.5),
    endTime: createDate(5),
    type: 'FLEXIBLE',
    status: 'pending',
    postponeCount: 0,
    notes: '40 سؤال سريري في تشخيص متلازمات الشرايين التاجية',
  },
  {
    id: 'task-5',
    title: 'مراجعة خفيفة لصور الأشعة والتخطيط القلبي (ECG Review)',
    category: 'personal',
    startTime: createExactToday(21, 30),
    endTime: createExactToday(22, 30),
    type: 'FLEXIBLE',
    status: 'pending',
    postponeCount: 0,
    notes: 'تثبيت الأنماط النمطية للجلطات واضطراب النظم',
  },
  {
    id: 'task-6',
    title: 'نوم عميق وصحي',
    category: 'sleep',
    startTime: createExactToday(23, 0),
    endTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().replace(/T.*/, 'T06:30:00.000Z'),
    type: 'FIXED',
    status: 'pending',
    postponeCount: 0,
    notes: 'إطفاء الشاشات للتعافي العصبي والذاكرة طويلة المدى',
  }
];

export const INITIAL_TRACKER_HISTORY: DailyTrackerRecord[] = [
  { date: '2026-10-01', completedTasks: 4, postponesCount: 8, totalScheduled: 5 },
  { date: '2026-10-02', completedTasks: 5, postponesCount: 6, totalScheduled: 6 },
  { date: '2026-10-03', completedTasks: 5, postponesCount: 5, totalScheduled: 6 },
  { date: '2026-10-04', completedTasks: 6, postponesCount: 4, totalScheduled: 7 },
  { date: '2026-10-05', completedTasks: 6, postponesCount: 3, totalScheduled: 6 },
  { date: '2026-10-06', completedTasks: 7, postponesCount: 2, totalScheduled: 7 },
  { date: '2026-10-07', completedTasks: 6, postponesCount: 1, totalScheduled: 6 },
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  study: { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD', label: 'دراسة' },
  work: { bg: '#FFEDD5', text: '#9A3412', border: '#FDBA74', label: 'عمل' },
  sport: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', label: 'رياضة' },
  sleep: { bg: '#FFE4E6', text: '#9F1239', border: '#FDA4AF', label: 'نوم' },
  wake_up: { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D', label: 'صحوة ⏰' },
  personal: { bg: '#E0F2FE', text: '#075985', border: '#7DD3FC', label: 'شخصي' },
  other: { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB', label: 'أخرى' },
};
