import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripTask, StudyModule, StudyTopic } from '../types/grip';
import {
  Sparkles,
  Mic,
  MicOff,
  Square,
  RotateCcw,
  Copy,
  Check,
  Radio,
  AudioLines,
  Camera,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  Loader2,
  X,
  Volume2,
  FileUp,
  FileCheck,
  Trash2,
  BookOpen,
  Bell,
  Calendar,
} from 'lucide-react';

interface SmartAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTasks: (tasks: GripTask[]) => void;
  onSaveLectureTopics?: (moduleId: string, lectureTitle: string, topics: StudyTopic[]) => void;
  modules: StudyModule[];
  isDarkMode: boolean;
  initialTab?: TabType;
}

type TabType = 'photo' | 'lecture_pdf' | 'text' | 'voice';

export const SmartAiModal: React.FC<SmartAiModalProps> = ({
  isOpen,
  onClose,
  onSaveTasks,
  onSaveLectureTopics,
  modules,
  isDarkMode,
  initialTab = 'photo',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'photo');

  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const [inputText, setInputText] = useState('');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [schedulePdfBase64, setSchedulePdfBase64] = useState<string | null>(null);
  const [schedulePdfName, setSchedulePdfName] = useState<string | null>(null);
  const [schedulePdfSize, setSchedulePdfSize] = useState<string | null>(null);

  // Lecture Attendance & Automatic Companion Study Session Settings
  const [autoScheduleStudySessions, setAutoScheduleStudySessions] = useState(true);
  const [studyHoursPerLecture, setStudyHoursPerLecture] = useState(2);
  const [enableLectureAlarm, setEnableLectureAlarm] = useState(true);

  // Real Web Speech Recognition & Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [liveInterim, setLiveInterim] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0);
  const [audioBars, setAudioBars] = useState<number[]>([18, 30, 45, 25, 60, 35, 22, 50, 65, 40, 28, 18]);
  const [speechLang, setSpeechLang] = useState<'ar-EG' | 'ar-SA' | 'en-US'>('ar-EG');
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Audio & Speech Refs
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const isRecordingRef = useRef(false);

  // Stop Voice Recording
  const stopVoiceRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);

    // Stop SpeechRecognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    // Stop Timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop Audio Stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Close Audio Context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // Stop animation frame
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Commit any lingering interim text into inputText
    setLiveInterim((currentInterim) => {
      if (currentInterim.trim()) {
        setInputText((prev) => (prev ? prev.trim() + ' ' : '') + currentInterim.trim());
      }
      return '';
    });

    setAudioVolume(0);
    setAudioBars([15, 22, 18, 15, 24, 16, 20, 18, 25, 20, 16, 14]);
  }, []);

  // Start Voice Recording (Web Speech API + Web Audio API Analyser)
  const startVoiceRecording = useCallback(async () => {
    setVoiceError(null);
    setLiveInterim('');

    // 1. Web Audio API for sound waves & real-time volume
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioMeters = () => {
            if (!isRecordingRef.current) return;
            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            const barsCount = 12;
            const newBars: number[] = [];
            const step = Math.max(1, Math.floor(dataArray.length / barsCount));
            for (let i = 0; i < barsCount; i++) {
              const val = dataArray[i * step] || 0;
              sum += val;
              newBars.push(Math.max(14, Math.min(100, Math.round((val / 255) * 100))));
            }
            const avg = Math.min(100, Math.round((sum / dataArray.length / 255) * 100));
            setAudioVolume(avg);
            setAudioBars(newBars);

            animFrameRef.current = requestAnimationFrame(updateAudioMeters);
          };
          animFrameRef.current = requestAnimationFrame(updateAudioMeters);
        }
      }
    } catch (audioErr: any) {
      console.warn('Microphone stream access note:', audioErr);
      if (audioErr.name === 'NotAllowedError' || audioErr.name === 'PermissionDeniedError') {
        setVoiceError('يرجى السماح بالوصول إلى الميكروفون في المتصفح للتسجيل المباشر.');
        return;
      }
    }

    // 2. Web Speech Recognition API
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      // Browser without SpeechRecognition
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      setVoiceError(
        'المتصفح الحالي لا يدعم Web Speech API المباشر. يمكنك استخدام النماذج الصوتية الجاهزة أدناه بالعامية أو الكتابة مباشرة.'
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        isRecordingRef.current = true;
        setRecordingSeconds(0);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (finalChunk.trim()) {
          setInputText((prev) => (prev ? prev.trim() + ' ' : '') + finalChunk.trim());
        }
        setLiveInterim(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError('تم حظر الوصول إلى الميكروفون. يرجى تفعيل إذن الميكروفون في إعدادات المتصفح.');
          stopVoiceRecording();
        } else if (event.error === 'network') {
          setVoiceError('حدث خطأ في شبكة التعرف على الصوت. يرجى التحقق من الاتصال بالإنترنت.');
        } else if (event.error !== 'no-speech') {
          setVoiceError(`ملاحظة التعرف الصوتي: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          // Restart to keep continuous listening
          try {
            recognition.start();
          } catch {
            // Ignore collision
          }
        } else {
          setIsRecording(false);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Error starting recognition:', err);
      setVoiceError('تعذر بدء الاستماع الصوتي: ' + (err.message || ''));
      stopVoiceRecording();
    }
  }, [speechLang, stopVoiceRecording]);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      stopVoiceRecording();
    };
  }, [stopVoiceRecording]);

  // Format timer seconds into mm:ss
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Lecture PDF splitter fields
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id || '');
  const [lectureTitle, setLectureTitle] = useState('المحاضرة 3: الدوائر الكهربية المتقدمة');
  const [pdfInputMode, setPdfInputMode] = useState<'upload' | 'text'>('upload');
  const [uploadedPdfBase64, setUploadedPdfBase64] = useState<string | null>(null);
  const [uploadedPdfName, setUploadedPdfName] = useState<string | null>(null);
  const [uploadedPdfSize, setUploadedPdfSize] = useState<string | null>(null);
  const [pdfContentText, setPdfContentText] = useState(
    'محتوى المحاضرة: قوانين كيرشوف للجهد والتيار، تحليل الدوائر المعقدة بطريقة التيارات الحلقية، تحليل العقد، ونظرية ثيفينين ونورتون مع أمثلة تطبيقية وتدريبات عملية.'
  );
  const [minTopicMinutes, setMinTopicMinutes] = useState(20);
  const [maxTopicMinutes, setMaxTopicMinutes] = useState(40);

  // AI loading and extracted review stage
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedTasksReview, setExtractedTasksReview] = useState<GripTask[] | null>(null);
  const [extractedTopicsReview, setExtractedTopicsReview] = useState<StudyTopic[] | null>(null);

  if (!isOpen) return null;

  // Egyptian dialect voice presets
  const handleSelectPreset = (text: string) => {
    setInputText(text);
  };

  // Unified Schedule file handler (supports image and PDF schedules)
  const handleScheduleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchedulePdfBase64(reader.result as string);
        setSchedulePdfName(file.name);
        setSchedulePdfSize((file.size / (1024 * 1024)).toFixed(2) + ' ميجابايت');
        setUploadedImageBase64(null);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageBase64(reader.result as string);
        setSchedulePdfBase64(null);
        setSchedulePdfName(null);
        setSchedulePdfSize(null);
      };
      reader.readAsDataURL(file);
    } else {
      setErrorMessage('يرجى اختيار صورة أو ملف PDF صالح لجدول المحاضرات');
    }
  };

  const handleRemoveScheduleFile = () => {
    setUploadedImageBase64(null);
    setSchedulePdfBase64(null);
    setSchedulePdfName(null);
    setSchedulePdfSize(null);
  };

  // PDF topic splitter file handler
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('يرجى اختيار ملف PDF صالح بصيغة (.pdf)');
        return;
      }
      setErrorMessage(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPdfBase64(reader.result as string);
        setUploadedPdfName(file.name);
        setUploadedPdfSize((file.size / (1024 * 1024)).toFixed(2) + ' ميجابايت');
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        if (!lectureTitle || lectureTitle === 'المحاضرة 3: الدوائر الكهربية المتقدمة') {
          setLectureTitle(cleanName);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePdf = () => {
    setUploadedPdfBase64(null);
    setUploadedPdfName(null);
    setUploadedPdfSize(null);
  };

  // Submit AI Request
  const handleExecuteAi = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (activeTab === 'lecture_pdf') {
        // Topic Splitting
        const res = await fetch('/api/ai/split-topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleTitle: modules.find((m) => m.id === selectedModuleId)?.title || 'المادة الدراسية',
            lectureTitle,
            contentText: pdfInputMode === 'text' ? pdfContentText : undefined,
            pdfBase64: uploadedPdfBase64,
            pdfMimeType: 'application/pdf',
            minDuration: minTopicMinutes,
            maxDuration: maxTopicMinutes,
          }),
        });
        const data = await res.json();
        if (data.topics && Array.isArray(data.topics)) {
          const formattedTopics: StudyTopic[] = data.topics.map((t: any, idx: number) => ({
            id: `top-ai-${Date.now()}-${idx}`,
            lectureId: `lec-temp-${Date.now()}`,
            title: t.title,
            estimatedMinutes: t.estimatedMinutes || 30,
            isCompleted: false,
            sequenceOrder: t.sequenceOrder || idx + 1,
            description: t.description || 'موضوع مستخرج بالذكاء الاصطناعي',
          }));
          setExtractedTopicsReview(formattedTopics);
        } else {
          throw new Error('لم يتم استخراج مواضيع صالحة');
        }
      } else {
        // Schedule / Task Extraction
        const res = await fetch('/api/ai/extract-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptText: inputText,
            imageBase64: uploadedImageBase64,
            imageMimeType: 'image/jpeg',
            pdfBase64: schedulePdfBase64,
            pdfMimeType: 'application/pdf',
            autoScheduleStudySessions,
            studyHoursPerLecture,
            referenceDate: new Date().toISOString().split('T')[0],
          }),
        });
        const data = await res.json();
        if (data.tasks && Array.isArray(data.tasks)) {
          const rawTasks = data.tasks;
          const resultList: GripTask[] = [];

          rawTasks.forEach((t: any, idx: number) => {
            const isLecture =
              (t.title && /محاضرة|حضور/i.test(t.title)) ||
              (t.type === 'FIXED' && t.category === 'study');

            const lectureAlarmNote = enableLectureAlarm
              ? 'حضور بالكلية • منبه وتذكير قبل المحاضرة بـ 15 دقيقة'
              : 'حضور بالكلية';

            const formatted: GripTask = {
              id: `task-ai-${Date.now()}-${idx}`,
              title: t.title || 'مهمة مستخرجة',
              category: t.category || 'study',
              startTime: t.startTime || new Date(Date.now() + 3600000 * (idx + 1)).toISOString(),
              endTime: t.endTime || new Date(Date.now() + 3600000 * (idx + 2)).toISOString(),
              type: t.type === 'FIXED' ? 'FIXED' : 'FLEXIBLE',
              status: 'pending',
              notes: isLecture
                ? `${t.notes || ''} • ${lectureAlarmNote}`.replace(/^[\s•]+|[\s•]+$/g, '')
                : t.notes || 'تمت إضافتها عبر الجدولة الذكية',
              postponeCount: 0,
            };

            resultList.push(formatted);

            // إذا كان موعد محاضرة والمستخدم اختار جدولة جلسة مذاكرة تلقائية (ساعتان لكل محاضرة):
            if (isLecture && autoScheduleStudySessions) {
              const cleanSubject = t.title
                .replace(/محاضرة|\(حضور كليّة\)|\(حضور\)|\(ثابت\)/gi, '')
                .trim() || 'المحاضرة';

              const alreadyHasStudy = rawTasks.some(
                (other: any) =>
                  other !== t &&
                  other.title &&
                  other.title.includes(cleanSubject) &&
                  other.type === 'FLEXIBLE'
              );

              if (!alreadyHasStudy) {
                const lecEndDate = new Date(formatted.endTime);
                const studyStartDate = new Date(lecEndDate);
                studyStartDate.setHours(Math.max(lecEndDate.getHours() + 2, 17), 0, 0, 0);
                const studyEndDate = new Date(studyStartDate.getTime() + studyHoursPerLecture * 60 * 60 * 1000);

                resultList.push({
                  id: `task-ai-study-${Date.now()}-${idx}`,
                  title: `مذاكرة ومراجعة: ${cleanSubject} (${studyHoursPerLecture === 2 ? 'ساعتان' : `${studyHoursPerLecture} ساعات`})`,
                  category: 'study',
                  startTime: studyStartDate.toISOString(),
                  endTime: studyEndDate.toISOString(),
                  type: 'FLEXIBLE',
                  status: 'pending',
                  notes: `جلسة مذاكرة وتطبيق مخصصة للمحاضرة (${studyHoursPerLecture} س) - مجدولة تلقائياً في التقويم`,
                  postponeCount: 0,
                });
              }
            }
          });

          setExtractedTasksReview(resultList);
        } else {
          throw new Error('لم يتم العثور على مهام في الإدخال');
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'حدث خطأ أثناء معالجة الذكاء الاصطناعي');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm Save Tasks
  const handleConfirmSaveTasks = () => {
    if (extractedTasksReview) {
      onSaveTasks(extractedTasksReview);
      setExtractedTasksReview(null);
      onClose();
    }
  };

  // Confirm Save Topics
  const handleConfirmSaveTopics = () => {
    if (extractedTopicsReview && onSaveLectureTopics && selectedModuleId) {
      onSaveLectureTopics(selectedModuleId, lectureTitle, extractedTopicsReview);
      setExtractedTopicsReview(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" dir="rtl">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 transition-all shadow-2xl relative ${isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#6D28D9]/10 text-[#6D28D9] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#7C3AED]" />
          </div>
          <div>
            <h2 className="text-xl font-black">الجدولة الذكية (Smart Scheduling)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ارفع صورة جدولك، أو ملف PDF، أو تحدث بصوتك، أو اكتب مهامك لتحويلها لجدول منظم فوراً.
            </p>
          </div>
        </div>

        {/* REVIEW SCREEN STAGE (Lecture Attendance + Paired Study Sessions) */}
        {extractedTasksReview ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-purple-950 dark:text-purple-200">
                    تم استخراج الجدول: المحاضرات الحضورية وجلسات المذاكرة المقترنة
                  </h4>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                    {extractedTasksReview.filter((t) => t.type === 'FIXED' && t.category === 'study').length} محاضرات حضور مع منبه •{' '}
                    {extractedTasksReview.filter((t) => t.type === 'FLEXIBLE' && t.category === 'study').length} جلسات مذاكرة وتطبيق (ساعتان)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExtractedTasksReview(null)}
                className="text-xs text-purple-600 dark:text-purple-300 underline font-bold cursor-pointer self-start sm:self-auto"
              >
                تعديل الإدخال
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {extractedTasksReview.map((t, idx) => {
                const isLecture =
                  (t.title && /محاضرة|حضور/i.test(t.title)) ||
                  (t.type === 'FIXED' && t.category === 'study');
                const isStudySession =
                  (t.title && /مذاكرة|مراجعة/i.test(t.title)) ||
                  (!isLecture && t.category === 'study');

                return (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-2xl border transition ${
                      isLecture
                        ? 'border-indigo-300/80 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20'
                        : isStudySession
                        ? 'border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                    } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
                  >
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {isLecture ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>حضور كليّة (موعد ثابت)</span>
                          </span>
                        ) : isStudySession ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>جلسة مذاكرة وتطبيق (ساعتان)</span>
                          </span>
                        ) : null}

                        {isLecture && enableLectureAlarm && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            <span>منبه قبل المحاضرة بـ 15 د</span>
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        value={t.title}
                        onChange={(e) => {
                          const updated = [...extractedTasksReview];
                          updated[idx].title = e.target.value;
                          setExtractedTasksReview(updated);
                        }}
                        className="w-full text-xs font-black bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:outline-none"
                      />

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                        <span>
                          {new Date(t.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(t.endTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {t.notes && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-xs">{t.notes}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...extractedTasksReview];
                          updated[idx].type = updated[idx].type === 'FIXED' ? 'FLEXIBLE' : 'FIXED';
                          setExtractedTasksReview(updated);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          t.type === 'FIXED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                        title="تغيير بين موعد ثابت وموعد مرن"
                      >
                        {t.type === 'FIXED' ? 'ثابت' : 'مرن'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = extractedTasksReview.filter((_, i) => i !== idx);
                          setExtractedTasksReview(updated.length > 0 ? updated : null);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="حذف هذه الجلسة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleConfirmSaveTasks}
                className="flex-1 py-3 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white font-black text-xs shadow-md transition cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد وحفظ جدول المحاضرات والمذاكرة في التقويم ({extractedTasksReview.length} جلسة)</span>
              </button>
              <button
                type="button"
                onClick={() => setExtractedTasksReview(null)}
                className="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold transition cursor-pointer"
              >
                رجوع
              </button>
            </div>
          </div>
        ) : extractedTopicsReview ? (
          /* REVIEW SCREEN FOR LECTURE TOPICS */
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                شاشة مراجعة المواضيع المقسمة (20-40 دقيقة لكل موضوع):
              </span>
              <button
                onClick={() => setExtractedTopicsReview(null)}
                className="text-xs text-emerald-600 underline font-bold cursor-pointer"
              >
                تعديل
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {extractedTopicsReview.map((topic, idx) => (
                <div
                  key={topic.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                      {idx + 1}. {topic.title}
                    </span>
                    <span className="text-[10px] text-slate-400">{topic.description}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-[#6D28D9] dark:text-purple-300 text-xs font-black">
                    {topic.estimatedMinutes} دقيقة
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleConfirmSaveTopics}
                className="flex-1 py-3 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-md cursor-pointer"
              >
                حفظ المواضيع في المادة ({modules.find((m) => m.id === selectedModuleId)?.title})
              </button>
              <button
                onClick={() => setExtractedTopicsReview(null)}
                className="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold cursor-pointer"
              >
                رجوع
              </button>
            </div>
          </div>
        ) : (
          /* INPUT TABS */
          <div>
            {/* Tabs Selector */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mb-5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('photo')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'photo' ? 'bg-[#6D28D9] text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>رفع جدول (صورة / PDF)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('lecture_pdf')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'lecture_pdf' ? 'bg-[#6D28D9] text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>تقسيم محاضرة (PDF)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'text' ? 'bg-[#6D28D9] text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>كتابة مهام</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('voice')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'voice' ? 'bg-[#6D28D9] text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>تسجيل صوتي</span>
              </button>
            </div>

            {/* TAB 1: TEXT */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    rows={4}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="اكتب مهامك بالعامية أو الفصحى (مثال: عايز أذاكر فيزياء بكرة من ٤ ل ٦ وبعدها تمرين ساعة، وعندي محاضرة كيمياء ثابتة الجمعة من ٩ ل ١١)... أو استخدم زر الإملاء الصوتي"
                    className="w-full p-3.5 pr-3.5 pl-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                  />

                  {/* Inline Quick Mic Dictation Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isRecording) {
                        stopVoiceRecording();
                      } else {
                        startVoiceRecording();
                      }
                    }}
                    className={`absolute bottom-3 left-3 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30'
                        : 'bg-purple-100 dark:bg-purple-950 text-[#6D28D9] dark:text-purple-300 hover:bg-purple-200'
                    }`}
                    title={isRecording ? 'إيقاف الإملاء الصوتي' : 'إملاء صوتي مباشر'}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>{formatTime(recordingSeconds)}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>إملاء</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live stream text preview when dictating in text tab */}
                {isRecording && liveInterim && (
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="font-bold">جاري التقاط:</span>
                    <span className="font-semibold italic">"{liveInterim}"</span>
                  </div>
                )}

                {/* Quick Presets */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">أمثلة سريعة بالعامية المصرية:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        handleSelectPreset('عندي فسيولوجي بكرة من 4 ل 6 وبعدها تمرين ساعة في النادي')
                      }
                      className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-purple-300 text-[11px] font-semibold border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 transition"
                    >
                      "عندي فسيولوجي بكرة من 4 ل 6"
                    </button>
                    <button
                      onClick={() =>
                        handleSelectPreset('عايز أذاكر فيزياء بكرة من ٤ ل ٦ وبعدها تمرين ساعة في النادي')
                      }
                      className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-purple-300 text-[11px] font-semibold border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 transition"
                    >
                      "عايز أذاكر فيزياء بكرة من ٤ ل ٦ وبعدها تمرين"
                    </button>
                    <button
                      onClick={() =>
                        handleSelectPreset(
                          'عندي محاضرة خوارزميات ثابتة بكرة من ١٠ ل ١٢ وبعدها مراجعة كود ساعتين'
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-purple-300 text-[11px] font-semibold border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 transition"
                    >
                      "محاضرة خوارزميات ثابتة ومراجعة كود"
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VOICE (Real Speech-to-Text & Live Output) */}
            {activeTab === 'voice' && (
              <div className="space-y-5">
                {/* Dialect / Language Selector Bar */}
                <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-500 dark:text-slate-400 pr-2 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#6D28D9]" />
                    <span>لهجة التحدث:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSpeechLang('ar-EG');
                        if (isRecording) {
                          stopVoiceRecording();
                          setTimeout(() => startVoiceRecording(), 200);
                        }
                      }}
                      className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                        speechLang === 'ar-EG'
                          ? 'bg-[#6D28D9] text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      لهجة مصرية (ar-EG)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSpeechLang('ar-SA');
                        if (isRecording) {
                          stopVoiceRecording();
                          setTimeout(() => startVoiceRecording(), 200);
                        }
                      }}
                      className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                        speechLang === 'ar-SA'
                          ? 'bg-[#6D28D9] text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      عربية فصحى (ar-SA)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSpeechLang('en-US');
                        if (isRecording) {
                          stopVoiceRecording();
                          setTimeout(() => startVoiceRecording(), 200);
                        }
                      }}
                      className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                        speechLang === 'en-US'
                          ? 'bg-[#6D28D9] text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* THE MICROPHONE STAGE */}
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/40 dark:to-[#111827] text-center flex flex-col items-center gap-4 relative overflow-hidden shadow-sm">
                  {/* Subtle Background Glow when recording */}
                  {isRecording && (
                    <div className="absolute inset-0 bg-rose-500/5 pointer-events-none animate-pulse"></div>
                  )}

                  {/* Big Circular Microphone Button */}
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing Radar Ring when active */}
                    {isRecording && (
                      <>
                        <span className="absolute w-28 h-28 rounded-full bg-rose-500/20 animate-ping"></span>
                        <span className="absolute w-24 h-24 rounded-full bg-rose-500/30 animate-pulse"></span>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (isRecording) {
                          stopVoiceRecording();
                        } else {
                          startVoiceRecording();
                        }
                      }}
                      className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-xl ${
                        isRecording
                          ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-500/50 scale-105 ring-4 ring-rose-200 dark:ring-rose-900/60'
                          : 'bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] hover:from-[#5B21B6] hover:to-[#7C3AED] text-white hover:scale-105 shadow-purple-600/30'
                      }`}
                      title={isRecording ? 'اضغط لإيقاف التسجيل' : 'اضغط لبدء التحدث والتسجيل'}
                    >
                      {isRecording ? (
                        <Square className="w-9 h-9 fill-current animate-pulse" />
                      ) : (
                        <Mic className="w-10 h-10" />
                      )}
                    </button>
                  </div>

                  {/* Status Heading & Instructions */}
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                      {isRecording ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                          <span className="text-rose-600 dark:text-rose-400">جاري الاستماع الآن... تكلم بطلاقة</span>
                        </>
                      ) : (
                        <span>اضغط على المايك للتحدث بالعامية أو الفصحى</span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      {isRecording
                        ? 'تحدث بأي جملة مثل: "عندي فسيولوجي بكرة من 4 ل 6". اضغط على المايك مرة أخرى عند الانتهاء.'
                        : 'يتعرف الذكاء الاصطناعي على الساعات، الأيام، والمصطلحات الدارجة ويحولها لمهام في التقويم.'}
                    </p>
                  </div>

                  {/* Real-time Dynamic Audio Waveform & Timer when recording */}
                  {isRecording ? (
                    <div className="w-full max-w-sm flex flex-col items-center gap-2 pt-1 animate-fadeIn">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-mono font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>مدة التسجيل: {formatTime(recordingSeconds)}</span>
                      </div>

                      {/* Equalizer Frequency Bars */}
                      <div className="flex items-end justify-center gap-1.5 h-10 px-4 py-1">
                        {audioBars.map((val, idx) => (
                          <span
                            key={idx}
                            style={{ height: `${Math.max(15, val)}%` }}
                            className="w-1.5 rounded-full bg-gradient-to-t from-rose-500 to-purple-500 transition-all duration-75"
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="mt-1 px-4 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200 text-xs font-bold border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>إنهاء التسجيل واعتماد النص</span>
                      </button>
                    </div>
                  ) : null}

                  {/* Error Notification Banner if any */}
                  {voiceError && (
                    <div className="w-full p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2 text-right">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span className="flex-1">{voiceError}</span>
                    </div>
                  )}
                </div>

                {/* THE SPEECH OUTPUT SECTION ("و يظهر إلى بقوله تحت") */}
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
                  {/* Card Header */}
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AudioLines className="w-4 h-4 text-[#6D28D9]" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                        النص الملتقط بالصوت (Live Speech-to-Text)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isRecording ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-black animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          جاري الاستماع والكتابة اللحظية
                        </span>
                      ) : inputText ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                          <CheckCircle2 className="w-3 h-3" />
                          تم التقاط {inputText.split(/\s+/).filter(Boolean).length} كلمة
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">بانتظار كلامك...</span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    {/* If currently recording and speaking, show real-time stream */}
                    {isRecording ? (
                      <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/50 min-h-[90px] text-xs font-semibold leading-relaxed">
                        {inputText ? (
                          <span className="text-slate-800 dark:text-slate-100">{inputText} </span>
                        ) : null}
                        {liveInterim ? (
                          <span className="text-[#6D28D9] dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded font-bold animate-pulse">
                            {liveInterim}
                          </span>
                        ) : !inputText ? (
                          <span className="text-slate-400 italic">ابدأ بالتحدث الآن... سيظهر كلامك هنا فور نطقه!</span>
                        ) : null}
                        <span className="inline-block w-2 h-4 bg-[#6D28D9] mr-1 animate-pulse align-middle"></span>
                      </div>
                    ) : inputText ? (
                      /* When stopped and text exists: Editable textarea */
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="النص الذي قلته..."
                          className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6D28D9] leading-relaxed"
                        />

                        {/* Quick action toolbar for captured text */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(inputText);
                                  setCopiedFeedback(true);
                                  setTimeout(() => setCopiedFeedback(false), 1500);
                                }
                              }}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              {copiedFeedback ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span>تم النسخ!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>نسخ النص</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setInputText('');
                                setLiveInterim('');
                              }}
                              className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>مسح</span>
                            </button>

                            <button
                              type="button"
                              onClick={startVoiceRecording}
                              className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-purple-300 hover:bg-purple-100 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Mic className="w-3 h-3" />
                              <span>تسجيل المزيد بالصوت</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleExecuteAi}
                            disabled={isLoading}
                            className="px-4 py-1.5 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>استخراج المهام بالذكاء الاصطناعي</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Empty State with instant dialect examples */
                      <div className="py-6 px-4 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-[#6D28D9] dark:text-purple-300 flex items-center justify-center mx-auto">
                          <Mic className="w-6 h-6" />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-700 dark:text-slate-200">
                            لا يوجد كلام مسجل بعد
                          </h5>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            اضغط على زر المايك بالأعلى وتحدث، أو اختر من النماذج السريعة للتجربة:
                          </p>
                        </div>

                        {/* Interactive Clickable Dialect Samples */}
                        <div className="flex flex-wrap justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() =>
                              setInputText('عندي فسيولوجي بكرة من 4 ل 6 وبعدها كيمياء')
                            }
                            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-purple-300 text-[11px] font-semibold border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition cursor-pointer"
                          >
                            "عندي فسيولوجي بكرة من 4 ل 6"
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setInputText(
                                'عايز أذاكر شابتر ١ كيمياء عضوية اليوم الساعة ٥ العصر لمدة ساعتين وبعدها راحة'
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-purple-300 text-[11px] font-semibold border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition cursor-pointer"
                          >
                            "كيمياء عضوية الساعة ٥ العصر لمدة ساعتين"
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setInputText(
                                'عندي محاضرة خوارزميات ثابتة بكرة من ١٠ ل ١٢ وبعدها تمرين في النادي'
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-purple-300 text-[11px] font-semibold border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition cursor-pointer"
                          >
                            "محاضرة خوارزميات ثابتة بكرة من ١٠ ل ١٢"
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SCHEDULE FILE UPLOAD (Image or PDF) */}
            {activeTab === 'photo' && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-4 bg-slate-50/40 dark:bg-slate-900/40">
                  {uploadedImageBase64 ? (
                    <div className="relative w-full max-h-56 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img src={uploadedImageBase64} alt="Schedule preview" className="w-full h-auto object-cover max-h-56" />
                      <button
                        type="button"
                        onClick={handleRemoveScheduleFile}
                        className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 backdrop-blur-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>إزالة أو تغيير الصورة</span>
                      </button>
                    </div>
                  ) : schedulePdfBase64 ? (
                    <div className="w-full p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-xs" title={schedulePdfName || ''}>
                              {schedulePdfName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                              {schedulePdfSize}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 font-medium">
                            تم إدراج جدول المحاضرات كملف PDF بنجاح. سيتم استخراج مواعيد الحضور وتخصيص جلسات المذاكرة.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveScheduleFile}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>إزالة</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-[#6D28D9] dark:text-purple-300 flex items-center justify-center">
                        <Calendar className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          ارفع صورة جدول المحاضرات أو ملف PDF الأكاديمي
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                          يتعرف الذكاء الاصطناعي على أوقات المحاضرات الحضورية بالكلية، ويفعل منبهاً لها، ويجدول تلقائياً ساعتين مذاكرة وتطبيق لكل محاضرة في أوقات الفراغ.
                        </p>
                      </div>
                      <label className="px-5 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs font-black cursor-pointer shadow-md transition flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span>اختيار صورة أو ملف PDF لجدولك</span>
                        <input
                          type="file"
                          accept="image/*,.pdf,application/pdf"
                          onChange={handleScheduleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </>
                  )}
                </div>

                {/* College Lecture & Study Sessions Auto-Scheduler Settings Box */}
                <div className="p-4 rounded-2xl border border-purple-200/80 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <BookOpen className="w-4 h-4 text-[#6D28D9] dark:text-purple-300 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          جدولة جلسة مذاكرة وتطبيق تلقائية لكل محاضرة
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          تخصيص ساعتين مذاكرة في نفس اليوم في وقت الفراغ (مساءً) بعد انتهاء المحاضرة لضمان الإنجاز دون تضارب.
                        </span>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={autoScheduleStudySessions}
                      onChange={(e) => setAutoScheduleStudySessions(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                    />
                  </div>

                  {autoScheduleStudySessions && (
                    <div className="flex items-center justify-between pt-2 border-t border-purple-200/60 dark:border-purple-900/40 text-xs">
                      <span className="text-slate-600 dark:text-slate-300 font-bold">
                        المدة المخصصة لمذاكرة كل محاضرة:
                      </span>
                      <div className="flex items-center gap-1.5 font-bold">
                        {[1.5, 2, 2.5, 3].map((hours) => (
                          <button
                            key={hours}
                            type="button"
                            onClick={() => setStudyHoursPerLecture(hours)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                              studyHoursPerLecture === hours
                                ? 'bg-[#6D28D9] text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {hours === 2 ? 'ساعتان (موصى به)' : `${hours} س`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-purple-200/60 dark:border-purple-900/40">
                    <div className="flex items-start gap-2.5">
                      <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          تفعيل منبه وتذكير قبل موعد المحاضرة (15 دقيقة)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          تنبيه تلقائي قبل بداية وقت الحضور في الكلية للتجهيز في الموعد المحدد.
                        </span>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={enableLectureAlarm}
                      onChange={(e) => setEnableLectureAlarm(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: LECTURE PDF TOPIC SPLITTER */}
            {activeTab === 'lecture_pdf' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">اختر المادة (Module):</label>
                    <select
                      value={selectedModuleId}
                      onChange={(e) => setSelectedModuleId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                    >
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">عنوان المحاضرة:</label>
                    <input
                      type="text"
                      value={lectureTitle}
                      onChange={(e) => setLectureTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* PDF Input Mode Switcher */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-500">طريقة إدخال المحاضرة:</span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPdfInputMode('upload')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        pdfInputMode === 'upload'
                          ? 'bg-[#6D28D9] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                      }`}
                    >
                      رفع ملف PDF مباشر (موصى به)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfInputMode('text')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        pdfInputMode === 'text'
                          ? 'bg-[#6D28D9] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                      }`}
                    >
                      كتابة أو لصق الفهرس نصياً
                    </button>
                  </div>
                </div>

                {/* PDF Dropzone / File Picker */}
                {pdfInputMode === 'upload' ? (
                  <div>
                    {!uploadedPdfBase64 ? (
                      <label className="w-full p-6 sm:p-8 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-700/80 bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50/80 dark:hover:bg-purple-950/40 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-150 group">
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/60 text-[#6D28D9] dark:text-purple-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <FileUp className="w-7 h-7 text-[#7C3AED]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            اضغط هنا لإدراج أو رفع ملف الـ PDF الخاص بالمحاضرة
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            يدعم مذكرات المحاضرات، سلايدات الـ PDF، والكتب الأكاديمية بصيغة (.pdf)
                          </p>
                        </div>
                        <span className="px-5 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs font-bold shadow-md shadow-purple-900/20 transition flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          <span>تصفح واختيار ملف PDF من جهازك</span>
                        </span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handlePdfUpload}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 animate-fadeIn">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center">
                            <FileCheck className="w-6 h-6 text-emerald-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-xs" title={uploadedPdfName || ''}>
                                {uploadedPdfName}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                                {uploadedPdfSize}
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 font-medium">
                              تم إدراج ملف الـ PDF بنجاح. سيقوم الذكاء الاصطناعي بتحليله وتقسيمه إلى جلسات (20-40 دقيقة).
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRemovePdf}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>إزالة الملف</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      فهرس أو محتوى الـ PDF / الموضوعات الرئيسية:
                    </label>
                    <textarea
                      rows={3}
                      value={pdfContentText}
                      onChange={(e) => setPdfContentText(e.target.value)}
                      placeholder="الصق عناوين الفصول أو المنهج هنا..."
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs font-bold">
                  <span>حدود مدة الموضوع الإلزامية:</span>
                  <span className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-[#6D28D9] dark:text-purple-300">
                    {minTopicMinutes} إلى {maxTopicMinutes} دقيقة للجلسة الواحدة
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleExecuteAi}
                className="px-6 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التحليل واستخراج الجدول...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>معالجة وعرض شاشة المراجعة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
