import React, { useState, useEffect, useRef } from 'react';
import { GripTask, GripSettings } from '../types/grip';
import { hapticFeedback } from '../services/haptics';
import { Check, Lock, AlertTriangle, Phone } from 'lucide-react';

interface EnforcementOverlayProps {
  task: GripTask;
  settings: GripSettings;
  onPostponeSuccess: (task: GripTask, freeWindowMinutes: number) => void;
  onDoneEarly: (task: GripTask) => void;
  onEmergencyExit: (task: GripTask) => void;
  onClosePreview?: () => void;
  isSimulatedInApp?: boolean;
}

export const EnforcementOverlay: React.FC<EnforcementOverlayProps> = ({
  task,
  settings,
  onPostponeSuccess,
  onDoneEarly,
  onEmergencyExit,
  onClosePreview,
}) => {
  // Escalating friction calculation: 1st 3-4: 10s, next 3-4: 20s, max 30s
  const calculateRequiredSeconds = (count: number): number => {
    if (count < 3) return settings.baseHoldSeconds || 10;
    if (count < 6) return settings.midHoldSeconds || 20;
    return settings.maxHoldSeconds || 30;
  };

  const calculateNextHoldSeconds = (count: number): number => {
    return calculateRequiredSeconds(count + 1);
  };

  const currentHoldRequired = calculateRequiredSeconds(task.postponeCount);
  const nextHoldSeconds = calculateNextHoldSeconds(task.postponeCount);

  // Holding state for "فكرني بعدين"
  const [holdingProgress, setHoldingProgress] = useState(0); // 0 to 100
  const [heldSeconds, setHeldSeconds] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  // Holding state for "خلّصت بدري" (exactly 2 seconds hold)
  const [isDoneEarlyHolding, setIsDoneEarlyHolding] = useState(false);
  const [doneEarlyProgress, setDoneEarlyProgress] = useState(0); // 0 to 100

  // Hidden Emergency Exit (60 seconds hold)
  const [isEmergencyHolding, setIsEmergencyHolding] = useState(false);
  const [emergencyProgress, setEmergencyProgress] = useState(0);
  const [emergencySeconds, setEmergencySeconds] = useState(0);
  const emergencyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated Incoming Call / Phone Call State
  const [isPhoneCallActive, setIsPhoneCallActive] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const doneEarlyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      if (doneEarlyIntervalRef.current) clearInterval(doneEarlyIntervalRef.current);
      if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Trigger vibration helper
  const triggerWarningVibration = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch {
        // ignore
      }
    }
  };

  // START "فكرني بعدين" Hold
  const startHold = () => {
    setIsHolding(true);
    const startTime = Date.now();
    const durationMs = currentHoldRequired * 1000;

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / durationMs) * 100);
      const secs = (elapsed / 1000).toFixed(1);

      setHoldingProgress(progress);
      setHeldSeconds(parseFloat(secs));

        if (elapsed >= durationMs) {
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          setIsHolding(false);
          setHoldingProgress(100);
          hapticFeedback.heavy();

          // Show dark toast before triggering callback
          const freeMins = settings.freeWindowMinutes || 4;
          setToastMessage(`تمام، تم منح نافذة حرة لمدة ${freeMins} دقائق`);
          toastTimeoutRef.current = setTimeout(() => {
            onPostponeSuccess(task, freeMins);
          }, 1100);
        }
    }, 35);
  };

  // CANCEL "فكرني بعدين" Hold with Penalty (Reset to 0 + Vibration)
  const cancelHold = () => {
    if (!isHolding) return;
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    // Punishment: vibration & reset
    triggerWarningVibration();
    setIsHolding(false);
    setHoldingProgress(0);
    setHeldSeconds(0);
    setToastMessage('رفعت إصبعك مبكراً! أعيد العداد للصفر');
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Hidden Emergency Exit Hold (60 seconds)
  const startEmergencyHold = () => {
    setIsEmergencyHolding(true);
    const startTime = Date.now();
    const durationMs = (settings.emergencyExitSeconds || 60) * 1000;

    emergencyIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / durationMs) * 100);
      const secs = Math.floor(elapsed / 1000);

      setEmergencyProgress(progress);
      setEmergencySeconds(secs);

      if (elapsed >= durationMs) {
        if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);
        setIsEmergencyHolding(false);
        setEmergencyProgress(100);
        setToastMessage('تم خروج الطوارئ الاستثنائي بنجاح');
        setTimeout(() => {
          onEmergencyExit(task);
        }, 800);
      }
    }, 100);
  };

  const cancelEmergencyHold = () => {
    if (!isEmergencyHolding) return;
    if (emergencyIntervalRef.current) {
      clearInterval(emergencyIntervalRef.current);
      emergencyIntervalRef.current = null;
    }
    triggerWarningVibration();
    setIsEmergencyHolding(false);
    setEmergencyProgress(0);
    setEmergencySeconds(0);
  };

  // START "خلّصت بدري" Hold (2 seconds = 2000 ms)
  const startDoneEarlyHold = () => {
    setIsDoneEarlyHolding(true);
    const startTime = Date.now();
    const durationMs = 2000; // 2 seconds

    doneEarlyIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / durationMs) * 100);
      setDoneEarlyProgress(progress);

      if (elapsed >= durationMs) {
        if (doneEarlyIntervalRef.current) clearInterval(doneEarlyIntervalRef.current);
        setIsDoneEarlyHolding(false);
        setDoneEarlyProgress(100);

        // Show dark toast before triggering callback
        setToastMessage('أحسنت! تم إنجاز المهمة بنجاح.');
        toastTimeoutRef.current = setTimeout(() => {
          onDoneEarly(task);
        }, 1200);
      }
    }, 35);
  };

  // CANCEL "خلّصت بدري" Hold
  const cancelDoneEarlyHold = () => {
    if (!isDoneEarlyHolding) return;
    if (doneEarlyIntervalRef.current) {
      clearInterval(doneEarlyIntervalRef.current);
      doneEarlyIntervalRef.current = null;
    }
    setIsDoneEarlyHolding(false);
    setDoneEarlyProgress(0);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F9FA] text-[#1F2433] select-none p-3 sm:p-5"
      dir="rtl"
    >
      {/* Phone container: max-w-[420px], all inside ONE screen, no scrolling */}
      <div className="w-full max-w-[420px] h-full max-h-[920px] flex flex-col justify-between items-center py-2 sm:py-3">
        {/* 1. Header: Logo (40x40, radius 12, white bold "G") next to bold "Grip" */}
        <div className="w-full flex items-center justify-start gap-2.5 pt-1">
          <div className="w-10 h-10 rounded-[12px] bg-[#6D28D9] flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif] font-black text-xl text-white shadow-xs">
            G
          </div>
          <span className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-xl text-[#1F2433] tracking-wide">
            Grip
          </span>
        </div>

        {/* 2. Small pill: Lavender bg, purple text, 13px */}
        <div className="px-3.5 py-1 rounded-full bg-[#E9E3FB] text-[#6D28D9] text-[13px] font-bold">
          جلسة التركيز الحالية
        </div>

        {/* 3. Task title: 23px bold, dark text */}
        <h2 className="text-[23px] font-black text-[#1F2433] text-center leading-snug px-3 line-clamp-2">
          {task.title}
        </h2>

        {/* 4. Main message card: Lavender bg (#E9E3FB), radius 20, padding 16 */}
        <div className="w-full p-4 rounded-[20px] bg-[#E9E3FB] text-center">
          <h3 className="text-[24px] font-black text-[#6D28D9] leading-tight">
            يلا خلّصها
          </h3>
          <p className="text-[13px] text-purple-700 font-bold mt-0.5">
            امسك تركيزك.. واقطع السرحان
          </p>
          <p className="text-[12px] text-[#6B7280] font-medium mt-1 leading-normal">
            مفيش زر بدء لأنك في وقتها بالفعل. ابدأ دلوقتي واهزم التسويف.
          </p>
        </div>

        {/* 5. Two stat boxes side by side, radius 14 */}
        <div className="w-full grid grid-cols-2 gap-3">
          {/* Peach Box: big number (postpone count) + label "مرات التأجيل للمهمة" */}
          <div className="p-3 rounded-[14px] bg-[#FDE8DC] text-center flex flex-col items-center justify-center">
            <span className="text-[22px] font-black text-[#B4531F] leading-tight">
              {task.postponeCount}
            </span>
            <span className="text-[11px] font-semibold text-[#B4531F] mt-0.5">
              مرات التأجيل للمهمة
            </span>
          </div>

          {/* White Box with 1px lavender border: big purple number + label "الضغطة القادمة" */}
          <div className="p-3 rounded-[14px] bg-white border border-[#E9E3FB] text-center flex flex-col items-center justify-center shadow-xs">
            <span className="text-[22px] font-black text-[#6D28D9] leading-tight">
              {nextHoldSeconds} ث
            </span>
            <span className="text-[11px] font-semibold text-[#6B7280] mt-0.5">
              الضغطة القادمة
            </span>
          </div>
        </div>

        {/* 6. Hold ring: 150px circle, track lavender #E9E3FB, filled progress purple #7C3AED */}
        <div className="flex flex-col items-center justify-center my-1">
          <div
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            onTouchCancel={cancelHold}
            style={{
              background: `conic-gradient(#7C3AED ${holdingProgress * 3.6}deg, #E9E3FB 0deg)`,
              touchAction: 'none',
            }}
            className="w-[145px] h-[145px] rounded-full flex items-center justify-center cursor-pointer select-none transition-transform duration-150 active:scale-95 shadow-md"
          >
            {/* Inside white circle with soft purple shadow */}
            <div className="w-[122px] h-[122px] rounded-full bg-white shadow-[0_4px_16px_rgba(109,40,217,0.12)] flex flex-col items-center justify-center text-center px-2">
              <span className="text-[15px] font-black text-[#1F2433]">
                فكرني بعدين
              </span>
              <span className="text-[11px] text-[#6B7280] font-medium mt-0.5">
                {isHolding ? `${heldSeconds} ث` : `اضغط مطولاً (${currentHoldRequired}ث)`}
              </span>
            </div>
          </div>
        </div>

        {/* 7. Small muted note (12px) */}
        <p className="text-[11px] text-[#6B7280] text-center font-medium px-4">
          كمّل الضغط من غير ما ترفع إصبعك. لو رفعته العداد هيرجع للصفر مع اهتزاز تحذيري.
        </p>

        {/* 8. Full-width mint button, radius 16, bold mint-dark text: "تم بدري (اضغط مطوّلًا ثانيتين)" */}
        <div className="w-full relative rounded-[16px] overflow-hidden select-none">
          <button
            type="button"
            onMouseDown={startDoneEarlyHold}
            onMouseUp={cancelDoneEarlyHold}
            onMouseLeave={cancelDoneEarlyHold}
            onTouchStart={startDoneEarlyHold}
            onTouchEnd={cancelDoneEarlyHold}
            onTouchCancel={cancelDoneEarlyHold}
            className="w-full relative py-3 px-4 bg-[#DDF4EA] text-[#0F6B4A] font-bold text-[13px] flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-150 active:scale-[0.99]"
            style={{ touchAction: 'none' }}
          >
            {/* While holding, darker mint overlay fills from right to left (RTL) */}
            <div
              className="absolute inset-y-0 right-0 bg-[#B8E8D2] transition-all duration-75 pointer-events-none"
              style={{
                width: `${doneEarlyProgress}%`,
                opacity: isDoneEarlyHolding ? 1 : 0,
              }}
            />

            <span className="relative z-10 font-black flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>تم بدري (اضغط مطوّلًا ثانيتين)</span>
            </span>
          </button>
        </div>

        {/* 9. Discrete Hidden Emergency Exit (60s continuous hold) */}
        <div className="w-full flex items-center justify-between px-2 pt-1">
          <button
            type="button"
            onMouseDown={startEmergencyHold}
            onMouseUp={cancelEmergencyHold}
            onMouseLeave={cancelEmergencyHold}
            onTouchStart={startEmergencyHold}
            onTouchEnd={cancelEmergencyHold}
            onTouchCancel={cancelEmergencyHold}
            className="relative px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-rose-600 transition overflow-hidden border border-slate-200 bg-white"
            style={{ touchAction: 'none' }}
            title="خروج الطوارئ الاستثنائي (اضغط 60 ثانية متواصلة)"
          >
            <div
              className="absolute inset-y-0 right-0 bg-rose-100 transition-all pointer-events-none"
              style={{ width: `${emergencyProgress}%` }}
            />
            <span className="relative z-10 flex items-center gap-1">
              {isEmergencyHolding ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>طوارئ: {emergencySeconds}/60 ثانية</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>خروج الطوارئ الخفي (60ث)</span>
                </>
              )}
            </span>
          </button>

          {/* Call Sensing Simulation Button */}
          <button
            type="button"
            onClick={() => {
              setIsPhoneCallActive(true);
              setToastMessage('تم استشعار مكالمة هاتفية: كتم شاشة الإلزام مؤقتاً');
              setTimeout(() => {
                setIsPhoneCallActive(false);
              }, 8000);
            }}
            className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
            title="محاكاة استشعار مكالمة واردة لكتم الشاشة تلقائياً"
          >
            <Phone className="w-3 h-3" />
            <span>{isPhoneCallActive ? 'مكالمة جارية (مكتوم)' : 'محاكاة مكالمة'}</span>
          </button>

          {onClosePreview && (
            <button
              type="button"
              onClick={onClosePreview}
              className="text-[10px] text-slate-400 hover:text-slate-700 underline"
            >
              إغلاق المعاينة
            </button>
          )}
        </div>
      </div>

      {/* 10. Small dark toast at the bottom */}
      {toastMessage && (
        <div className="fixed bottom-6 z-60 px-5 py-2.5 rounded-full bg-[#1F2433] text-white text-[13px] font-bold shadow-xl animate-fadeIn">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
