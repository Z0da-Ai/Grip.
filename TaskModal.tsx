import React, { useState } from 'react';
import { GripTask, TaskCategory, TaskType, StudyModule } from '../types/grip';
import { CATEGORY_COLORS } from '../data/initialData';
import { X, Calendar, Clock, Pin, Zap, CheckCircle2, Trash2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: GripTask) => void;
  onDelete?: (taskId: string) => void;
  initialTask?: GripTask | null;
  modules: StudyModule[];
  isDarkMode: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTask,
  modules,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const now = new Date();
  const formatInputDateTime = (date: Date) => {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [title, setTitle] = useState(initialTask?.title || '');
  const [category, setCategory] = useState<TaskCategory>(initialTask?.category || 'study');
  const [type, setType] = useState<TaskType>(initialTask?.type || 'FLEXIBLE');
  const [isWakeUpAlarm, setIsWakeUpAlarm] = useState<boolean>(initialTask?.isWakeUpAlarm || initialTask?.category === 'wake_up');
  const [startTime, setStartTime] = useState(
    initialTask ? initialTask.startTime.substring(0, 16) : formatInputDateTime(new Date(Date.now() + 1800000))
  );
  const [endTime, setEndTime] = useState(
    initialTask ? initialTask.endTime.substring(0, 16) : formatInputDateTime(new Date(Date.now() + 5400000))
  );
  const [notes, setNotes] = useState(initialTask?.notes || '');
  const [moduleId, setModuleId] = useState(initialTask?.moduleId || '');

  // Quick handler when selecting wake_up category
  const handleSelectCategory = (cat: TaskCategory) => {
    setCategory(cat);
    if (cat === 'wake_up') {
      setIsWakeUpAlarm(true);
      setType('FIXED');
      if (!title.trim() || title === 'مذاكرة' || title === 'نوم') {
        setTitle('منبه الصحوة الحاسم ⏰ (One-Shot)');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const task: GripTask = {
      id: initialTask?.id || `task-${Date.now()}`,
      title: title.trim(),
      category,
      type: isWakeUpAlarm ? 'FIXED' : type,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      notes: notes.trim(),
      moduleId: moduleId || undefined,
      status: initialTask?.status || 'pending',
      postponeCount: initialTask?.postponeCount || 0,
      isWakeUpAlarm: isWakeUpAlarm || category === 'wake_up',
    };

    onSave(task);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" dir="rtl">
      <div
        className={`w-full max-w-lg rounded-3xl border p-6 transition-all shadow-2xl relative ${
          isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-black mb-4">
          {initialTask ? 'تعديل المهمة المجدولة' : 'إضافة مهمة جديدة للتقويم'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">عنوان المهمة:</label>
            <input
              type="text"
              required
              placeholder="مثال: مذاكرة فيزياء كهربية، محاضرة برمجة، تمرين..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">التصنيف:</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_COLORS).map(([key, val]) => {
                const isSelected = category === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => handleSelectCategory(key as TaskCategory)}
                    style={{
                      backgroundColor: isSelected ? val.bg : undefined,
                      color: isSelected ? val.text : undefined,
                      borderColor: isSelected ? val.border : undefined,
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      isSelected
                        ? 'shadow-xs font-black'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {val.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* One-Shot Wake-Up Alarm Option (خاص بمنبه الصحوة) */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⏰</span>
              <div>
                <span className="text-xs font-black block text-amber-950 dark:text-amber-200">
                  منبه الصحوة الحاسم (One-Shot Alarm)
                </span>
                <span className="text-[10px] text-amber-800 dark:text-amber-400">
                  يرن مرة واحدة فقط بدون غفوة، ويطلب ضغطاً مستمراً لمدة 5 ثوانٍ لإيقافه
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isWakeUpAlarm}
              onChange={(e) => {
                setIsWakeUpAlarm(e.target.checked);
                if (e.target.checked) {
                  setCategory('wake_up');
                  setType('FIXED');
                  if (!title.trim()) setTitle('منبه الصحوة الحاسم ⏰ (One-Shot)');
                }
              }}
              className="w-5 h-5 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Type: Fixed vs Flexible */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">نوع الموعد:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('FIXED')}
                className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                  type === 'FIXED'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 ring-2 ring-rose-400'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black mb-1">
                  <Pin className="w-3.5 h-3.5 text-rose-500" />
                  <span>ثابت (FIXED)</span>
                </div>
                <p className="text-[10px] text-slate-400">محاضرة، موعد عمل، أو فحص لا يمكن تحريكه.</p>
              </button>

              <button
                type="button"
                onClick={() => setType('FLEXIBLE')}
                className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                  type === 'FLEXIBLE'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-400'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black mb-1">
                  <Zap className="w-3.5 h-3.5 text-indigo-500" />
                  <span>مرن (FLEXIBLE)</span>
                </div>
                <p className="text-[10px] text-slate-400">مذاكرة أو رياضة، يُعاد جدولتها آلياً عند الفوات دون تصادم.</p>
              </button>
            </div>
          </div>

          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">وقت البدء:</label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">وقت الانتهاء:</label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
              />
            </div>
          </div>

          {/* Link to study module if relevant */}
          {category === 'study' && modules.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">ربط بمادة دراسية (Module):</label>
              <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                <option value="">بدون ربط بمادة معينة</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">ملاحظات إضافية:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل أو متطلبات للمهمة..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
            {initialTask && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialTask.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف المهمة</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                حفظ المهمة
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
