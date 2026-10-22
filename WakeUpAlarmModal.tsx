import React, { useState, useEffect, useRef } from 'react';
import { GripTask, GripIntention } from '../types/grip';
import { soundEffects } from '../services/soundEffects';
import { Bell, Flame, Sun, Sparkles, CheckCircle2, ArrowLeft, Volume2, ShieldAlert } from 'lucide-react';

interface WakeUpAlarmModalProps {
  task: GripTask;
  nextTask?: GripTask | null;
  onDismiss: () => void;
  isDarkMode: boolean;
  intentions?: GripIntention[];
}

export const WakeUpAlarmModal: React.FC<WakeUpAlarmModalProps> = ({
  task,
  nextTask,
  onDismiss,
  isDarkMode,
  intentions = [],
}) => {
  // Wake-up verification hold (5 seconds continuous hold)
  const [holdingProgress, setHoldingProgress] = useState(0); // 0 to 100
  const [holdingSeconds, setHoldingSeconds] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [wokeUpConfirmed, setWokeUpConfirmed] = useState(false);

  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const REQUIRED_HOLD_SECS = 5;

  // Start alarm sound on mount
  useEffect(() => {
    soundEffects.startWakeUpAlarm();

    // Vibrate device in rhythm if available
    let vibrateInterval: NodeJS.Timeout | null = null;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([400, 200, 400, 200, 600]);
        vibrateInterval = setInterval(() => {
          navigator.vibrate([400, 200, 400]);
        }, 2000);
      } catch (_) {}
    }

    return () => {
      soundEffects.stopWakeUpAlarm();
      if (vibrateInterval) clearInterval(vibrateInterval);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  const startHold = () => {
    setIsHolding(true);
    const startTime = Date.now();
    const durationMs = REQUIRED_HOLD_SECS * 1000;

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / durationMs) * 100);
      const secs = (elapsed / 1000).toFixed(1);

      setHoldingProgress(progress);
      setHoldingSeconds(parseFloat(secs));

      if (elapsed >= durationMs) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        setIsHolding(false);
        setHoldingProgress(100);
        soundEffects.stopWakeUpAlarm();
        soundEffects.playWakeUpSuccess();
        setWokeUpConfirmed(true);
      }
    }, 40);
  };

  const cancelHold = () => {
    if (!isHolding || wokeUpConfirmed) return;
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldingProgress(0);
    setHoldingSeconds(0);
  };

  // Pending intentions for morning boost
  const pendingIntentions = intentions.filter((i) => !i.completed).slice(0, 2);

  return (
    <div
      className="fixed inset-0 z-[2147483020] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none overflow-y-auto"
      dir="rtl"
    >
      <div
        className={`w-full max-w-md rounded-3xl border p-6 sm:p-7 shadow-2xl relative transition-all overflow-hidden ${
          isDarkMode
            ? 'bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40 text-white'
            : 'bg-gradient-to-b from-amber-50/90 via-white to-amber-100/30 border-amber-300 text-slate-900 shadow-amber-900/10'
        }`}
      >
        {/* Glow ambient background ring */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        {!wokeUpConfirmed ? (
          <>
            {/* Header / Alarm Badge */}
            <div className="flex flex-col items-center text-center mb-6 relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3 animate-bounce">
                <Sun className="w-10 h-10 animate-spin" style={{ animationDuration: '12s' }} />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-black mb-2 border border-amber-500/30">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>منبه الصحوة الحاسم (One-Shot)</span>
              </div>

              <h2 className="text-2xl font-black tracking-tight">
                حان وقت النهوض والنشاط
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs font-medium">
                المنبه ده بيرن مرة واحدة بس ومفيهوش زرار غفوة عشان تكسر كسل الدماغ وتبدأ يومك صح!
              </p>
            </div>

            {/* Next Agenda Preview: gives the ADHD brain an immediate reason to wake up */}
            {nextTask && (
              <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>أول مهمة في جدولك اليوم:</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-200 font-mono">
                    {new Date(nextTask.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {nextTask.title}
                </p>
              </div>
            )}

            {/* Morning Intention reminder if any */}
            {pendingIntentions.length > 0 && (
              <div className="mb-5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs relative z-10">
                <span className="text-[10px] font-black text-slate-400 block mb-1">
                  كنت مسجل النية دي امبارح:
                </span>
                <p className="font-bold text-slate-700 dark:text-slate-200">
                  "{pendingIntentions[0].text}"
                </p>
              </div>
            )}

            {/* Hold Button To Disarm Alarm */}
            <div className="space-y-3 relative z-10">
              <div className="text-center">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  اضغط مع الاستمرار لمدة <span className="text-amber-600 dark:text-amber-400 font-black">5 ثوانٍ</span> لتأكيد الصحوة وإيقاف الرنين:
                </p>
              </div>

              <button
                type="button"
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                onTouchCancel={cancelHold}
                className={`relative w-full py-4.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 overflow-hidden shadow-lg transition select-none active:scale-95 cursor-pointer ${
                  isHolding
                    ? 'bg-amber-600 text-white shadow-amber-600/40'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-amber-500/25 hover:brightness-105'
                }`}
                style={{ touchAction: 'none' }}
              >
                {/* Hold progress bar */}
                <div
                  className="absolute inset-y-0 right-0 bg-white/30 pointer-events-none transition-all duration-75"
                  style={{ width: `${holdingProgress}%` }}
                />

                <Flame className={`w-5 h-5 relative z-10 ${isHolding ? 'scale-125 animate-pulse text-yellow-200' : ''}`} />
                <span className="relative z-10 text-base">
                  {isHolding ? `اثبت مكانك! (${holdingSeconds.toFixed(1)} / 5 ثوانٍ)` : 'أنا صحيت خلاص (اضغط 5 ثوانٍ)'}
                </span>
              </button>

              <p className="text-[10px] text-center text-slate-400">
                * بدون زر غفوة — لحماية عقلك من التسويف وضياع بداية اليوم
              </p>
            </div>
          </>
        ) : (
          /* Wake Up Confirmed State */
          <div className="text-center py-4 space-y-4 relative z-10 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                صباح الخير! تم تأكيد الاستيقاظ وبدء اليوم
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                تم تفعيل وضع التركيز، ابدأ يومك بإنجاز أولى مهام جدولك.
              </p>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-sm shadow-md transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <span>الانتقال لجدول اليوم</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
