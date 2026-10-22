import React, { useState } from 'react';
import { StudyModule, StudyLecture, StudyTopic, GripTask } from '../types/grip';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CalendarPlus,
  Trash2,
  FolderPlus,
} from 'lucide-react';

interface StudyHierarchyProps {
  modules: StudyModule[];
  onUpdateModules: (modules: StudyModule[]) => void;
  onScheduleTopic: (topic: StudyTopic, module: StudyModule, lecture: StudyLecture) => void;
  isDarkMode: boolean;
}

export const StudyHierarchyView: React.FC<StudyHierarchyProps> = ({
  modules,
  onUpdateModules,
  onScheduleTopic,
  isDarkMode,
}) => {
  const [expandedLectures, setExpandedLectures] = useState<Record<string, boolean>>({
    'lec-1-1': true,
    'lec-2-1': true,
  });

  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleCategory, setNewModuleCategory] = useState('جامعي');

  const [activeLectureForTopic, setActiveLectureForTopic] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicMinutes, setNewTopicMinutes] = useState(30);

  const toggleLecture = (lecId: string) => {
    setExpandedLectures((prev) => ({ ...prev, [lecId]: !prev[lecId] }));
  };

  // Toggle topic completion
  const handleToggleTopic = (modId: string, lecId: string, topId: string) => {
    const updated = modules.map((m) => {
      if (m.id !== modId) return m;
      return {
        ...m,
        lectures: m.lectures.map((l) => {
          if (l.id !== lecId) return l;
          return {
            ...l,
            topics: l.topics.map((t) => {
              if (t.id !== topId) return t;
              return { ...t, isCompleted: !t.isCompleted };
            }),
          };
        }),
      };
    });
    onUpdateModules(updated);
  };

  // Add new topic (strictly 20-40 min)
  const handleAddTopic = (modId: string, lecId: string) => {
    if (!newTopicTitle.trim()) return;
    const clampedMinutes = Math.min(40, Math.max(20, newTopicMinutes));

    const updated = modules.map((m) => {
      if (m.id !== modId) return m;
      return {
        ...m,
        lectures: m.lectures.map((l) => {
          if (l.id !== lecId) return l;
          const newTopic: StudyTopic = {
            id: `top-${Date.now()}`,
            lectureId: lecId,
            title: newTopicTitle.trim(),
            estimatedMinutes: clampedMinutes,
            isCompleted: false,
            sequenceOrder: l.topics.length + 1,
            description: `جلسة تركيز مقننة (${clampedMinutes} دقيقة)`,
          };
          return {
            ...l,
            topics: [...l.topics, newTopic],
          };
        }),
      };
    });

    onUpdateModules(updated);
    setNewTopicTitle('');
    setActiveLectureForTopic(null);
  };

  // Add new module
  const handleCreateModule = () => {
    if (!newModuleTitle.trim()) return;
    const pastelColors = ['#EDE9FE', '#D1FAE5', '#FFEDD5', '#E0F2FE', '#FCE7F3'];
    const chosenColor = pastelColors[modules.length % pastelColors.length];

    const newMod: StudyModule = {
      id: `mod-${Date.now()}`,
      title: newModuleTitle.trim(),
      category: newModuleCategory.trim() || 'دراسة',
      color: chosenColor,
      lectures: [
        {
          id: `lec-${Date.now()}-1`,
          moduleId: `mod-${Date.now()}`,
          title: 'المحاضرة 1: التأسيس والمفاهيم الأولية',
          order: 1,
          topics: [
            {
              id: `top-${Date.now()}-1`,
              lectureId: `lec-${Date.now()}-1`,
              title: 'مقدمة واستكشاف المادة',
              estimatedMinutes: 25,
              isCompleted: false,
              sequenceOrder: 1,
              description: '25 دقيقة تركيز عميق',
            },
          ],
        },
      ],
    };

    onUpdateModules([...modules, newMod]);
    setNewModuleTitle('');
    setIsAddingModule(false);
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none" dir="rtl">
      {/* Top Banner */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-[#6D28D9] flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              هرمية المذاكرة (Study Hierarchy)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              المادة (Module) • المحاضرة (Lecture) • المواضيع (Topics: 20-40 دقيقة). ترتفع نسبة الإنجاز تلقائياً.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddingModule(true)}
          className="px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-900/20 transition cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>إضافة مادة جديدة</span>
        </button>
      </div>

      {/* New Module Modal / Input Box */}
      {isAddingModule && (
        <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row items-center gap-3 animate-fadeIn">
          <input
            type="text"
            placeholder="اسم المادة (مثال: كيمياء عضوية، هندسة نظم...)"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
          />
          <input
            type="text"
            placeholder="التصنيف (مثال: جامعي)"
            value={newModuleCategory}
            onChange={(e) => setNewModuleCategory(e.target.value)}
            className="w-36 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 text-xs font-bold text-slate-900 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateModule}
              className="px-4 py-2.5 rounded-xl bg-[#6D28D9] text-white text-xs font-bold cursor-pointer"
            >
              حفظ المادة
            </button>
            <button
              onClick={() => setIsAddingModule(false)}
              className="px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Modules List */}
      <div className="space-y-6">
        {modules.map((mod) => {
          // Calculate module stats
          const allTopics = mod.lectures.flatMap((l) => l.topics);
          const totalTopics = allTopics.length;
          const completedTopics = allTopics.filter((t) => t.isCompleted).length;
          const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

          return (
            <div
              key={mod.id}
              className={`p-5 rounded-3xl border transition-all duration-200 ${
                isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
              }`}
            >
              {/* Module Header & Automatic Progress Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: mod.color }}
                      className="w-3.5 h-3.5 rounded-md inline-block border border-purple-300"
                    />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{mod.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                      {mod.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {completedTopics} من أصل {totalTopics} موضوعاً منجزاً ({mod.lectures.length} محاضرات)
                  </p>
                </div>

                {/* Progress bar container */}
                <div className="sm:w-60 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-purple-600 dark:text-purple-400">نسبة التقدم الأكاديمي</span>
                    <span className="text-slate-800 dark:text-slate-200">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-emerald-500 transition-all duration-500 shadow-sm"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Lectures within this Module */}
              <div className="space-y-4">
                {mod.lectures.map((lec) => {
                  const isExpanded = !!expandedLectures[lec.id];
                  const lecCompleted = lec.topics.filter((t) => t.isCompleted).length;

                  return (
                    <div
                      key={lec.id}
                      className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-4 transition"
                    >
                      {/* Lecture row */}
                      <div
                        onClick={() => toggleLecture(lec.id)}
                        className="flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <BookOpen className="w-4 h-4 text-[#6D28D9]" />
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{lec.title}</span>
                          <span className="text-[11px] text-slate-400">
                            ({lecCompleted}/{lec.topics.length} منجز)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLectureForTopic(lec.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-[#6D28D9] dark:text-purple-300 text-[11px] font-bold hover:bg-purple-200 transition"
                          >
                            + إضافة جلسة (Topic)
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Add Topic Input inside this lecture */}
                      {activeLectureForTopic === lec.id && (
                        <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row items-center gap-2 animate-fadeIn">
                          <input
                            type="text"
                            placeholder="عنوان الموضوع (مثال: خطوط المجال ومبدأ التراكب)"
                            value={newTopicTitle}
                            onChange={(e) => setNewTopicTitle(e.target.value)}
                            className="flex-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                          />
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-600" />
                            <select
                              value={newTopicMinutes}
                              onChange={(e) => setNewTopicMinutes(parseInt(e.target.value))}
                              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                            >
                              <option value={20}>20 دقيقة</option>
                              <option value={25}>25 دقيقة</option>
                              <option value={30}>30 دقيقة</option>
                              <option value={35}>35 دقيقة</option>
                              <option value={40}>40 دقيقة (الحد الأقصى)</option>
                            </select>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleAddTopic(mod.id, lec.id)}
                              className="px-3 py-2 rounded-lg bg-[#6D28D9] text-white text-xs font-bold cursor-pointer"
                            >
                              إضافة
                            </button>
                            <button
                              onClick={() => setActiveLectureForTopic(null)}
                              className="px-2.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Topic List */}
                      {isExpanded && (
                        <div className="mt-3 space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                          {lec.topics.map((topic) => (
                            <div
                              key={topic.id}
                              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition overflow-hidden max-w-full box-border ${
                                topic.isCompleted
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                              }`}
                            >
                              {/* Left details & checkbox */}
                              <div className="flex items-center gap-3 flex-1 min-w-0 max-w-full">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTopic(mod.id, lec.id, topic.id)}
                                  className="text-slate-400 hover:text-emerald-500 transition cursor-pointer shrink-0"
                                  title="تبديل حالة الإنجاز"
                                >
                                  {topic.isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                  )}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`text-xs font-bold truncate max-w-full ${
                                        topic.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
                                      }`}
                                    >
                                      {topic.title}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-[#6D28D9] dark:text-purple-300 font-bold flex items-center gap-1 shrink-0">
                                      <Clock className="w-2.5 h-2.5" />
                                      {topic.estimatedMinutes} دقيقة
                                    </span>
                                  </div>
                                  {topic.description && (
                                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{topic.description}</p>
                                  )}
                                </div>
                              </div>

                              {/* Right Action: Schedule this Topic into the Built-in Calendar (محمي من الخروج بره الكارت) */}
                              <button
                                type="button"
                                onClick={() => onScheduleTopic(topic, mod, lec)}
                                className="self-end sm:self-center px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-[#6D28D9] dark:text-purple-300 hover:bg-purple-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap"
                                title="جدولة هذا الموضوع كجلسة في التقويم"
                              >
                                <CalendarPlus className="w-3.5 h-3.5" />
                                <span>جدولة كجلسة</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
