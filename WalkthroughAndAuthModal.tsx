import React, { useState, useRef, useEffect } from 'react';
import { GripUser } from '../types/grip';
import {
  Calendar as CalendarIcon,
  Shield,
  Clock,
  Sparkles,
  BookOpen,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Mail,
  User as UserIcon,
  Code2,
  Lock,
  ArrowRight,
  Flame,
  Layers,
  Mic,
  Moon,
  Trophy,
  X,
  Check,
  FileText,
} from 'lucide-react';

interface WalkthroughAndAuthModalProps {
  isOpen: boolean;
  onComplete: (user: GripUser) => void;
  isDarkMode: boolean;
  initialStep?: 'walkthrough' | 'auth';
  onClose?: () => void;
}

// Secret key and internal variables (strictly hidden from user interface)
const DEVELOPER_SECRET_KEY = 'zoda2007';
const INTERNAL_DEVELOPER_EMAIL = 'zodamoda2007@gmail.com';
const INTERNAL_STUDENT_EMAIL = 'student.user@gmail.com';

export function isDeveloperAccess(input: string): boolean {
  // Developer tools exist only in local dev builds (vite dev server). In a production
  // build this is always false, so shipping users can never unlock them by typing a key.
  if (!import.meta.env.DEV) return false;
  const normalized = input.trim().toLowerCase();
  return (
    normalized === DEVELOPER_SECRET_KEY ||
    normalized === INTERNAL_DEVELOPER_EMAIL ||
    normalized === 'zoda2007' ||
    normalized === 'developer@grip.app'
  );
}

