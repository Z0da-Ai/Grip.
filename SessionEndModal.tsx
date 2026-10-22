import React, { useState } from 'react';
import { GripTask } from '../types/grip';
import { CheckCircle2, Clock, PlusCircle, ArrowLeft, Award, Sparkles } from 'lucide-react';

interface SessionEndModalProps {
  task: GripTask;
  onDone: (task: GripTask) => void;
  onExtend: (task: GripTask, addHours: number, addMinutes: number) => void;
}

export const SessionEndModal: React.FC<SessionEndModalProps> = ({
  task,
  onDone,
  onExtend,
}) => {
  const [isExtending, setIsExtending] = useState(false);
  const [addHours, setAddHours] = useState(0);
  const [addMinutes, setAddMinutes] = useState(30);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
      <div className="w-full max-w-md bg-[#131926] border border-purple-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden text-center animate-fadeIn">
        {/* Soft decorative glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-[#6D28D9]/20 border border-[#8B5CF6]/40 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-[#A78BFA]" />
        </div>

        <h2 className="text-2xl font-black text-white">انتهى وقت الجلسة</h2>
        <p className="text-sm text-slate-300 mt-1 font-semibold">{task.title}</p>
        <p className="text-xs text-purple-300/80 mt-2">
          حان وقت الحسم: هل أنجزت المهمة بالكامل، أم تحتاج وقتاً إضافياً للإنهاء؟
        </p>

        {!isExtending ? (
          <div className="mt-8 flex flex-col gap-3">
            {/* Primary Action: Done */}
            <button
              onClick={() => onDone(task)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span>تم الإنجاز (Done)</span>
            </button>

            {/* Secondary Action: Extend */}
            <button
              onClick={() => setIsExtending(true)}
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-purple-200 font-bold text-sm border border-purple-500/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-purple-400" />
              <span>تمديد الوقت (Extend)</span>
            </button>
          </div>
        ) : (
          <div className="mt-6 bg-slate-900/80 p-5 rounded-2xl border border-slate-700/80 animate-fadeIn text-right">
            <h3 className="text-sm font-bold text-purple-300 mb-2.5 text-center">
              منتقي التمديد السريع (+15 إلى +120 دقيقة):
            </h3>

            {/* Quick Extension Chips */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[15, 30, 45, 60, 90, 120].map((mins) => {
                const totalCurrent = addHours * 60 + addMinutes;
                const isSelected = totalCurrent === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      setAddHours(Math.floor(mins / 60));
                      setAddMinutes(mins % 60);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-[#6D28D9] text-white border-purple-400 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    +{mins >= 60 ? `${mins / 60} س` : `${mins} د`}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onExtend(task, addHours, addMinutes)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#6D28D9] to-purple-600 hover:from-[#7C3AED] hover:to-purple-500 text-white font-black text-sm shadow-lg transition cursor-pointer"
              >
                تأكيد التمديد (+{addHours * 60 + addMinutes} دقيقة)
              </button>
              <button
                onClick={() => setIsExtending(false)}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition cursor-pointer"
              >
                رجوع
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
