import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Wallet,
  Clock,
  Target,
  Droplet,
  Send,
  Loader2,
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowRight,
  Check,
  HelpCircle,
  ChevronRight,
  Flame,
  Lock,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { GripTask, GripIntention, IntentionTag, ExpenseModel, BudgetModel, CategoryModel } from '../types/grip';
import { storage } from '../services/storage';
import { hapticFeedback } from '../services/haptics';

interface UniversalVoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: GripTask) => void;
  onSetWakeUpAlarm: (timeStr: string, dateStr?: string) => void;
  onAddIntention: (text: string, tag?: IntentionTag) => void;
  onLogTracker?: (trackerType: string, value: number) => void;
  onNavigateTab?: (tab: 'calendar' | 'study' | 'trackers' | 'budget') => void;
  isDarkMode: boolean;
  initialTranscript?: string;
}

export interface VoiceCommandResponse {
  success: boolean;
  intent: 'ADD_EXPENSE' | 'SCHEDULE_TASK' | 'SET_WAKE_UP_ALARM' | 'ADD_INTENTION' | 'LOG_TRACKER' | 'ANSWER_QUERY' | 'UNKNOWN';
  summary: string;
  spokenFeedback?: string;
  rawText: string;
  isFallback?: boolean;
  data: {
    expense?: {
      amount: number;
      amountMinor: number;
      title: string;
      categoryName: string;
      note?: string;
    };
    task?: {
      title: string;
      category: 'study' | 'work' | 'sport' | 'sleep' | 'personal' | 'other';
      startTime: string;
      endTime: string;
      type: 'FIXED' | 'FLEXIBLE';
      notes?: string;
    };
    alarm?: {
      time: string;
      title: string;
      notes?: string;
    };
    intention?: {
      text: string;
      tag: 'today' | 'routine' | 'idea' | 'urgent';
    };
    tracker?: {
      trackerType: 'water' | 'deep_work' | 'workout';
      label: string;
      value: number;
    };
    queryAnswer?: {
      text: string;
    };
  };
}

