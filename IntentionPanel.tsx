import React, { useState, useEffect, useRef } from 'react';
import { GripIntention, IntentionTag, GripTask } from '../types/grip';
import {
  Sparkles,
  Mic,
  MicOff,
  Plus,
  Check,
  CheckCircle2,
  Trash2,
  X,
  Clock,
  CalendarPlus,
  Volume2,
  AlertCircle,
  Lightbulb,
  Radio,
  ArrowRight,
  Smile,
  Copy,
  RotateCcw,
  Bell,
  Pin,
  Repeat,
} from 'lucide-react';
import {
  requestNotificationPermission,
  updateOngoingAlaBalakNotification,
  isNotificationGranted,
} from '../services/systemNotification';

interface IntentionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  intentions: GripIntention[];
  onAddIntention: (text: string, tag?: IntentionTag, reminderNote?: string) => void;
  onToggleComplete: (id: string) => void;
  onDeleteIntention: (id: string) => void;
  onClearCompleted: () => void;
  onConvertToTask: (intention: GripIntention) => void;
  isDarkMode: boolean;
}

const PRESET_CHIPS = [
  { text: 'شرب كوب ماء كبير', tag: 'routine' as IntentionTag },
  { text: 'راحة ونَفَس عميق لدقيقة', tag: 'routine' as IntentionTag },
  { text: 'مكالمة سريعة لإنهاء أمر معلق', tag: 'urgent' as IntentionTag },
  { text: 'ترتيب مكتبي لمدة دقيقتين', tag: 'idea' as IntentionTag },
  { text: 'مراجعة 5 دقائق من المحاضرة', tag: 'today' as IntentionTag },
  { text: 'كتابة تدوينة أو فكرة في المفكرة', tag: 'idea' as IntentionTag },
];

