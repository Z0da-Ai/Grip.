import React from 'react';
import { StreakStats } from '../services/streakService';
import {
  Flame,
  Trophy,
  Award,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  Zap,
  Check,
} from 'lucide-react';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StreakStats;
  onTriggerConfetti: () => void;
  isDarkMode: boolean;
}

export const StreakModal: React.FC<StreakModalProps> = ({
  isOpen,
  onClose,
  stats,
  onTriggerConfetti,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const isBurning = stats.isCompletedToday;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      dir="rtl"
    >
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden relative transition transform scale-100 ${
          isDarkMode
            ? 'bg-[#0F172A] border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Glow Header Background */}
        <div
          className={`h-32 w-full relative overflow-hidden flex items-center justify-center ${
            isBurning
              ? 'bg-gradient-to-b from-amber-500/20 via-orange-500/10 to-transparent'
              : 'bg-gradient-to-b from-purple-500/15 via-indigo-500/10 to-transparent'
          }`}
        >
          {/* Subtle decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-orange-500/20 blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Animated Flame Avatar */}
        <div className="flex flex-col items-center -mt-16 px-6 pb-6 text-center">
          <div className="relative group">
            <div
              className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl transition transform group-hover:scale-105 ${
                isBurning
                  ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 text-white shadow-orange-500/40 ring-4 ring-amber-300/40'
                  : 'bg-gradient-to-tr from-amber-400/80 to-orange-400/80 text-white shadow-amber-500/30 ring-4 ring-orange-200 dark:ring-orange-950/40'
              }`}
            >
              <Flame className={`w-14 h-14 ${isBurning ? 'animate-bounce' : 'animate-pulse'}`} />
            </div>

            {/* Today indicator badge */}
            <div
              className={`absolute -bottom-2 -left-2 px-2.5 py-0.5 rounded-full text-[11px] font-black border flex items-center gap-1 shadow-sm ${
                isBurning
                  ? 'bg-emerald-500 border-emerald-300 text-white'
                  : 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700'
              }`}
            >
              {isBurning ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>مشتعلة اليوم</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  <span>بانتظار مهمة</span>
                </>
              )}
            </div>
          </div>

          {/* Counter Headline */}
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl sm:text-5xl font-black text-amber-500 dark:text-amber-400 font-['Plus_Jakarta_Sans',sans-serif]">
                {stats.currentStreak}
              </span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {stats.currentStreak === 1 ? 'يوم' : stats.currentStreak === 2 ? 'يومان' : stats.currentStreak <= 10 ? 'أيام' : 'يومًا'}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
              سلسلة الانضباط المتواصلة (Daily Streak)
            </p>
          </div>

          {/* Status Message Card */}
          <div
            className={`w-full mt-4 p-3.5 rounded-2xl border text-xs text-right transition ${
              isBurning
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {isBurning ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">
                  {isBurning
                    ? `رائع جداً! أنجزت ${stats.todayCompletedCount} من مهامك اليوم. سلسلتك آمنة ومشتعلة بقوة!`
                    : 'سلسلتك لا تزال نشطة! أكمل مهمة واحدة على الأقل قبل نهاية اليوم لتستمر شعلتك في الاشتعال.'}
                </p>
              </div>
            </div>
          </div>

          {/* 7-Day Activity Chain Row */}
          <div className="w-full mt-5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 px-1">
              <span>نشاط آخر 7 أيام</span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                {stats.weeklyDays.filter((d) => d.isCompleted).length} من 7 أيام مكتملة
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {stats.weeklyDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                    day.isToday
                      ? day.isCompleted
                        ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-orange-500/20 ring-2 ring-amber-300'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                      : day.isCompleted
                      ? 'bg-amber-100/80 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-bold opacity-80">{day.shortDayName}</span>
                  <div className="my-1">
                    {day.isCompleted ? (
                      <Flame className="w-4 h-4 fill-current animate-pulse" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600" />
                    )}
                  </div>
                  <span className="text-[9px] font-semibold flex items-center justify-center">
                    {day.isToday ? 'اليوم' : day.isCompleted ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Summary Grid */}
          <div className="grid grid-cols-2 gap-3 w-full mt-5">
            <div
              className={`p-3 rounded-2xl border text-center ${
                isDarkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>أطول سلسلة سابقة</span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {stats.longestStreak} <span className="text-xs font-bold text-slate-400">أيام</span>
              </div>
            </div>

            <div
              className={`p-3 rounded-2xl border text-center ${
                isDarkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#6D28D9]" />
                <span>إجمالي أيام الإنجاز</span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {stats.totalActiveDays} <span className="text-xs font-bold text-slate-400">يوم</span>
              </div>
            </div>
          </div>

          {/* Milestone Badge Card */}
          <div
            className={`w-full mt-4 p-3.5 rounded-2xl border flex items-center justify-between text-right ${
              isDarkMode
                ? 'bg-purple-950/30 border-purple-900/50'
                : 'bg-purple-50/70 border-purple-200/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-xl shrink-0">
                {stats.milestone.badgeEmoji}
              </div>
              <div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                  المستوى الحالي {stats.milestone.level}
                </span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  {stats.milestone.title}
                </h4>
              </div>
            </div>

            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400">المحطة القادمة</span>
              <p className="text-xs font-black text-purple-600 dark:text-purple-300">
                {stats.milestone.nextMilestoneDays} أيام
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full mt-5">
            <button
              onClick={() => {
                onTriggerConfetti();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>احتفل بالشعلة</span>
            </button>

            <button
              onClick={onClose}
              className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