export const UniversalVoiceAssistantModal: React.FC<UniversalVoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  onSetWakeUpAlarm,
  onAddIntention,
  onLogTracker,
  onNavigateTab,
  isDarkMode,
  initialTranscript = '',
}) => {
  const [inputText, setInputText] = useState(initialTranscript);
  const [isListening, setIsListening] = useState(false);
  const [liveInterim, setLiveInterim] = useState('');
  const [speechLang, setSpeechLang] = useState<'ar-EG' | 'ar-SA' | 'en-US'>('ar-EG');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio wave visualization states
  const [audioVolume, setAudioVolume] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Assistant pipeline states
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<VoiceCommandResponse | null>(null);
  const [executedStatus, setExecutedStatus] = useState<string | null>(null);
  const [autoExecuteCountdown, setAutoExecuteCountdown] = useState<number | null>(null);

  // Speech Recognition & Web Audio Refs
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Quick preset voice prompts for user convenience
  const PRESET_COMMANDS = [
    { label: 'سجل مصروف 50 ج قهوة ومشاريب', text: 'سجل مصروف 50 جنيه قهوة ومشاريب', type: 'wallet' },
    { label: 'حطلي ميعاد بكرة 5 العصر مذاكرة فسيولوجي', text: 'حطلي ميعاد بكرة الساعة 5 العصر مذاكرة فسيولوجي', type: 'calendar' },
    { label: 'ظبط منبه الصحوة الساعة 6:30 الصبح', text: 'ظبطلي منبه الصحوة الساعة 6 ونص الصبح', type: 'clock' },
    { label: 'نيتي النهاردة التركيز التام بدون تشتت', text: 'نيتي النهاردة التركيز التام بدون تشتت', type: 'target' },
    { label: 'سجل اني شربت مياه', text: 'سجل اني شربت مياه', type: 'droplet' },
  ];

  // Play pleasant chime using Web Audio
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  // Speak Arabic confirmation using Web Speech Synthesis
  const speakFeedback = useCallback((textToSpeak: string) => {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  // Stop listening
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Merge lingering interim into text
    setLiveInterim((currentInterim) => {
      if (currentInterim.trim()) {
        setInputText((prev) => (prev ? `${prev} ${currentInterim}` : currentInterim).trim());
      }
      return '';
    });
  }, []);

  // Start listening with SpeechRecognition & Audio meter
  const startListening = useCallback(async () => {
    setErrorMsg(null);
    setExecutedStatus(null);
    setParsedResult(null);
    stopListening();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg('المتصفح الحالي لا يدعم التعرف على الصوت مباشرة. يمكنك كتابة طلبك في الحقل أدناه.');
      return;
    }

    try {
      // 1. Microphone visualizer stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }
      } catch (streamErr) {
        console.warn('Microphone waveform visualization not permitted:', streamErr);
      }

      // 2. Start SpeechRecognition
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setRecordingSeconds(0);
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalStr += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (finalStr) {
          setInputText((prev) => (prev ? `${prev} ${finalStr}` : finalStr).trim());
        }
        setLiveInterim(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح.');
          stopListening();
        } else if (event.error === 'no-speech') {
          // Keep listening
        } else {
          setErrorMsg(`تنبيه الصوت: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            // ignore
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Error starting recognition:', err);
      setErrorMsg('تعذر بدء الاستماع الصوتي: ' + (err.message || ''));
      stopListening();
    }
  }, [speechLang, stopListening]);

  // Clean up on close/unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [stopListening]);

  // Execute the understood voice command into app state
  const executeParsedAction = useCallback(
    (result: VoiceCommandResponse) => {
      hapticFeedback.success();
      playChime();

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setAutoExecuteCountdown(null);

      const intent = result.intent;

      // 1. Expense / Budget
      if (intent === 'ADD_EXPENSE' && result.data.expense) {
        const expData = result.data.expense;
        const allBudgets = storage.getBudgets();
        let activeBudget = allBudgets.find((b) => !b.archived);

        if (!activeBudget) {
          // Auto create active budget if none exists
          const newBudget: BudgetModel = {
            id: 'budget_' + Date.now(),
            name: 'ميزانية الشهر',
            totalMinor: 500000, // 5000 EGP
            currency: 'ج.م',
            startEpochDay: Math.floor(Date.now() / (86400 * 1000)),
            durationDays: 30,
            archived: false,
            createdAt: Date.now(),
          };
          storage.saveBudgets([newBudget]);
          activeBudget = newBudget;
        }

        // Match or add category
        const categories = storage.getCategories();
        let matchedCat = categories.find(
          (c) => c.name.toLowerCase() === expData.categoryName.toLowerCase()
        );

        if (!matchedCat && expData.categoryName && expData.categoryName !== 'أخرى') {
          matchedCat = {
            id: 'cat_' + Date.now(),
            budgetId: activeBudget.id,
            name: expData.categoryName,
            colorIndex: categories.length % 8,
          };
          storage.saveCategories([...categories, matchedCat]);
        }

        const newExpense: ExpenseModel = {
          id: 'exp_' + Date.now(),
          budgetId: activeBudget.id,
          categoryId: matchedCat ? matchedCat.id : null,
          amountMinor: expData.amountMinor || Math.round(expData.amount * 100),
          note: expData.title || expData.note || 'مصروف صوتي',
          createdAt: Date.now(),
        };

        const existingExpenses = storage.getExpenses();
        storage.saveExpenses([newExpense, ...existingExpenses]);

        // Dispatch storage and custom events so open tabs re-render seamlessly
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('grip_expenses_updated'));

        setExecutedStatus(`تم تسجيل المصروف: ${expData.amount} ج.م في ${expData.categoryName} بنجاح.`);
        if (result.spokenFeedback) speakFeedback(result.spokenFeedback);
        return;
      }

      // 2. Schedule Task
      if (intent === 'SCHEDULE_TASK' && result.data.task) {
        const taskData = result.data.task;
        const newTask: GripTask = {
          id: `task-voice-${Date.now()}`,
          title: taskData.title,
          category: taskData.category || 'study',
          startTime: taskData.startTime,
          endTime: taskData.endTime,
          type: taskData.type || 'FLEXIBLE',
          status: 'pending',
          postponeCount: 0,
          notes: taskData.notes || 'تمت جدولته بالمساعد الصوتي',
        };
        onAddTask(newTask);
        setExecutedStatus(`تمت إضافة المهمة للجدول: "${taskData.title}" بنجاح.`);
        if (result.spokenFeedback) speakFeedback(result.spokenFeedback);
        return;
      }

      // 3. Wake-Up Alarm
      if (intent === 'SET_WAKE_UP_ALARM' && result.data.alarm) {
        const alarmData = result.data.alarm;
        onSetWakeUpAlarm(alarmData.time);
        setExecutedStatus(`تم ضبط منبه الصحوة على الساعة ${alarmData.time} بنجاح.`);
        if (result.spokenFeedback) speakFeedback(result.spokenFeedback);
        return;
      }

      // 4. Intention
      if (intent === 'ADD_INTENTION' && result.data.intention) {
        const intData = result.data.intention;
        onAddIntention(intData.text, intData.tag || 'today');
        setExecutedStatus(`تم تسجيل النية: "${intData.text}" بنجاح.`);
        if (result.spokenFeedback) speakFeedback(result.spokenFeedback);
        return;
      }

      // 5. Habits / Tracker
      if (intent === 'LOG_TRACKER' && result.data.tracker) {
        const trData = result.data.tracker;
        if (onLogTracker) {
          onLogTracker(trData.trackerType, trData.value);
        }
        setExecutedStatus(`تم تسجيل العادة: "${trData.label}" بنجاح.`);
        if (result.spokenFeedback) speakFeedback(result.spokenFeedback);
        return;
      }

      // 6. Query Answer
      if (intent === 'ANSWER_QUERY' && result.data.queryAnswer) {
        setExecutedStatus(result.data.queryAnswer.text);
        speakFeedback(result.data.queryAnswer.text);
        return;
      }

      // Default fallback
      setExecutedStatus(result.summary || 'تم استلام الأمر وفهمه بنجاح!');
    },
    [onAddTask, onSetWakeUpAlarm, onAddIntention, onLogTracker, playChime, speakFeedback]
  );

  // Send speech text to AI Server
  const handleProcessVoiceCommand = async (customText?: string) => {
    stopListening();
    const query = (customText || inputText).trim();

    if (!query) {
      setErrorMsg('يرجى التحدث بالميكروفون أو كتابة طلبك أولاً.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setExecutedStatus(null);
    setParsedResult(null);

    try {
      const categories = storage.getCategories().map((c) => c.name);

      const res = await fetch('/api/ai/process-voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speechText: query,
          referenceDate: new Date().toISOString().split('T')[0],
          categories,
        }),
      });

      const data: VoiceCommandResponse = await res.json();

      if (!data.success) {
        throw new Error(data.summary || 'تعذر تحليل الأمر');
      }

      setParsedResult(data);

      // Start 3-second auto-execute countdown
      setAutoExecuteCountdown(3);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      countdownIntervalRef.current = setInterval(() => {
        setAutoExecuteCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            // Execute!
            executeParsedAction(data);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Error processing voice command:', err);
      setErrorMsg(err.message || 'حدث خطأ في فهم الأمر الصوتي.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format time mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[995] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-all animate-fadeIn"
      dir="rtl"
    >
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh] ${
          isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#6D28D9] to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black">المساعد الصوتي</h3>
                <span className="text-[10px] font-black bg-purple-100 dark:bg-purple-900/60 text-[#6D28D9] dark:text-purple-300 px-2 py-0.5 rounded-full">
                  AI Voice
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                افتح المايك واتكلم: يفهم الجداول، المصاريف، النوايا، والمنبه فوراً
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Feedback Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                soundEnabled
                  ? 'border-purple-200 dark:border-purple-800 text-[#6D28D9] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
              title={soundEnabled ? 'الرد الصوتي مفعل' : 'الرد الصوتي صامت'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Main Visualizer & Mic Center */}
          <div
            className={`p-5 rounded-3xl border text-center transition-all relative overflow-hidden ${
              isListening
                ? 'bg-gradient-to-b from-purple-900/40 via-indigo-950/50 to-slate-900 border-purple-500/50 shadow-lg shadow-purple-900/30'
                : isDarkMode
                ? 'bg-slate-800/50 border-slate-700/60'
                : 'bg-purple-50/50 border-purple-100'
            }`}
          >
            {/* Pulsing waves background when listening */}
            {isListening && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div
                  className="w-44 h-44 rounded-full bg-purple-500 animate-ping"
                  style={{ animationDuration: '2s' }}
                />
              </div>
            )}

            {/* Glowing Big Mic Button */}
            <div className="relative inline-block mb-3">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-xl ${
                  isListening
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/40 ring-4 ring-rose-400/30 animate-pulse'
                    : 'bg-gradient-to-tr from-[#6D28D9] to-indigo-600 hover:from-[#7C3AED] hover:to-indigo-500 text-white shadow-purple-600/40'
                }`}
                title={isListening ? 'إيقاف التسجيل' : 'ابدأ التحدث'}
              >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>

              {isListening && (
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>{formatTimer(recordingSeconds)}</span>
                </span>
              )}
            </div>

            {/* Dynamic Status Text */}
            <div>
              <h4 className="text-sm font-black">
                {isListening ? 'أستمع إليك الآن... تكلّم بحريتك' : 'اضغط على المايك وتحدث أو اختر أمراً'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {isListening
                  ? 'يفهم اللهجة المصرية والخليجية: مثل "صرفت 50 جنيه بنزين" أو "حطلي ميعاد بكرة 4 مذاكرة"'
                  : 'يمكنك طلب تسجيل مصروف، إضافة جدول، ضبط منبه الصحوة، أو تدوين نية جديدة'}
              </p>
            </div>

            {/* Live Audio Level Meter */}
            {isListening && (
              <div className="mt-4 flex items-center justify-center gap-1">
                {Array.from({ length: 16 }).map((_, i) => {
                  const barHeight = Math.max(6, Math.min(36, (audioVolume / 100) * 40 * (0.4 + 0.6 * Math.sin(i * 0.5))));
                  return (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-purple-500 to-indigo-300 rounded-full transition-all duration-75"
                      style={{ height: `${barHeight}px` }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Real-time Transcription & Input Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>الكلام المكتوب / المسموع:</span>
              <div className="flex items-center gap-2">
                {/* Language switch */}
                <select
                  value={speechLang}
                  onChange={(e) => setSpeechLang(e.target.value as any)}
                  className="text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ar-EG">لهجة مصرية (ar-EG)</option>
                  <option value="ar-SA">عربية فصحى (ar-SA)</option>
                  <option value="en-US">English (en-US)</option>
                </select>

                {inputText && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputText('');
                      setLiveInterim('');
                      setParsedResult(null);
                      setExecutedStatus(null);
                    }}
                    className="text-slate-400 hover:text-rose-500 text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>مسح</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اكتب أو انطق ما تريد... مثال: 'صرفت 50 جنيه قهوة ومشاريب' أو 'حطلي ميعاد بكرة 4 كيمياء' أو 'نيتي النهاردة التركيز'"
                rows={3}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9] transition font-medium resize-none"
              />

              {liveInterim && (
                <div className="absolute bottom-2.5 right-3 left-3 pointer-events-none text-xs text-purple-600 dark:text-purple-300 bg-purple-500/10 backdrop-blur-xs p-1.5 rounded-lg border border-purple-500/20 truncate animate-pulse font-medium">
                  جاري الاستماع: «{liveInterim}»
                </div>
              )}
            </div>

            {/* Quick Action Button: Process with AI */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleProcessVoiceCommand()}
                disabled={isProcessing || (!inputText.trim() && !liveInterim.trim())}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#6D28D9] hover:bg-[#7C3AED] disabled:opacity-40 text-white font-black text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الفهم والتحليل الذكي...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>تحليل الأمر وتنفيذه الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Preset Chips */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
              <span>أمثلة سريعة للتجربة بضغطة زر:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COMMANDS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(item.text);
                    handleProcessVoiceCommand(item.text);
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-300 text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5"
                >
                  {item.type === 'wallet' && <Wallet className="w-3.5 h-3.5 text-emerald-500" />}
                  {item.type === 'calendar' && <Calendar className="w-3.5 h-3.5 text-blue-500" />}
                  {item.type === 'clock' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                  {item.type === 'target' && <Target className="w-3.5 h-3.5 text-rose-500" />}
                  {item.type === 'droplet' && <Droplet className="w-3.5 h-3.5 text-cyan-500" />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Successfully Executed Banner */}
          {executedStatus && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-fadeIn shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-black">{executedStatus}</span>
                </div>
              </div>

              {/* Navigation Quick Links */}
              <div className="flex items-center gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 text-[11px]">
                {onNavigateTab && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateTab('calendar');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>عرض في الجدول</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateTab('budget');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <Wallet className="w-3 h-3" />
                      <span>عرض في الميزانية</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setInputText('');
                    setParsedResult(null);
                    setExecutedStatus(null);
                  }}
                  className="mr-auto text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Mic className="w-3 h-3" />
                  <span>أمر آخر</span>
                </button>
              </div>
            </div>
          )}

          {/* Parsed AI Result Preview & Countdown execution Card */}
          {parsedResult && !executedStatus && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-slate-50 to-slate-100 dark:from-purple-950/30 dark:via-slate-800/80 dark:to-slate-900 border border-purple-300 dark:border-purple-700 animate-fadeIn">
              {/* Header badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-[#6D28D9] dark:text-purple-300 flex items-center justify-center">
                    {parsedResult.intent === 'ADD_EXPENSE' && <Wallet className="w-3.5 h-3.5 text-emerald-600" />}
                    {parsedResult.intent === 'SCHEDULE_TASK' && <Calendar className="w-3.5 h-3.5 text-blue-600" />}
                    {parsedResult.intent === 'SET_WAKE_UP_ALARM' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                    {parsedResult.intent === 'ADD_INTENTION' && <Target className="w-3.5 h-3.5 text-rose-600" />}
                    {parsedResult.intent === 'LOG_TRACKER' && <Droplet className="w-3.5 h-3.5 text-cyan-600" />}
                    {parsedResult.intent === 'ANSWER_QUERY' && <Lightbulb className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                  <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                    {parsedResult.intent === 'ADD_EXPENSE' && 'مصروف جديد'}
                    {parsedResult.intent === 'SCHEDULE_TASK' && 'مهمة في الجدول'}
                    {parsedResult.intent === 'SET_WAKE_UP_ALARM' && 'منبه الصحوة الحاسم'}
                    {parsedResult.intent === 'ADD_INTENTION' && 'نية جديدة'}
                    {parsedResult.intent === 'LOG_TRACKER' && 'متتبع العادات'}
                    {parsedResult.intent === 'ANSWER_QUERY' && 'إجابة استفسار'}
                  </span>
                </div>

                {autoExecuteCountdown !== null && (
                  <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    تنفيذ تلقائي خلال {autoExecuteCountdown} ثوانٍ...
                  </span>
                )}
              </div>

              {/* Summary text */}
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
                {parsedResult.summary}
              </p>

              {/* Specific details */}
              {parsedResult.intent === 'ADD_EXPENSE' && parsedResult.data.expense && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/50 text-xs space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">المبلغ:</span>
                    <span className="font-black text-purple-600 dark:text-purple-400">
                      {parsedResult.data.expense.amount} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">التصنيف:</span>
                    <span className="font-bold">{parsedResult.data.expense.categoryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الوصف:</span>
                    <span className="font-bold">{parsedResult.data.expense.title}</span>
                  </div>
                </div>
              )}

              {parsedResult.intent === 'SCHEDULE_TASK' && parsedResult.data.task && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/50 text-xs space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">اسم المهمة:</span>
                    <span className="font-black">{parsedResult.data.task.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">النوع:</span>
                    <span className="font-bold flex items-center gap-1">
                      {parsedResult.data.task.type === 'FIXED' ? (
                        <>
                          <Lock className="w-3 h-3 text-purple-600" />
                          <span>موعد ثابت</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 text-indigo-500" />
                          <span>مرن</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">التوقيت:</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400" dir="ltr">
                      {new Date(parsedResult.data.task.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}

              {parsedResult.intent === 'SET_WAKE_UP_ALARM' && parsedResult.data.alarm && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/50 text-xs space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ساعة المنبه:</span>
                    <span className="font-black text-rose-500 font-mono text-sm" dir="ltr">
                      {parsedResult.data.alarm.time}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    منبه الصحوة الحاسم يطلق رنينه مرة واحدة فقط لمنع النوم مجدداً!
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => executeParsedAction(parsedResult)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد وتنفيذ الأمر الآن</span>
                </button>

                {autoExecuteCountdown !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                      setAutoExecuteCountdown(null);
                    }}
                    className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    إلغاء العد التلقائي
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 font-medium">
            متكامل مع محرك Gemini AI ومحرك القواعد المحلي للعمل أوفلاين
          </span>
        </div>
      </div>
    </div>
  );
};