export const IntentionPanel: React.FC<IntentionPanelProps> = ({
  isOpen,
  onClose,
  intentions,
  onAddIntention,
  onToggleComplete,
  onDeleteIntention,
  onClearCompleted,
  onConvertToTask,
  isDarkMode,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<IntentionTag>('today');
  const [selectedReminder, setSelectedReminder] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInterim, setVoiceInterim] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechLang, setSpeechLang] = useState<'ar-EG' | 'ar-SA' | 'en-US'>('ar-EG');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [celebratedId, setCelebratedId] = useState<string | null>(null);
  const [notifGranted, setNotifGranted] = useState<boolean>(() => isNotificationGranted());

  const handleToggleOngoingNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      await updateOngoingAlaBalakNotification(intentions);
    }
  };

  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  // Clean up speech recognition on unmount or close
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleStartRecording = () => {
    setSpeechError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('المتصفح لا يدعم التعرف على الصوت المباشر. يمكنك كتابة النية بالكيبورد.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceInterim('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          setInputText((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
          setVoiceInterim('');
        } else {
          setVoiceInterim(interim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setSpeechError(`خطأ في التسجيل: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setVoiceInterim('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setSpeechError('تعذر بدء التسجيل الصوتي.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsRecording(false);
    setVoiceInterim('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = (inputText + (voiceInterim ? ' ' + voiceInterim : '')).trim();
    if (!trimmed) return;

    if (isRecording) {
      handleStopRecording();
    }

    onAddIntention(trimmed, selectedTag, selectedReminder || undefined);
    setInputText('');
    setVoiceInterim('');
    setSelectedReminder('');
  };

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    if (!currentlyCompleted) {
      setCelebratedId(id);
      setTimeout(() => setCelebratedId(null), 1200);
    }
    onToggleComplete(id);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (!isOpen) return null;

  const activeIntentions = intentions.filter((i) => !i.completed);
  const completedIntentions = intentions.filter((i) => i.completed);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn cursor-pointer"
      />

      {/* Drawer Container */}
      <div
        className={`relative z-10 w-full max-w-lg h-full shadow-2xl flex flex-col transition-transform duration-300 animate-slideLeft border-l ${
          isDarkMode
            ? 'bg-slate-900 text-white border-slate-800'
            : 'bg-white text-slate-900 border-slate-200'
        }`}
        dir="rtl"
      >
        {/* Top Header - أصفر / عنبري */}
        <div className="p-4 sm:p-5 border-b border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between gap-3 bg-amber-50/70 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-md shadow-amber-900/20">
              <Lightbulb className="w-5 h-5 animate-pulse text-amber-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  صندوق النوايا وتفريغ الذهن
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200/80 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  {activeIntentions.length} نشطة
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                سجّل أي نية أو فكرة فوراً بالصوت أو الكتابة قبل أن تنساها
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Android Ongoing Notification Shade (إشعار على بالك في ستارة الهاتف) */}
        <div className="px-4 py-2.5 bg-purple-50/80 dark:bg-purple-950/40 border-b border-purple-200/70 dark:border-purple-900/50 flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/70 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Pin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                إشعار ستارة الهاتف (على بالك)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                يظهر أعلى الهاتف عند سحب الشاشة للأسفل لتتذكر نواياك دوماً
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleOngoingNotification}
            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] shrink-0 transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              notifGranted
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50'
            }`}
          >
            {notifGranted ? (
              <>
                <Check className="w-3 h-3 text-purple-200" />
                <span>مفعل بالستارة</span>
              </>
            ) : (
              <>
                <Bell className="w-3 h-3" />
                <span>تثبيت بالستارة</span>
              </>
            )}
          </button>
        </div>

        {/* ADHD Helpful Tip / Reminder */}
        <div className="px-4 py-2 bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>نصيحة ADHD: النوايا مش واجبات.. فرّغ دماغك هنا واختار نية واحدة لما تفضى!</span>
          </div>
        </div>

        {/* Input & Voice Recording Area */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            {/* Main Input Row */}
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isRecording
                    ? 'جاري الاستماع إليك.. تكلم بحرية'
                    : 'ناوي أعمل إيه أو فكرة في بالي دلوقتي...'
                }
                className={`w-full pl-24 pr-4 py-3 rounded-2xl text-sm font-bold border transition outline-hidden ${
                  isRecording
                    ? 'border-red-400 bg-red-50/40 dark:bg-red-950/20 text-red-900 dark:text-red-200 ring-2 ring-red-400/30'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                }`}
              />

              {/* Action Buttons inside Input: Mic & Add */}
              <div className="absolute left-2 flex items-center gap-1.5">
                {/* Voice Dictation Button */}
                <button
                  type="button"
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={`p-2 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    isRecording
                      ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/40'
                      : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/80'
                  }`}
                  title={isRecording ? 'إيقاف التسجيل الصوتي' : 'تسجيل النية بصوتك'}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() && !voiceInterim.trim()}
                  className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-amber-950 font-black transition flex items-center justify-center cursor-pointer shadow-md shadow-amber-900/20 active:scale-95"
                  title="إضافة النية"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Interim voice transcript live feed */}
            {isRecording && voiceInterim && (
              <div className="text-xs text-purple-600 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/40 p-2 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-red-500 animate-ping" />
                <span>سمعت: «{voiceInterim}»</span>
              </div>
            )}

            {speechError && (
              <div className="text-xs text-rose-500 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{speechError}</span>
              </div>
            )}

            {/* Tag Selection & Quick Timings */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 text-[11px] font-bold">النوع:</span>
                {(
                  [
                    { id: 'today', label: 'اليوم', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
                    { id: 'urgent', label: 'عاجل', color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' },
                    { id: 'idea', label: 'فكرة', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
                    { id: 'routine', label: 'روتين', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTag(t.id)}
                    className={`px-2.5 py-1 rounded-xl font-bold transition text-[11px] cursor-pointer ${
                      selectedTag === t.id
                        ? `${t.color} ring-2 ring-[#6D28D9]/40`
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Dialect selector for voice */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-400">اللهجة:</span>
                <select
                  value={speechLang}
                  onChange={(e: any) => setSpeechLang(e.target.value)}
                  className="bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg px-1.5 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-hidden"
                >
                  <option value="ar-EG">مصر (ar-EG)</option>
                  <option value="ar-SA">الخليج/فصحى (ar-SA)</option>
                  <option value="en-US">English (en-US)</option>
                </select>
              </div>
            </div>

            {/* Quick Presets / Dopamine Prompts */}
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-bold mb-1.5">أفكار سريعة بنقرة واحدة:</p>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {PRESET_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onAddIntention(chip.text, chip.tag)}
                    className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer shadow-2xs"
                  >
                    {chip.text}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Intentions List Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Active Intentions Section */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                النوايا الحالية ({activeIntentions.length})
              </span>
              {activeIntentions.length > 0 && (
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                  انقر عند إتمام النية
                </span>
              )}
            </div>

            {activeIntentions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-[#6D28D9] dark:text-purple-300 flex items-center justify-center">
                  <Smile className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  لا توجد نوايا مسجلة حالياً
                </p>
                <p className="text-xs text-slate-400 max-w-xs">
                  سجل أفكارك ونواياك غير المجدولة هنا للرجوع إليها وإنجازها في أي وقت.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeIntentions.map((intent) => {
                  const isCelebrated = celebratedId === intent.id;
                  return (
                    <div
                      key={intent.id}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col gap-2 group ${
                        isCelebrated
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 scale-[1.02]'
                          : isDarkMode
                          ? 'bg-slate-800/80 border-slate-700 hover:border-purple-600/60'
                          : 'bg-white border-slate-200 hover:border-purple-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Checkbox & Text */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => handleToggle(intent.id, false)}
                            className="mt-0.5 w-6 h-6 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center text-emerald-600 transition shrink-0 cursor-pointer active:scale-90"
                            title="تم الإنجاز"
                          >
                            <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed break-words">
                              {intent.text}
                            </p>

                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {/* Tag badge */}
                              {intent.tag === 'urgent' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                                  عاجل
                                </span>
                              )}
                              {intent.tag === 'today' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                                  اليوم
                                </span>
                              )}
                              {intent.tag === 'idea' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                                  فكرة
                                </span>
                              )}
                              {intent.tag === 'routine' && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                  <Repeat className="w-3 h-3" />
                                  <span>روتين</span>
                                </span>
                              )}

                              {/* Time */}
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(intent.createdAt).toLocaleTimeString('ar-EG', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>

                              {intent.reminderNote && (
                                <span className="text-[10px] text-purple-600 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{intent.reminderNote}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions: Convert to Scheduled Task & Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* 1-Click Convert to Calendar Task */}
                          <button
                            onClick={() => onConvertToTask(intent)}
                            className="px-2.5 py-1 rounded-xl text-xs font-black bg-purple-100 dark:bg-purple-900/50 text-[#6D28D9] dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 transition flex items-center gap-1 active:scale-95 cursor-pointer shadow-2xs"
                            title="تحويل لمهمة في جدول التقويم"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">جدولة كـ مهمة</span>
                          </button>

                          <button
                            onClick={() => handleCopy(intent.id, intent.text)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                            title="نسخ النص"
                          >
                            {copiedId === intent.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => onDeleteIntention(intent.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Intentions Section */}
          {completedIntentions.length > 0 && (
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>نوايا تم إنجازها بنجاح ({completedIntentions.length})</span>
                </span>
                <button
                  onClick={onClearCompleted}
                  className="text-[11px] text-slate-400 hover:text-rose-500 transition font-bold"
                >
                  مسح المنجزة
                </button>
              </div>

              <div className="flex flex-col gap-1.5 opacity-80">
                {completedIntentions.map((intent) => (
                  <div
                    key={intent.id}
                    className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => handleToggle(intent.id, true)}
                        className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 cursor-pointer"
                        title="إعادة إلى النشطة"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-xs line-through text-slate-400 font-medium truncate">
                        {intent.text}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteIntention(intent.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>صُمم خصيصاً لمساعدة الذهن على تفريغ الأفكار وعدم نسيان النوايا</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition cursor-pointer"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
};
