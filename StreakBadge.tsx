import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { StreakStats } from '../services/streakService';

interface StreakBadgeProps {
  stats: StreakStats;
  onClick: () => void;
  variant?: 'header' | 'compact' | 'card';
  isDarkMode?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  stats,
  onClick,
  variant = 'header',
  isDarkMode = false,
}) => {
  const isBurning = stats.isCompletedToday;
  const streakCount = stats.currentStreak;

  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer select-none active:scale-95 ${
          isBurning
            ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700 shadow-xs'
            : 'bg-orange-50 text-orange-800 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
        }`}
        title={`سلسلة الانضباط: ${streakCount} أيام متواصلة. انقر لعرض التفاصيل`}
      >
        <Flame
          className={`w-3.5 h-3.5 text-amber-500 fill-amber-500 ${
            isBurning ? 'animate-bounce' : 'animate-pulse'
          }`}
        />
        <span className="font-['Plus_Jakarta_Sans',sans-serif] font-black">{streakCount}</span>
        <span className="text-[10px] opacity-80">أيام</span>
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <div
        onClick={onClick}
        className={`p-4 rounded-2xl border transition cursor-pointer hover:shadow-md select-none ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800 hover:border-amber-700/60'
            : 'bg-gradient-to-br from-amber-50/50 via-white to-orange-50/40 border-amber-200/80 shadow-sm hover:border-amber-400'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            سلسلة الانضباط اليومي
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
              isBurning
                ? 'bg-amber-500 text-white shadow-sm shadow-orange-500/30'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
            }`}
          >
            <Flame className={`w-4 h-4 fill-current ${isBurning ? 'animate-bounce' : 'animate-pulse'}`} />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-amber-500 dark:text-amber-400 font-['Plus_Jakarta_Sans',sans-serif]">
            {streakCount}
          </span>
          <span className="text-xs font-bold text-slate-400">أيام متتالية</span>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
          <span
            className={
              isBurning
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }
          >
            {isBurning ? 'مكتمل لهذا اليوم' : 'بانتظار إنجاز اليوم'}
          </span>
          <span className="text-slate-400 hover:text-amber-600 underline">عرض التفاصيل ←</span>
        </div>
      </div>
    );
  }

  // Default 'header' variant: Sleek interactive pill button
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-95 ${
        isBurning
          ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 hover:from-amber-500/20 hover:to-orange-500/20 border-amber-300 dark:border-amber-600/70 text-amber-800 dark:text-amber-200 shadow-sm shadow-amber-500/10'
          : 'bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100/80 dark:hover:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
      }`}
      title={`سلسلة الانضباط: ${streakCount} أيام متواصلة. انقر لعرض التفاصيل والأوسمة.`}
    >
      {/* Animated Flame Icon Container */}
      <div
        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
          isBurning
            ? 'bg-amber-500 text-white shadow-xs shadow-orange-500/40 ring-1 ring-amber-300'
            : 'bg-amber-200 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
        }`}
      >
        <Flame
          className={`w-3.5 h-3.5 fill-current ${
            isBurning ? 'animate-bounce' : 'animate-pulse'
          }`}
        />
      </div>

      {/* Streak Number & Label */}
      <div className="flex items-center gap-1">
        <span className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-sm tracking-tight text-amber-600 dark:text-amber-400">
          {streakCount}
        </span>
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hidden sm:inline">
          {streakCount === 1 ? 'يوم' : streakCount === 2 ? 'يومان' : 'أيام'}
        </span>
      </div>

      {/* Status spark or dot */}
      {isBurning ? (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" title="شعلة اليوم مكتملة" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="بانتظار إنجاز اليوم" />
      )}
    </button>
  );
};