export const WalkthroughAndAuthModal: React.FC<WalkthroughAndAuthModalProps> = ({
  isOpen,
  onComplete,
  isDarkMode,
  initialStep = 'walkthrough',
  onClose,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'walkthrough' | 'auth'>(initialStep);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auth form states
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Touch and drag swipe state for horizontal carousel
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Google Sign-In Modal & Selector states
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const slides = [
    {
      id: 'intro',
      badge: 'الفلسفة والشعار',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
      title: 'Hold your focus. Kill the drift.',
      subtitle: 'امسك تركيزك.. واقطع السرحان',
      description:
        'معظم التطبيقات تكتفي بتنبيه لطيف يتجاهله عقلك. Grip مصمم ليجعل المماطلة والتأجيل أكثر إزعاجاً ومجهوداً بدنياً من أداء المهمة نفسها، لاحتواء التسويف وإدمان الدوبامين السريع (Offline-First بالكامل).',
      icon: Shield,
      accentColor: 'from-[#6D28D9] to-indigo-600',
      preview: (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 via-indigo-950/50 to-slate-900 border border-purple-500/30 text-center shadow-lg">
          <div className="w-14 h-14 mx-auto mb-2 rounded-2xl overflow-hidden shadow-md shadow-black/30 border border-slate-700/30 bg-[#2A2D34] flex items-center justify-center">
            <img src="/icon.svg" alt="Grip Logo" className="w-full h-full object-cover" />
          </div>
          <h4 className="text-sm font-black text-white">شاشة الإلزام الصارمة: «يلا خلّصها»</h4>
          <p className="text-[11px] text-purple-200 mt-1">
            ظهور إجباري فوق كل التطبيقات عند حلول وقت المهمة بدون زر هروب سهل
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[10px] text-emerald-300 font-bold">
            <Shield className="w-3.5 h-3.5 text-emerald-300" />
            <span>محلّي بالكامل بدون سحابة تشتتك</span>
          </div>
        </div>
      ),
    },
    {
      id: 'calendar',
      badge: 'التقويم وجدول الحياة',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      title: 'مهام ثابتة ومرنة مع نقل سلس بضغطة مطولة',
      description:
        'تقويم متكامل لليوم بالكامل (مذاكرة، شغل، رياضة، نوم، شخصي). المهام الثابتة لا تتغير، والمرنة ترحل تلقائياً إذا فاتتك. نقل وإعادة جدولة أي مهمة يبدأ بضغطة مطولة (Long Press) لسهولة التمرير والاسكرول دون أي عبث بالجدول.',
      icon: CalendarIcon,
      accentColor: 'from-blue-600 to-indigo-600',
      preview: (
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-right">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1 text-[#6D28D9] dark:text-purple-400">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>اليومي • الأسبوعي • الشهري</span>
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <Moon className="w-3 h-3 text-emerald-500" />
              <span>تقويم هجري وميلادي</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
              <span className="text-[9px] font-black text-purple-700 dark:text-purple-300 block">ثابتة FIXED</span>
              <span className="font-bold text-slate-800 dark:text-white truncate block">محاضرة / عمل</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
              <span className="text-[9px] font-black text-amber-700 dark:text-amber-300 block">مرنة FLEXIBLE</span>
              <span className="font-bold text-slate-800 dark:text-white truncate block">ترحيل تلقائي ذكي</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-purple-100/70 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-[11px]">
            <span className="text-purple-800 dark:text-purple-200 font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>نقل المواعيد: اضغط مطولاً لتحريك المهمة</span>
            </span>
            <span className="text-[10px] bg-[#6D28D9] text-white px-2 py-0.5 rounded-md font-bold">
              اسكرول سهل
            </span>
          </div>
          <div className="text-center pt-0.5">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
              <Check className="w-3 h-3" />
              <span>ميزة «تم بدري»: إلغاء شاشة الإلزام فور إنهائك للمهمة</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'friction',
      badge: 'الاحتكاك المتصاعد',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      title: 'زر «فكرني بعدين» وسلم الاحتجاز',
      description:
        'الزر الوحيد المتاح للتأجيل يتطلب ضغطاً متواصلاً: أول 3 مرات (10ث)، ثم (20ث)، ثم الحد الأقصى (30ث). لو رفعت إصبعك مبكراً يعود العداد للصفر مع اهتزاز تحذيري، وبعدها نافذة حرة 4 دقائق.',
      icon: Clock,
      accentColor: 'from-amber-600 to-rose-600',
      preview: (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-black">
            <Clock className="w-3.5 h-3.5" />
            <span>سلم الاحتجاز: 10ث ← 20ث ← 30ث</span>
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            ممنوع الهروب السريع: رفع الإصبع مبكراً يعيد العداد للصفر فوراً
          </p>
          <div className="flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-300 pt-1 border-t border-amber-500/20">
            <span>نافذة حرة (Free Window) 4 دقائق</span>
            <span>خروج طوارئ خفي (60ث)</span>
          </div>
        </div>
      ),
    },
    {
      id: 'study',
      badge: 'الهيكل الأكاديمي',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      title: 'كتل التركيز الذهبية (20 - 40 دقيقة)',
      description:
        'لمنع رهبة المناهج الكبيرة: تجزئة المحاضرات الطويلة إلى فترات تركيز مدتها بين 20 و40 دقيقة، وهي الفترة الذهبية للدماغ دون تشتت، مع شريط تقدم تلقائي لكل مادة.',
      icon: BookOpen,
      accentColor: 'from-emerald-600 to-teal-600',
      preview: (
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-right">
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-slate-800 dark:text-slate-200">هيكل المادة الدراسية</span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
              نسبة الإنجاز: 65%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[65%]" />
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-700 dark:text-slate-200 text-[11px] font-bold">
              جلسة تركيز ذهبية (30 دقيقة)
            </span>
            <span className="text-[10px] font-bold text-[#6D28D9] dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-1 rounded-lg flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              <span>جدولة فورية</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'smart_insertion_notes',
      badge: 'نوت الإدراج وإدارة الجدول',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
      title: 'نوت وقواعد الإدراج والنقل بضغطة مطولة',
      description:
        'لتجاوز كسل كتابة الجداول يدوياً: تحدث أو اكتب بالعامية، أو أدرج ملفات وملاحظات الـ PDF ليتم تجزئتها لكتل تركيز (20-40 دقيقة)، مع شاشة مراجعة إلزامية (Review First)، ونقل المهام بالضغطة المطولة لحماية التمرير.',
      icon: Sparkles,
      accentColor: 'from-[#6D28D9] to-indigo-600',
      preview: (
        <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80 space-y-2 text-right">
          {/* Note header badge */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black bg-[#6D28D9] text-white px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>نوت الإدراج والجدول</span>
            </span>
            <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">
              صوت • PDF • ضغطة مطولة
            </span>
          </div>

          {/* Note content items */}
          <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-200">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-800/90 border border-purple-100 dark:border-purple-900/40">
              <span className="font-bold text-[#6D28D9] dark:text-purple-400 block text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>نقل المهام بالضغطة المطولة (Long Press):</span>
              </span>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
                يبدأ نقل أي مهمة في الجدول بضغطة مطولة (أو نقر مقبض ⠿) لضمان تمرير واسكرول الجدول بسلاسة تامة دون أي تحريك عشوائي أو عبث بالمواعيد.
              </p>
            </div>

            <div className="p-2 rounded-xl bg-white dark:bg-slate-800/90 border border-purple-100 dark:border-purple-900/40">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block text-[10px] flex items-center gap-1">
                <Mic className="w-3 h-3" />
                <span>الإدخال الصوتي بالعامية والـ AI:</span>
              </span>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
                «عندي بكرة من 10 لـ 12 محاضرة، والجيم الساعة 5، وبالليل هقعد أذاكر ساعتين»
              </p>
            </div>

            <div className="p-2 rounded-xl bg-white dark:bg-slate-800/90 border border-purple-100 dark:border-purple-900/40">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[10px] flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>تقسيم ملفات وملاحظات الـ PDF:</span>
              </span>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
                يلتقط فهرس أو نص المحاضرة ويقسمها لكتل تركيز (20 - 40 دقيقة) تحت المادة مع شاشة مراجعة إلزامية (Review First).
              </p>
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-0.5">
              <span>مراجعة واعتماد قبل الإضافة</span>
              <span>أوفلاين محلي بالكامل</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'trackers',
      badge: 'لوحة الإنجاز الإيجابي',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      title: 'التركيز على الإنجاز والتحسن المستمر',
      description:
        'رسم بياني يقارن بين صعود المهام المنجزة وهبوط معدل التأجيلات، مع عداد الأيام المتتالية (Streak) ونسبة تحسنك وأرقامك القياسية.',
      icon: Trophy,
      accentColor: 'from-amber-500 to-emerald-600',
      preview: (
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-center space-y-2">
          <div className="flex justify-around items-center">
            <div className="text-center">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">+35%</span>
              <span className="text-[10px] text-slate-500 font-bold">نسبة التحسن الأسبوعي</span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <span className="text-xl font-black text-purple-600 dark:text-purple-400 block">7 أيام</span>
              <span className="text-[10px] text-slate-500 font-bold">التزام مستمر (Streak)</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
            شاشة ختام الجلسة تتيح لك تأكيد الإنجاز أو تمديد الوقت (+15 إلى +120 دقيقة)
          </p>
        </div>
      ),
    },
  ];

  const totalSlides = slides.length;

  // Swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setTouchStartX(clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (touchStartX === null || !isSwiping) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const delta = clientX - touchStartX;
    setTouchDeltaX(delta);
  };

  const handleTouchEnd = () => {
    if (!isSwiping || touchStartX === null) return;
    const threshold = 50; // pixels to trigger slide change
    // Note: in RTL layout, swiping left goes forward, swiping right goes back
    if (touchDeltaX < -threshold) {
      // Swiped left
      handleNextSlide();
    } else if (touchDeltaX > threshold) {
      // Swiped right
      handlePrevSlide();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
    setIsSwiping(false);
  };

  const handleNextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      // Finished all slides -> go to auth
      setStep('auth');
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  // Auth handler
  const handleLogin = (selectedInput?: string) => {
    const rawInput = (selectedInput || emailInput).trim();
    if (!rawInput) {
      setAuthError('يرجى إدخال بريدك الإلكتروني للمتابعة');
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const isDev = isDeveloperAccess(rawInput);
      let user: GripUser;

      if (isDev) {
        // Trigger DEVELOPER MODE (Internal and silent)
        user = {
          id: `dev-${Date.now()}`,
          name: nameInput.trim() || 'المطور الرئيسي (Lead Developer)',
          email: INTERNAL_DEVELOPER_EMAIL,
          isDeveloper: true,
          joinedAt: new Date().toISOString(),
        };
      } else {
        // Trigger STANDARD USER MODE (Any standard user, personal or work)
        const userEmail = rawInput.includes('@')
          ? rawInput
          : `${rawInput.replace(/\s+/g, '').toLowerCase()}@gmail.com`;
        const defaultDisplayName = rawInput.includes('@')
          ? rawInput.split('@')[0].replace(/[._]/g, ' ')
          : rawInput;
        const userName = nameInput.trim() || defaultDisplayName;

        user = {
          id: `user-${Date.now()}`,
          name: userName,
          email: userEmail,
          isDeveloper: false,
          joinedAt: new Date().toISOString(),
        };
      }

      setIsSubmitting(false);
      onComplete(user);
    }, 350);
  };

  // One-tap local profile. There is NO online account: data stays on this device.
  const handleGoogleSignIn = (_targetEmail?: string, targetName?: string) => {
    setIsSubmitting(true);
    setAuthError(null);
    setTimeout(() => {
      const localUser: GripUser = {
        id: `local-${Date.now()}`,
        name: (targetName || '').trim() || 'مستخدم Grip',
        email: '',
        isDeveloper: false,
        isGoogleUser: false,
        authProvider: 'guest',
        joinedAt: new Date().toISOString(),
      };
      setIsSubmitting(false);
      onComplete(localUser);
    }, 250);
  };

  return (
    <div
      className="fixed inset-0 z-[990] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-all animate-fadeIn"
      dir="rtl"
    >
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden relative transition-all ${
          isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* ================= STEP 1: HORIZONTAL WALKTHROUGH CAROUSEL ================= */}
        {step === 'walkthrough' && (
          <div className="flex flex-col min-h-[520px]">
            {/* Top Bar with Step counter and Skip button */}
            <div className="px-5 pt-5 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6D28D9] animate-pulse" />
                <span className="text-xs font-bold text-slate-400">
                  الجولة التعريفية ({currentSlide + 1} من {totalSlides})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep('auth')}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline px-2 py-1 rounded-lg transition cursor-pointer"
              >
                تخطي للدخول
              </button>
            </div>

            {/* Horizontal Swipeable Container */}
            <div
              ref={carouselRef}
              className="flex-1 px-5 py-3 select-none touch-pan-y cursor-grab active:cursor-grabbing flex flex-col justify-between"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={handleTouchMove}
              onMouseUp={handleTouchEnd}
            >
              {/* Active Slide Content */}
              <div
                className="transition-all duration-300 transform"
                style={{
                  transform: isSwiping ? `translateX(${touchDeltaX * 0.4}px)` : 'none',
                }}
              >
                {/* Badge */}
                <div className="mb-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-black ${slides[currentSlide].badgeColor}`}
                  >
                    {slides[currentSlide].badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-1">
                  {slides[currentSlide].title}
                </h3>
                {slides[currentSlide].subtitle && (
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {slides[currentSlide].subtitle}
                  </p>
                )}

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {slides[currentSlide].description}
                </p>

                {/* Visual Preview Card */}
                <div className="my-3">{slides[currentSlide].preview}</div>
              </div>

              {/* Swipe hint */}
              <div className="text-center py-1">
                <span className="text-[10px] text-slate-400 font-medium">
                  ← اسحب أفقياً (يمين / شمال) للتنقل بين الشاشات →
                </span>
              </div>
            </div>

            {/* Bottom Controls: Dots Indicator & Next/Prev Buttons */}
            <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
              {/* Previous button */}
              <button
                type="button"
                onClick={handlePrevSlide}
                disabled={currentSlide === 0}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  currentSlide === 0
                    ? 'opacity-30 border-transparent text-slate-400 cursor-not-allowed'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="السابق"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">السابق</span>
              </button>

              {/* Material 3 Capsule Dots Indicator */}
              <div className="flex items-center gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`transition-all duration-200 rounded-full cursor-pointer ${
                      currentSlide === idx
                        ? 'w-6 h-2 bg-[#6D28D9]'
                        : 'w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                    }`}
                    title={`انتقال للشريحة ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Next or Start button */}
              <button
                type="button"
                onClick={handleNextSlide}
                className="px-4 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <span>{currentSlide === totalSlides - 1 ? 'تسجيل الدخول' : 'التالي'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: USER LOGIN SCREEN ================= */}
        {step === 'auth' && (
          <div className="p-6 flex flex-col justify-between min-h-[500px]">
            <div>
              {/* Header */}
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-black/30 border border-slate-700/30 bg-[#2A2D34] mx-auto mb-3 flex items-center justify-center">
                  <img src="/icon.svg" alt="Grip Logo" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-black">تسجيل الدخول إلى Grip</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  أنشئ ملفك المحلي لحفظ جدولك ومصروفاتك ونواياك على جهازك بدون تشتت.
                </p>
              </div>

              {/* 1. OFFICIAL GOOGLE / GMAIL ONE-CLICK SIGN IN BUTTON */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn()}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white text-xs font-black shadow-md flex items-center justify-center gap-2.5 transition cursor-pointer active:scale-95 group"
                >
                  <span>ابدأ بسرعة (ملف محلي على جهازك)</span>
                </button>

                {/* Subtle Divider */}
                <div className="flex items-center my-3 text-slate-400">
                  <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
                  <span className="px-3 text-[11px] font-bold">أو أدخل اسمك وبريدك (اختياري)</span>
                  <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
                </div>
              </div>

              {/* Form Input */}
              <div className="space-y-3.5 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                      البريد الإلكتروني (Gmail)
                    </label>
                    {emailInput && !emailInput.includes('@') && (
                      <button
                        type="button"
                        onClick={() => setEmailInput((prev) => `${prev.trim()}@gmail.com`)}
                        className="text-[10px] font-black text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        + إضافة @gmail.com
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="yourname@gmail.com"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9] transition font-medium"
                      dir="ltr"
                    />
                    <div className="absolute left-3 top-3.5 text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-500 dark:text-slate-400">
                    الاسم الكامل (اختياري)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="اتركه فارغاً للاستخراج التلقائي"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs focus:outline-none focus:ring-2 focus:ring-[#6D28D9] transition"
                    />
                  </div>
                </div>

                {/* Error message */}
                {authError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-center animate-fadeIn">
                    {authError}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => handleLogin()}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs font-black shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'جاري التحقق والتهيئة...' : 'تسجيل الدخول ومتابعة العمل'}</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep('walkthrough')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
                >
                  ← العودة للجولة التعريفية
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // Sign in as Guest User
                    const guestUser: GripUser = {
                      id: `guest-user-${Date.now()}`,
                      name: 'مستخدم زائر (Guest)',
                      email: 'guest@grip.app',
                      isDeveloper: false,
                      joinedAt: new Date().toISOString(),
                    };
                    onComplete(guestUser);
                  }}
                  className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 font-bold cursor-pointer"
                >
                  الدخول كـ مستخدم زائر
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
