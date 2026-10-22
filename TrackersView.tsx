import React, { useState } from 'react';
import { DailyTrackerRecord, GripTask } from '../types/grip';
import { calculateStreakStats } from '../services/streakService';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Flame,
  Award,
  Calendar,
  CheckCircle2,
  Smile,
  ShieldCheck,
  Zap,
  Clock,
  Check,
} from 'lucide-react';

interface TrackersViewProps {
  trackerHistory: DailyTrackerRecord[];
  tasks: GripTask[];
  onTriggerConfetti: () => void;
  isDarkMode: boolean;
  onOpenStreak?: () => void;
}

export const TrackersView: React.FC<TrackersViewProps> = ({
  trackerHistory,
  tasks,
  onTriggerConfetti,
  isDarkMode,
  onOpenStreak,
}) => {
  const [chartMode, setChartMode] = useState<'day' | 'week'>('day');

  // Streak Stats
  const streakStats = calculateStreakStats(trackerHistory, tasks);

  // Positive Statistics Calculation
  const todayTasks = tasks.filter((t) => {
    const d = new Date(t.startTime);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayCompleted = streakStats.todayCompletedCount;

  // Improvement calculation: compare first 3 days vs last 3 days
  const earlyPostpones = trackerHistory.slice(0, 3).reduce((acc, r) => acc + r.postponesCount, 0) / 3 || 1;
  const recentPostpones = trackerHistory.slice(-3).reduce((acc, r) => acc + r.postponesCount, 0) / 3 || 1;
  const improvementPercent = Math.max(0, Math.round(((earlyPostpones - recentPostpones) / earlyPostpones) * 100));

  // Current Streak (consecutive days with completed tasks)
  const currentStreak = streakStats.currentStreak;

  // Personal Records
  const minPostponesRecord = Math.min(...trackerHistory.map((r) => r.postponesCount));
  const maxCompletedRecord = Math.max(...trackerHistory.map((r) => r.completedTasks));

  // Chart data values
  const maxDataVal = Math.max(
    ...trackerHistory.map((r) => Math.max(r.completedTasks, r.postponesCount)),
    10
  );

  return (
    <div className="w-full flex flex-col gap-6 select-none" dir="rtl">
      {/* Hero Positive Banner - برتقالي تحفيزي */}
      <div className={`p-6 sm:p-7 rounded-3xl border relative overflow-hidden transition ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-gradient-to-br from-orange-50/80 via-amber-50/50 to-white border-orange-200/90 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>سجل الإنجاز والتقدم المستمر</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              لوحة الإنجاز والتحسن المستمر
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
              تركيز كامل على ما تم إنجازه، مع مؤشرات واضحة لخفض التسويف وزيادة معدل الالتزام اليومي.
            </p>
          </div>

          <button
            onClick={onTriggerConfetti}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 transition active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Trophy className="w-4 h-4 text-amber-200" />
            <span>تأكيد إنجازات اليوم</span>
          </button>
        </div>
      </div>

      {/* 4 Positive Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Stat 1: Completed Today */}
        <div className={`p-4 rounded-2xl border transition ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">إنجازات اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {todayCompleted} <span className="text-xs font-bold text-slate-400">مهام</span>
          </div>
          <p className="text-[11px] text-orange-600 dark:text-orange-400 font-bold mt-1">
            خطوات حقيقية نحو أهدافك
          </p>
        </div>

        {/* Stat 2: % Improvement vs last week */}
        <div className={`p-4 rounded-2xl border transition ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">نسبة قمع التسويف</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400">
            +{improvementPercent}%
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
            تحسن ملحوظ مقارنة بالأسبوع الماضي
          </p>
        </div>

        {/* Stat 3: Streak of days */}
        <div
          onClick={onOpenStreak}
          className={`p-4 rounded-2xl border transition cursor-pointer hover:shadow-md select-none group ${
            isDarkMode
              ? 'bg-slate-900/90 border-slate-800 hover:border-amber-600/70'
              : 'bg-white border-slate-200 shadow-sm hover:border-amber-300'
          }`}
          title="انقر لفتح تفاصيل سلسلة الانضباط والأوسمة"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">سلسلة الانضباط</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition group-hover:scale-110 ${
                streakStats.isCompletedToday
                  ? 'bg-amber-500 text-white shadow-sm shadow-orange-500/30'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
              }`}
            >
              <Flame className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-['Plus_Jakarta_Sans',sans-serif]">
            {currentStreak} <span className="text-xs font-bold text-slate-400">أيام</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
              {streakStats.isCompletedToday ? 'مكتمل لهذا اليوم' : 'استمرارية الانضباط'}
            </p>
            <span className="text-[10px] text-slate-400 group-hover:text-amber-600 font-bold">
              تفاصيل ←
            </span>
          </div>
        </div>

        {/* Stat 4: Personal Record */}
        <div className={`p-4 rounded-2xl border transition ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">رقم قياسي شخصي</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
            {minPostponesRecord} <span className="text-xs font-bold text-slate-400">تأجيل فقط</span>
          </div>
          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-bold mt-1">
            أدنى تأجيلات في يوم واحد!
          </p>
        </div>
      </div>

      {/* The Central Dual Chart: Completed Tasks UP ↗ vs Postponements DOWN ↘ */}
      <div className={`p-6 rounded-3xl border transition ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>المخطط الذهبي: صعود الإنجاز وهبوط التأجيل</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              مقارنة مسار المهام المكتملة (تصاعدي ↗) بمسار مرات التأجيل (تنازلي ↘) عبر الزمن.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-300">المهام المنجزة (صعوداً ↗)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-600/70 inline-block" />
              <span className="text-slate-600 dark:text-slate-300">مرات التأجيل (هبوطاً ↘)</span>
            </div>
          </div>
        </div>

        {/* Bar & Trend Chart Visualization */}
        <div className="w-full h-64 flex items-end justify-between gap-2 sm:gap-6 pt-8 pb-4 px-2">
          {trackerHistory.map((item, index) => {
            const completedHeight = (item.completedTasks / maxDataVal) * 100;
            const postponeHeight = (item.postponesCount / maxDataVal) * 100;
            const dayLabel = new Date(item.date).toLocaleDateString('ar-EG', { weekday: 'short' });

            return (
              <div key={item.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                {/* Bar Columns Container */}
                <div className="w-full max-w-[48px] flex items-end justify-center gap-1.5 h-full">
                  {/* Completed Tasks Bar (Orange - Up) */}
                  <div
                    className="flex-1 bg-gradient-to-t from-orange-600 to-amber-400 rounded-t-lg transition-all duration-300 hover:brightness-110 relative flex items-center justify-center shadow-xs"
                    style={{ height: `${completedHeight}%` }}
                  >
                    <span className="text-[10px] font-black text-white absolute -top-5 opacity-0 group-hover:opacity-100 transition">
                      {item.completedTasks}
                    </span>
                  </div>

                  {/* Postpone Bar (Down) */}
                  <div
                    className="flex-1 bg-gradient-to-t from-slate-400 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-t-lg transition-all duration-300 hover:brightness-110 relative flex items-center justify-center"
                    style={{ height: `${postponeHeight}%` }}
                  >
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 absolute -top-5 opacity-0 group-hover:opacity-100 transition">
                      {item.postponesCount}
                    </span>
                  </div>
                </div>

                {/* Day label */}
                <div className="mt-2 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block">{dayLabel}</span>
                  <span className="text-[9px] text-slate-400 block">{item.date.split('-').slice(1).join('/')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Small Tracker Per Task: Recent task performance */}
      <div className={`p-6 rounded-3xl border transition ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#6D28D9]" />
          <span>سجل المهام الفردي والمناعة ضد التأجيل</span>
        </h3>

        <div className="space-y-3">
          {tasks.slice(0, 5).map((task) => {
            const isDone = task.status === 'done' || task.status === 'done_early';
            return (
              <div
                key={task.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-[#6D28D9]'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{task.title}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {task.type === 'FIXED' ? 'موعد ثابت' : 'مرن'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Silently calculated postpone badge */}
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    تأجيلات: {task.postponeCount}
                  </span>

                  {isDone ? (
                    <span className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>تمت بنجاح</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      قيد التنفيذ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
