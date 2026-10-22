import React from 'react';
import { GripTask, GripIntention, BudgetModel } from '../types/grip';
import { Sun, Sparkles, CheckCircle2, ArrowLeft, Target, Wallet, Flame, Calendar } from 'lucide-react';
import { hapticFeedback } from '../services/haptics';

interface MorningFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  tasks: GripTask[];
  intentions: GripIntention[];
  budget?: BudgetModel | null;
  onSelectTask?: (task: GripTask) => void;
}

export const MorningFocusModal: React.FC<MorningFocusModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  tasks,
  intentions,
  budget,
  onSelectTask,
}) => {
  if (!isOpen) return null;

  // Today's Top 3 tasks
  const todayTasks = tasks
    .filter((t) => {
      const taskDate = new Date(t.startTime).toDateString();
      const todayDate = new Date().toDateString();
      return taskDate === todayDate && t.status !== 'done' && t.status !== 'done_early' && !t.isWakeUpAlarm && t.category !== 'wake_up';
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3);

  // Top pending intention
  const topIntention = intentions.find((i) => !i.completed);

  return (
    <div
      className="fixed inset-0 z-[2147483030] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none overflow-y-auto"
      dir="rtl"
    >
      <div
        className={`w-full max-w-lg rounded-3xl border p-6 sm:p-7 shadow-2xl relative transition-all overflow-hidden ${
          isDarkMode
            ? 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/30 text-white'
            : 'bg-gradient-to-b from-amber-50 via-white to-slate-50 border-amber-200 text-slate-900'
        }`}
      >
        {/* Glow behind */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-32 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Morning Header */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 mb-3 animate-bounce">
            <Sun className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">صباح الهمة والسيطرة</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            موجز الصباح السريع (Morning Briefing) لتوجيه طاقتك الذهنية نحو الأهم وتجنب تشتت البدايات.
          </p>
        </div>

        {/* 1. Daily Intention (Focus Anchor) */}
        {topIntention && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-1 text-amber-600 dark:text-amber-400 text-xs font-black">
              <Sparkles className="w-4 h-4" />
              <span>نيتك وتركيزك اليوم (Anchor Intention)</span>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-amber-100">
              {topIntention.text}
            </p>
          </div>
        )}

        {/* 2. Top Tasks of the Day */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Target className="w-4 h-4 text-purple-600" />
              <span>أهم مهام اليوم (قاعدة الـ 3 مهام)</span>
            </span>
            <span className="text-[11px] text-slate-400">لا تشتت نفسك بأكثر من ذلك</span>
          </div>

          {todayTasks.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-center text-xs text-slate-500">
              لا توجد مهام محددة لليوم، رتب جدولك لتبدأ بقوة!
            </div>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((t, index) => {
                const timeStr = new Date(t.startTime).toLocaleTimeString('ar-EG', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      hapticFeedback.light();
                      if (onSelectTask) {
                        onSelectTask(t);
                        onClose();
                      }
                    }}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:border-purple-500 transition cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-black flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                          {t.title}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{timeStr}</span>
                          {t.type === 'FIXED' && (
                            <span className="px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-600 text-[9px] font-bold">
                              إلزامي
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-slate-400" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Budget Status Check */}
        {budget && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 block">
                  {budget.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  انتبه لمصروفاتك اليومية للحفاظ على استقرارك المالي
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Start Day Button */}
        <button
          type="button"
          onClick={() => {
            hapticFeedback.success();
            onClose();
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:opacity-95 active:scale-95 transition cursor-pointer"
        >
          <Flame className="w-5 h-5" />
          <span>انطلق الآن واقبض على يومك!</span>
        </button>
      </div>
    </div>
  );
};
