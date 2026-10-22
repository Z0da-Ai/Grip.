import React, { useState, useEffect, useRef } from 'react';
import { GripTask, TaskCategory, TaskType } from '../types/grip';
import { CATEGORY_COLORS } from '../data/initialData';
import { StreakBadge } from './StreakBadge';
import { StreakStats } from '../services/streakService';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  CheckCircle2,
  Clock,
  Pin,
  Zap,
  Trash2,
  Edit2,
  Flame,
  ShieldAlert,
  GripVertical,
  CalendarClock,
  Move,
  X,
  Check,
  Bell,
  Sun,
  Moon,
  Search,
  Download,
  ListTodo,
  Sparkles,
  Mic,
} from 'lucide-react';
import { hapticFeedback } from '../services/haptics';
import {
  getHijriDateString,
  getHijriMonthString,
  getHijriDayShort,
  getHijriDayNumber,
} from '../utils/hijriCalendar';

interface CalendarViewProps {
  tasks: GripTask[];
  onAddTask: () => void;
  onEditTask: (task: GripTask) => void;
  onDeleteTask: (taskId: string) => void;
  onMarkDoneEarly: (task: GripTask) => void;
  onTriggerOverlay: (task: GripTask) => void;
  isDarkMode: boolean;
  onRescheduleTask?: (taskId: string, newStartTime: string, newEndTime: string) => void;
  streakStats?: StreakStats;
  onOpenStreak?: () => void;
  showHijriCalendar?: boolean;
  onSetWakeUpAlarm?: (wakeTime: string) => void;
  onTriggerWakeUpModal?: (task: GripTask) => void;
  onOpenVoiceAssistant?: () => void;
  onToggleTaskStatus?: (taskId: string, targetStatus?: GripTask['status']) => void;
}

type ViewMode = 'day' | 'week' | 'month';
type DaySubView = 'timeline' | 'list';

// Done Early Button with 2-second continuous hold
const CalendarDoneEarlyButton: React.FC<{ task: GripTask; onDone: (task: GripTask) => void }> = ({ task, onDone }) => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setHolding(true);
    const start = Date.now();
    const duration = 2000; // 2 seconds continuous hold
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (elapsed >= duration) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setHolding(false);
        setProgress(100);
        hapticFeedback.medium();
        onDone(task);
      }
    }, 40);
  };

  const cancelHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setHolding(false);
    setProgress(0);
  };

  return (
    <button
      type="button"
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onTouchCancel={cancelHold}
      className="relative h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 transition overflow-hidden cursor-pointer select-none active:scale-95 shrink-0 shadow-xs"
      style={{ touchAction: 'none' }}
      title="اضغط مطولاً لمدة ثانيتين لتأكيد الإنجاز المبكر"
    >
      <div
        className="absolute inset-y-0 right-0 bg-white/30 pointer-events-none transition-all duration-75"
        style={{ width: `${progress}%` }}
      />
      <CheckCircle2 className={`w-3.5 h-3.5 relative z-10 shrink-0 ${holding ? 'scale-110' : ''}`} />
      <span className="relative z-10 whitespace-nowrap">
        {holding ? `${Math.round(progress)}%` : 'إنجاز مبكر'}
      </span>
    </button>
  );
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onMarkDoneEarly,
  onTriggerOverlay,
  isDarkMode,
  onRescheduleTask,
  streakStats,
  onOpenStreak,
  showHijriCalendar = true,
  onSetWakeUpAlarm,
  onTriggerWakeUpModal,
  onOpenVoiceAssistant,
  onToggleTaskStatus,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  // دائماً يفتح التطبيق افتراضياً على قائمة المهام (list) بدلاً من جدول الساعات (timeline) كما طلب المستخدم
  const [daySubView, setDaySubView] = useState<DaySubView>(() => {
    if (typeof window !== 'undefined') {
      const sessionSaved = sessionStorage.getItem('grip_calendar_subview_session');
      if (sessionSaved === 'timeline' || sessionSaved === 'list') return sessionSaved as DaySubView;
    }
    return 'list';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('grip_calendar_subview_session', daySubView);
      localStorage.setItem('grip_calendar_subview', daySubView);
    }
  }, [daySubView]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');

  // Tasks List View filters and search
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [listStatusFilter, setListStatusFilter] = useState<'all' | 'pending' | 'done'>('all');

  // Drag-and-drop and Freeform Carried Card state
  const [draggedTask, setDraggedTask] = useState<GripTask | null>(null);
  const [carriedTask, setCarriedTask] = useState<GripTask | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [isPointerDragging, setIsPointerDragging] = useState(false);
  const activeDragTaskRef = React.useRef<GripTask | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentlyMovedTaskId, setRecentlyMovedTaskId] = useState<string | null>(null);
  const [holdingTaskId, setHoldingTaskId] = useState<string | null>(null);
  const [isWakeUpBannerDismissed, setIsWakeUpBannerDismissed] = useState<boolean>(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Optimistic local tasks map so changes reflect with zero millisecond latency
  const [optimisticOverrides, setOptimisticOverrides] = useState<Record<string, { startTime: string; endTime: string }>>({});

  // Merge parent tasks with instant optimistic overrides
  const activeTasks = tasks.map((t) => {
    const override = optimisticOverrides[t.id];
    if (override) {
      return { ...t, startTime: override.startTime, endTime: override.endTime };
    }
    return t;
  });

  // Clear obsolete optimistic overrides once parent tasks sync
  useEffect(() => {
    if (Object.keys(optimisticOverrides).length > 0) {
      setOptimisticOverrides((prev) => {
        const next = { ...prev };
        let changed = false;
        tasks.forEach((t) => {
          if (next[t.id] && next[t.id].startTime === t.startTime && next[t.id].endTime === t.endTime) {
            delete next[t.id];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [tasks, optimisticOverrides]);

  // Provide subtle instant tactile/sound feedback if supported
  const triggerInstantFeedback = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(30);
      }
    } catch {
      // silent
    }
  };

  // Quick Reschedule Dialog (accessible for mobile / one-tap users)
  const [rescheduleModalTask, setRescheduleModalTask] = useState<GripTask | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Arabic Month and Day formatters
  const arabicMonth = selectedDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  const arabicDayName = selectedDate.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' });
  const hijriFullDate = getHijriDateString(selectedDate);
  const hijriMonth = getHijriMonthString(selectedDate);
  const hijriDayShort = getHijriDayShort(selectedDate);

  // Filter tasks by category using activeTasks (including instant optimistic changes)
  const filteredTasks = activeTasks.filter((task) => {
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
    return true;
  });

  // Filter tasks for selected day
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const tasksForSelectedDay = filteredTasks
    .filter((t) => isSameDay(new Date(t.startTime), selectedDate))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Date Navigation handlers
  const handlePrev = () => {
    const next = new Date(selectedDate);
    if (viewMode === 'day') next.setDate(next.getDate() - 1);
    else if (viewMode === 'week') next.setDate(next.getDate() - 7);
    else next.setMonth(next.getMonth() - 1);
    setSelectedDate(next);
  };

  const handleNext = () => {
    const next = new Date(selectedDate);
    if (viewMode === 'day') next.setDate(next.getDate() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    setSelectedDate(next);
  };

  const handleGoToday = () => {
    setSelectedDate(new Date());
  };

  // Format time HH:mm in Arabic locale
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Format hour number (e.g. 14 -> "02:00 م")
  const formatHourLabel = (hour: number) => {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
  };

  // Find drop target DOM node under pointer coordinate (x, y)
  const findDropTargetAtPoint = (x: number, y: number) => {
    if (typeof document === 'undefined') return null;
    const elements = document.elementsFromPoint(x, y);
    for (const el of elements) {
      const hourAttr = el.getAttribute('data-drop-hour');
      if (hourAttr !== null) {
        return {
          type: 'hour' as const,
          hour: parseInt(hourAttr, 10),
          id: `slot-${hourAttr}`,
        };
      }
      const dayAttr = el.getAttribute('data-drop-day-date');
      if (dayAttr !== null) {
        return {
          type: 'day' as const,
          date: new Date(dayAttr),
          id: el.getAttribute('data-slot-key') || `day-${dayAttr}`,
        };
      }
    }
    return null;
  };

  // Keyboard Escape listener to cancel carrying/dragging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (carriedTask || draggedTask)) {
        setCarriedTask(null);
        setDraggedTask(null);
        setPointerPos(null);
        setDragOverTarget(null);
        setIsPointerDragging(false);
        setToastMessage('تم إلغاء عملية النقل');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carriedTask, draggedTask]);

  // Window dragover to track pointer for native HTML5 drag
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      if (draggedTask || carriedTask) {
        setPointerPos({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('dragover', handleWindowDragOver);
    return () => window.removeEventListener('dragover', handleWindowDragOver);
  }, [draggedTask, carriedTask]);

  // Start smooth pointer/touch dragging after long press is verified
  const startActiveDrag = (task: GripTask, startX: number, startY: number) => {
    activeDragTaskRef.current = task;
    setCarriedTask(task);
    setDraggedTask(task);
    setPointerPos({ x: startX, y: startY });
    setIsPointerDragging(true);
    triggerInstantFeedback();
    setToastMessage(`تم تحديد «${task.title}»: حرّك إصبعك نحو الوقت أو اليوم المطلوب.`);

    let lastTargetId: string | null = null;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.cancelable) moveEvent.preventDefault();
      const currentX = moveEvent.clientX;
      const currentY = moveEvent.clientY;
      setPointerPos({ x: currentX, y: currentY });

      const target = findDropTargetAtPoint(currentX, currentY);
      if (target) {
        if (target.id !== lastTargetId) {
          lastTargetId = target.id;
          setDragOverTarget(target.id);
          triggerInstantFeedback();
        }
      } else {
        if (lastTargetId !== null) {
          lastTargetId = null;
          setDragOverTarget(null);
        }
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      setIsPointerDragging(false);

      const movingTask = activeDragTaskRef.current || task;
      const finalTarget = findDropTargetAtPoint(upEvent.clientX, upEvent.clientY);

      if (finalTarget) {
        if (finalTarget.type === 'hour') {
          handleDropOnHourSlot(finalTarget.hour, movingTask);
        } else if (finalTarget.type === 'day') {
          handleDropOnDayColumn(finalTarget.date, movingTask);
        }
        setCarriedTask(null);
        setDraggedTask(null);
        setPointerPos(null);
        setDragOverTarget(null);
      } else {
        // If moved distance is small, keep in "Carried (Pick & Place)" mode so user can click a slot
        const dist = Math.hypot(upEvent.clientX - startX, upEvent.clientY - startY);
        if (dist > 35) {
          setCarriedTask(null);
          setDraggedTask(null);
          setPointerPos(null);
          setDragOverTarget(null);
        } else {
          setToastMessage(`تم تحديد «${task.title}»: انقر على أي خانة في الجدول لنقلها.`);
        }
      }
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Initiate Long Press detection on tasks (allows smooth scrolling without accidental moves)
  const handleTaskPointerDown = (task: GripTask, e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (task.status === 'done' || task.status === 'done_early') return;

    // Do NOT trigger long-press when clicking action buttons
    const targetElem = e.target as HTMLElement;
    if (targetElem.closest('button:not([data-grip-handle])')) return;

    const startX = e.clientX;
    const startY = e.clientY;
    longPressStartPosRef.current = { x: startX, y: startY };
    setHoldingTaskId(task.id);

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const cancelLongPress = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setHoldingTaskId(null);
      window.removeEventListener('pointermove', onMoveCheck);
      window.removeEventListener('pointerup', onEarlyUp);
      window.removeEventListener('pointercancel', onEarlyUp);
    };

    const onMoveCheck = (moveEvent: PointerEvent) => {
      if (!longPressStartPosRef.current) return;
      const dx = Math.abs(moveEvent.clientX - longPressStartPosRef.current.x);
      const dy = Math.abs(moveEvent.clientY - longPressStartPosRef.current.y);
      // If finger or pointer moves more than 8px (user is naturally scrolling!), cancel long press immediately
      if (dx > 8 || dy > 8) {
        cancelLongPress();
      }
    };

    const onEarlyUp = () => {
      cancelLongPress();
    };

    window.addEventListener('pointermove', onMoveCheck);
    window.addEventListener('pointerup', onEarlyUp);
    window.addEventListener('pointercancel', onEarlyUp);

    // 380ms hold required to activate drag-and-drop
    longPressTimerRef.current = setTimeout(() => {
      window.removeEventListener('pointermove', onMoveCheck);
      window.removeEventListener('pointerup', onEarlyUp);
      window.removeEventListener('pointercancel', onEarlyUp);
      longPressTimerRef.current = null;
      setHoldingTaskId(null);

      // Light haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch {}
      }

      startActiveDrag(task, startX, startY);
    }, 380);
  };

  // Backwards-compatible alias for any direct call
  const handleStartPointerDrag = (task: GripTask, e: React.PointerEvent) => {
    handleTaskPointerDown(task, e);
  };

  // Toggle Carry mode (one-click pick up & place anywhere)
  const handleToggleCarryTask = (task: GripTask) => {
    if (task.status === 'done' || task.status === 'done_early') return;
    if (carriedTask?.id === task.id) {
      setCarriedTask(null);
      setDraggedTask(null);
      setPointerPos(null);
      setDragOverTarget(null);
      setToastMessage('تم إلغاء حمل المهمة');
    } else {
      setCarriedTask(task);
      setDraggedTask(task);
      triggerInstantFeedback();
      setToastMessage(`تم تحديد «${task.title}»: انقر على أي ساعة لنقلها إليها.`);
    }
  };

  // Drag and Drop core handlers (Native HTML5 compatibility)
  const handleDragStart = (e: React.DragEvent, task: GripTask) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    activeDragTaskRef.current = task;
    setDraggedTask(task);
    setCarriedTask(task);
    setPointerPos({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setCarriedTask(null);
    setDragOverTarget(null);
    setPointerPos(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setPointerPos({ x: e.clientX, y: e.clientY });
    if (dragOverTarget !== targetId) {
      setDragOverTarget(targetId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, targetId: string) => {
    // Only clear if leaving the actual container
    if (e.currentTarget === e.target && dragOverTarget === targetId) {
      setDragOverTarget(null);
    }
  };

  // Reschedule to an hour slot on selectedDate - INSTANTANEOUS OPTIMISTIC UPDATE
  const handleDropOnHourSlot = (hour: number, taskOverride?: GripTask) => {
    const taskToMove = taskOverride || activeDragTaskRef.current || carriedTask || draggedTask;
    if (!taskToMove) return;
    const origStart = new Date(taskToMove.startTime).getTime();
    const origEnd = new Date(taskToMove.endTime).getTime();
    const duration = Math.max(15 * 60 * 1000, origEnd - origStart || 60 * 60 * 1000);

    const newStart = new Date(selectedDate);
    newStart.setHours(hour, 0, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);

    const newStartIso = newStart.toISOString();
    const newEndIso = newEnd.toISOString();

    // 1. Instant optimistic state update (0ms latency visually)
    setOptimisticOverrides((prev) => ({
      ...prev,
      [taskToMove.id]: { startTime: newStartIso, endTime: newEndIso },
    }));

    // 2. Instant visual badge & highlight indicator
    setRecentlyMovedTaskId(taskToMove.id);
    setTimeout(() => {
      setRecentlyMovedTaskId((current) => (current === taskToMove.id ? null : current));
    }, 2500);

    // 3. Instant tactile feedback
    triggerInstantFeedback();

    // 4. Notify parent state asynchronously without blocking UI
    if (onRescheduleTask) {
      onRescheduleTask(taskToMove.id, newStartIso, newEndIso);
    }

    setToastMessage(`تم نقل «${taskToMove.title}» إلى الساعة ${formatHourLabel(hour)}`);
    setDraggedTask(null);
    setCarriedTask(null);
    setPointerPos(null);
    setDragOverTarget(null);
    activeDragTaskRef.current = null;
  };

  // Reschedule to another day - INSTANTANEOUS OPTIMISTIC UPDATE
  const handleDropOnDayColumn = (targetDay: Date, taskOverride?: GripTask) => {
    const taskToMove = taskOverride || activeDragTaskRef.current || carriedTask || draggedTask;
    if (!taskToMove) return;
    const origStart = new Date(taskToMove.startTime);
    const origEnd = new Date(taskToMove.endTime);
    const duration = Math.max(15 * 60 * 1000, origEnd.getTime() - origStart.getTime() || 60 * 60 * 1000);

    const newStart = new Date(targetDay);
    newStart.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);

    const newStartIso = newStart.toISOString();
    const newEndIso = newEnd.toISOString();

    // 1. Instant optimistic state update
    setOptimisticOverrides((prev) => ({
      ...prev,
      [taskToMove.id]: { startTime: newStartIso, endTime: newEndIso },
    }));

    // 2. Instant visual badge & highlight
    setRecentlyMovedTaskId(taskToMove.id);
    setTimeout(() => {
      setRecentlyMovedTaskId((current) => (current === taskToMove.id ? null : current));
    }, 2500);

    // 3. Instant tactile feedback
    triggerInstantFeedback();

    // 4. Notify parent
    if (onRescheduleTask) {
      onRescheduleTask(taskToMove.id, newStartIso, newEndIso);
    }

    const dayName = targetDay.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' });
    setToastMessage(`تم نقل «${taskToMove.title}» إلى ${dayName} (${formatTime(newStartIso)})`);
    setDraggedTask(null);
    setCarriedTask(null);
    setPointerPos(null);
    setDragOverTarget(null);
    activeDragTaskRef.current = null;
  };

  // Quick Reschedule handler from modal - INSTANTANEOUS OPTIMISTIC UPDATE
  const handleQuickReschedule = (hour: number, dayOffset = 0) => {
    if (!rescheduleModalTask) return;
    const taskToMove = rescheduleModalTask;
    const origStart = new Date(taskToMove.startTime);
    const origEnd = new Date(taskToMove.endTime);
    const duration = Math.max(15 * 60 * 1000, origEnd.getTime() - origStart.getTime() || 60 * 60 * 1000);

    const newStart = new Date(selectedDate);
    newStart.setDate(newStart.getDate() + dayOffset);
    newStart.setHours(hour, 0, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);

    const newStartIso = newStart.toISOString();
    const newEndIso = newEnd.toISOString();

    // 1. Instant optimistic state
    setOptimisticOverrides((prev) => ({
      ...prev,
      [taskToMove.id]: { startTime: newStartIso, endTime: newEndIso },
    }));

    // 2. Instant highlight
    setRecentlyMovedTaskId(taskToMove.id);
    setTimeout(() => {
      setRecentlyMovedTaskId((current) => (current === taskToMove.id ? null : current));
    }, 2500);

    // 3. Instant tactile feedback
    triggerInstantFeedback();

    // 4. Notify parent
    if (onRescheduleTask) {
      onRescheduleTask(taskToMove.id, newStartIso, newEndIso);
    }

    setToastMessage(`تمت إعادة جدولة «${taskToMove.title}» بنجاح`);
    setRescheduleModalTask(null);
  };

  // Hours displayed on the daily timeline (06:00 to 23:00)
  const timelineHours = Array.from({ length: 18 }, (_, i) => i + 6);

  return (
    <div className="w-full flex flex-col gap-5 select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border border-purple-500/30 animate-bounce">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Active Drag Banner */}
      {draggedTask && (
        <div className="sticky top-2 z-40 bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-purple-400/40 animate-pulse">
          <div className="flex items-center gap-2.5">
            <Move className="w-5 h-5 animate-spin text-purple-200" />
            <div>
              <p className="text-xs font-black">جاري سحب: «{draggedTask.title}»</p>
              <p className="text-[11px] text-purple-200">أفلت المهمة في أي ساعة أو يوم لإعادة جدولتها فوراً</p>
            </div>
          </div>
          <button
            onClick={() => setDraggedTask(null)}
            className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold text-white transition"
          >
            إلغاء
          </button>
        </div>
      )}

      {/* Top Header & View Mode Switcher */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Date Info and Stepper */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black">{arabicMonth}</h2>
                {showHijriCalendar && (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/50 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                    <Moon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{hijriMonth}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{arabicDayName}</span>
                {showHijriCalendar && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Moon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{hijriFullDate}</span>
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Steppers & View Tabs */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-wrap">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode: Day / Week / Month - أزرق */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'day'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                }`}
              >
                يومي
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                }`}
              >
                أسبوعي
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                }`}
              >
                شهري
              </button>
            </div>

            {/* Day SubView: List vs Timeline */}
            {viewMode === 'day' && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setDaySubView('list')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    daySubView === 'list'
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                  }`}
                  title="عرض كقائمة مهام"
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>قائمة المهام</span>
                </button>
                <button
                  onClick={() => setDaySubView('timeline')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    daySubView === 'timeline'
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                  }`}
                  title="عرض بالساعات"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>جدول الساعات</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            الكل ({tasks.length})
          </button>
          {Object.entries(CATEGORY_COLORS).map(([catKey, cat]) => {
            const count = tasks.filter((t) => t.category === catKey).length;
            const isSelected = categoryFilter === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setCategoryFilter(catKey as TaskCategory)}
                style={{
                  backgroundColor: isSelected ? cat.bg : undefined,
                  color: isSelected ? cat.text : undefined,
                  borderColor: isSelected ? cat.border : undefined,
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap border cursor-pointer ${
                  isSelected
                    ? 'shadow-sm font-black'
                    : 'bg-slate-100 dark:bg-slate-800/80 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>



      {/* VIEW: DAY VIEW */}
      {viewMode === 'day' && (
        <div className="flex flex-col gap-4">
          {/* SUBVIEW 1: TIMELINE GRID WITH DROPPABLE TIME SLOTS */}
          {daySubView === 'timeline' && (
            <div className={`p-4 sm:p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                    جدول الساعات لليوم ({tasksForSelectedDay.length} مهمة)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    اسحب أي مهمة من مقبض ⠿ وأفلتها داخل خانة الساعة المرغوبة لنقلها فوراً
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {showHijriCalendar && (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Moon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{hijriDayShort}</span>
                    </span>
                  )}
                  <span className="text-xs font-bold text-[#6D28D9] bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-xl">
                    {arabicDayName}
                  </span>
                </div>
              </div>

              {/* Time Slots Grid (Google Calendar Android Material 3 Style) */}
              <div className="flex flex-col gap-2.5">
                {timelineHours.map((hour) => {
                  const slotKey = `slot-${hour}`;
                  const isDropTarget = dragOverTarget === slotKey;
                  const isAnyCarried = Boolean(carriedTask || draggedTask);

                  // Current time check for Google Calendar live time indicator
                  const now = new Date();
                  const isToday = selectedDate.toDateString() === now.toDateString();
                  const isCurrentHour = isToday && now.getHours() === hour;

                  // Tasks that fall in this hour slot
                  const slotTasks = tasksForSelectedDay.filter((task) => {
                    const taskHour = new Date(task.startTime).getHours();
                    return taskHour === hour;
                  });

                  return (
                    <div
                      key={hour}
                      data-drop-hour={hour}
                      data-slot-key={slotKey}
                      onClick={() => {
                        if (carriedTask) {
                          handleDropOnHourSlot(hour, carriedTask);
                        }
                      }}
                      onDragOver={(e) => handleDragOver(e, slotKey)}
                      onDragLeave={(e) => handleDragLeave(e, slotKey)}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropOnHourSlot(hour);
                      }}
                      className={`relative rounded-2xl transition-all duration-200 p-2 sm:p-2.5 flex items-start gap-2.5 sm:gap-3.5 ${
                        isDropTarget
                          ? 'border-2 border-dashed border-[#7C3AED] bg-purple-100/90 dark:bg-purple-900/60 ring-4 ring-purple-400/40 shadow-md'
                          : isAnyCarried
                          ? 'border-2 border-dashed border-purple-300 dark:border-purple-800/80 bg-purple-50/40 dark:bg-slate-800/40 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 cursor-pointer'
                          : 'border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30'
                      }`}
                    >
                      {/* Google Calendar Time Gutter (Right in RTL) */}
                      <div className="w-14 sm:w-16 shrink-0 flex flex-col items-center pt-1.5 select-none pointer-events-none">
                        <span className={`text-xs font-mono font-black ${isCurrentHour ? 'text-[#6D28D9] dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {String(hour).padStart(2, '0')}:00
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatHourLabel(hour)}
                        </span>
                        {isCurrentHour && (
                          <span className="mt-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#6D28D9] text-white animate-pulse">
                            الآن
                          </span>
                        )}
                      </div>

                      {/* Drop Zone & Google Calendar Cards Container */}
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        {/* Drop Target Indicator */}
                        {isDropTarget && (
                          <div className="p-3 rounded-2xl border border-dashed border-[#6D28D9] bg-[#E9E3FB] dark:bg-purple-900/70 text-[#6D28D9] dark:text-purple-200 text-xs font-black flex items-center justify-center gap-2 animate-pulse shadow-md">
                            <Move className="w-4 h-4" />
                            <span>أفلت هنا لنقل المهمة إلى الساعة {formatHourLabel(hour)}</span>
                          </div>
                        )}

                        {/* Empty Hour Card (Google Calendar Touch Slot) */}
                        {slotTasks.length === 0 && !isDropTarget && (
                          <div
                            onClick={(e) => {
                              if (!carriedTask) {
                                onAddTask();
                              }
                            }}
                            className={`min-h-[46px] rounded-2xl border border-dashed flex items-center justify-between px-3.5 text-xs transition-all duration-200 ${
                              isAnyCarried
                                ? 'border-purple-400/80 bg-purple-100/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold cursor-pointer shadow-sm'
                                : 'border-slate-200/90 dark:border-slate-800 text-slate-400 hover:text-[#6D28D9] hover:border-purple-300 dark:hover:border-purple-700 bg-white/70 dark:bg-slate-900/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 cursor-pointer shadow-xs group active:scale-[0.99]'
                            }`}
                          >
                            <span className="font-medium text-[11px] sm:text-xs">
                              {isAnyCarried
                                ? `انقر لنقل «${(carriedTask || draggedTask)?.title}» إلى الساعة ${formatHourLabel(hour)}`
                                : `+ إضافة مهمة في الساعة ${formatHourLabel(hour)}`}
                            </span>
                            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-[#6D28D9] group-hover:text-white flex items-center justify-center transition-colors">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        )}

                        {/* Google Calendar Task Cards */}
                        {slotTasks.map((task) => {
                          const catInfo = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.other;
                          const isDone = task.status === 'done' || task.status === 'done_early';
                          const isRunning = task.status === 'in_progress';
                          const isBeingCarried = carriedTask?.id === task.id || draggedTask?.id === task.id;
                          const isJustMoved = recentlyMovedTaskId === task.id;
                          const isHoldingThis = holdingTaskId === task.id;

                          return (
                            <div
                              key={task.id}
                              data-task-id={task.id}
                              draggable={isBeingCarried}
                              onDragStart={(e) => handleDragStart(e, task)}
                              onDragEnd={handleDragEnd}
                              onPointerDown={(e) => {
                                if ((e.target as HTMLElement).closest('button:not([data-grip-handle])')) return;
                                handleTaskPointerDown(task, e);
                              }}
                              style={{ touchAction: 'pan-y' }}
                              className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col gap-2.5 overflow-hidden max-w-full box-border shadow-xs select-none ${
                                isJustMoved
                                  ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-lg scale-[1.01] animate-pulse'
                                  : isHoldingThis
                                  ? 'ring-2 ring-purple-500 scale-[1.02] shadow-lg border-purple-400 bg-purple-50 dark:bg-purple-950/60 transition-transform'
                                  : isBeingCarried
                                  ? 'opacity-35 scale-95 border-2 border-dashed border-[#7C3AED] bg-purple-100/60 dark:bg-purple-950/40 cursor-grabbing'
                                  : isDone
                                  ? 'opacity-65 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                                  : isRunning
                                  ? 'bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/40 dark:to-slate-900 border-purple-400 shadow-md ring-1 ring-purple-400/30'
                                  : isDarkMode
                                  ? 'bg-slate-900/90 border-slate-700/80 hover:border-purple-500/50 shadow-sm hover:shadow-md'
                                  : 'bg-white border-slate-200/90 hover:border-purple-300 hover:shadow-md'
                              }`}
                            >
                              {/* UPPER ROW: Grip Handle + Title on right, Action Buttons Toolbar on left */}
                              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 min-w-0 w-full max-w-full overflow-hidden">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1 max-w-full">
                                  {/* Color Accent Pill (Google Calendar style) */}
                                  <div
                                    className="w-1.5 h-6 rounded-full shrink-0"
                                    style={{ backgroundColor: catInfo.border }}
                                  />

                                  {/* Grip Drag Handle */}
                                  <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                                    {!isDone ? (
                                      <button
                                        type="button"
                                        data-grip-handle="true"
                                        onPointerDown={(e) => {
                                          e.stopPropagation();
                                          handleTaskPointerDown(task, e);
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleCarryTask(task);
                                        }}
                                        className={`w-7 h-7 rounded-lg transition-all shrink-0 select-none cursor-grab active:cursor-grabbing flex items-center justify-center ${
                                          isBeingCarried
                                            ? 'bg-[#6D28D9] text-white shadow-md ring-2 ring-purple-300'
                                            : isHoldingThis
                                            ? 'bg-purple-600 text-white animate-pulse'
                                            : 'bg-slate-100 dark:bg-slate-700/70 text-slate-400 hover:text-purple-600 hover:bg-purple-100/70 dark:hover:bg-purple-900/50'
                                        }`}
                                        title="اضغط مطولاً للنقل، أو انقر لحمل المهمة وتثبيتها في خانة أخرى"
                                      >
                                        <GripVertical className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <div
                                        className="w-7 h-7 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0"
                                        title="مهمة مكتملة"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Title */}
                                  <h4 className={`text-sm font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                    {task.title}
                                  </h4>
                                </div>

                                {/* Unified Action Buttons Toolbar */}
                                <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0 max-w-full overflow-x-auto">
                                  {/* Done Early */}
                                  {!isDone && (
                                    <CalendarDoneEarlyButton task={task} onDone={onMarkDoneEarly} />
                                  )}

                                  {/* Overlay Test or Wake-Up Alarm Test */}
                                  {!isDone && (
                                    (task.isWakeUpAlarm || task.category === 'wake_up') ? (
                                      <button
                                        type="button"
                                        onClick={() => onTriggerWakeUpModal?.(task)}
                                        className="h-7 px-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap shadow-xs active:scale-95"
                                        title="تجربة رنين منبه الصحوة الحاسم"
                                      >
                                        <Bell className="w-3 h-3 text-amber-100 shrink-0 animate-pulse" />
                                        <span>تجربة المنبه</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => onTriggerOverlay(task)}
                                        className="h-7 px-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap shadow-xs active:scale-95"
                                        title="اختبار شاشة الإنفاذ الحقيقية"
                                      >
                                        <ShieldAlert className="w-3 h-3 text-purple-200 shrink-0" />
                                        <span>إنفاذ</span>
                                      </button>
                                    )
                                  )}

                                  {/* Quick Reschedule Button */}
                                  {!isDone && (
                                    <button
                                      type="button"
                                      onClick={() => setRescheduleModalTask(task)}
                                      className="w-7 h-7 rounded-lg text-slate-600 dark:text-slate-300 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer flex items-center justify-center shrink-0"
                                      title="إعادة جدولة سريعة"
                                    >
                                      <CalendarClock className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Edit */}
                                  <button
                                    type="button"
                                    onClick={() => onEditTask(task)}
                                    className="w-7 h-7 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer flex items-center justify-center shrink-0"
                                    title="تعديل المهمة"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => onDeleteTask(task.id)}
                                    className="w-7 h-7 rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer flex items-center justify-center shrink-0"
                                    title="حذف المهمة"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* LOWER ROW: Google Calendar Metadata Badges */}
                              <div className="pr-10.5 flex flex-wrap items-center gap-1.5 text-[10px] min-w-0">
                                {/* Category Tag */}
                                <span
                                  style={{ backgroundColor: catInfo.bg, color: catInfo.text, borderColor: catInfo.border }}
                                  className="px-2 py-0.5 rounded-md font-bold border shrink-0 text-center"
                                >
                                  {catInfo.label}
                                </span>

                                {/* Fixed vs Flexible Badge */}
                                {task.type === 'FIXED' ? (
                                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 font-bold shrink-0 flex items-center gap-1">
                                    <Pin className="w-2.5 h-2.5" />
                                    <span>ثابت</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 font-bold shrink-0 flex items-center gap-1">
                                    <Zap className="w-2.5 h-2.5" />
                                    <span>مرن</span>
                                  </span>
                                )}

                                {/* Time Slot */}
                                <span className="text-slate-500 dark:text-slate-400 font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 shrink-0 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{formatTime(task.startTime)} - {formatTime(task.endTime)}</span>
                                </span>

                                {/* Status */}
                                {task.status === 'done_early' && (
                                  <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    منجز مبكراً
                                  </span>
                                )}
                                {task.status === 'done' && (
                                  <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    مكتمل
                                  </span>
                                )}
                                {isRunning && (
                                  <span className="px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                                    قيد التنفيذ
                                  </span>
                                )}

                                {/* Notes preview */}
                                {task.notes && (
                                  <span className="text-slate-400 truncate max-w-[220px]" title={task.notes}>
                                    • {task.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUBVIEW 2: ENHANCED TASKS LIST VIEW (قائمة المهام المتطورة) */}
          {daySubView === 'list' && (() => {
            const totalDayTasks = tasksForSelectedDay.length;
            const doneDayTasks = tasksForSelectedDay.filter((t) => t.status === 'done' || t.status === 'done_early').length;
            const pendingDayTasks = totalDayTasks - doneDayTasks;
            const completionPercentage = totalDayTasks > 0 ? Math.round((doneDayTasks / totalDayTasks) * 100) : 0;

            // Filter tasks by status and search query
            const displayListTasks = tasksForSelectedDay.filter((t) => {
              const isDone = t.status === 'done' || t.status === 'done_early';
              if (listStatusFilter === 'pending' && isDone) return false;
              if (listStatusFilter === 'done' && !isDone) return false;

              if (listSearchQuery.trim()) {
                const q = listSearchQuery.trim().toLowerCase();
                const titleMatch = (t.title || '').toLowerCase().includes(q);
                const notesMatch = t.notes ? t.notes.toLowerCase().includes(q) : false;
                const catLabel = (CATEGORY_COLORS[t.category]?.label || '').toLowerCase();
                if (!titleMatch && !notesMatch && !catLabel.includes(q)) return false;
              }
              return true;
            });

            // Export tasks of selected day to CSV
            const handleExportTasksCsv = () => {
              const headers = ['المهمة', 'التصنيف', 'النوع', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة', 'ملاحظات'];
              const rows = tasksForSelectedDay.map((t) => [
                `"${(t.title || '').replace(/"/g, '""')}"`,
                `"${CATEGORY_COLORS[t.category]?.label || t.category || ''}"`,
                `"${t.type === 'FIXED' ? 'موعد ثابت' : 'مرن'}"`,
                `"${new Date(t.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}"`,
                `"${new Date(t.endTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}"`,
                `"${t.status === 'done' || t.status === 'done_early' ? 'مكتمل' : 'معلق'}"`,
                `"${(t.notes || '').replace(/"/g, '""')}"`,
              ]);

              const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `grip-tasks-${selectedDate.toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              setToastMessage('تم تصدير كشف المهام كملف CSV بنجاح');
            };

            return (
              <div className="flex flex-col gap-3.5">
                {/* 1. Daily Progress & Quick Action Header Card */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border transition shadow-xs ${
                    isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-300 flex items-center justify-center font-bold">
                        <ListTodo className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                            قائمة المهام اليومية ({totalDayTasks} مهمة)
                          </h3>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-[#6D28D9] dark:text-purple-300">
                            {completionPercentage}% منجز
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {doneDayTasks} مكتملة • {pendingDayTasks} متبقية لليوم
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {totalDayTasks > 0 && (
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={handleExportTasksCsv}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="تصدير جدول المهام لملف Excel / CSV"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">تصدير CSV</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-[#6D28D9] via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                {/* 2. Search & Status Filter Pills */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  {/* Status Tabs */}
                  <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shrink-0 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setListStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        listStatusFilter === 'all'
                          ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      الكل ({totalDayTasks})
                    </button>
                    <button
                      type="button"
                      onClick={() => setListStatusFilter('pending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        listStatusFilter === 'pending'
                          ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      المتبقية ({pendingDayTasks})
                    </button>
                    <button
                      type="button"
                      onClick={() => setListStatusFilter('done')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        listStatusFilter === 'done'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      المكتملة ({doneDayTasks})
                    </button>
                  </div>

                  {/* Search Box */}
                  <div className="relative flex-1 sm:max-w-xs">
                    <input
                      type="text"
                      value={listSearchQuery}
                      onChange={(e) => setListSearchQuery(e.target.value)}
                      placeholder="بحث في أسماء المهام والملاحظات..."
                      className="w-full pl-8 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6D28D9] transition"
                    />
                    <div className="absolute right-3 top-2.5 text-slate-400 pointer-events-none">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    {listSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setListSearchQuery('')}
                        className="absolute left-2.5 top-2 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Task Cards List */}
                {displayListTasks.length === 0 ? (
                  <div
                    className={`p-10 text-center rounded-2xl border ${
                      isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                      {listSearchQuery ? 'لا توجد مهام مطابقة للبحث' : 'لا توجد مهام مسجلة لهذا اليوم'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {listSearchQuery
                        ? 'جرب البحث بكلمة مختلفة أو قم بإلغاء الفلتر الحالي.'
                        : 'أضف مهامك يدوياً أو استخدم الصوت السريع لتنظيم يومك وكسر المماطلة.'}
                    </p>

                    {/* Quick Starter */}
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={onAddTask}
                        className="px-4 py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة مهمة جديدة</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {displayListTasks.map((task) => {
                      const catInfo = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.other;
                      const isFixed = task.type === 'FIXED';
                      const isDone = task.status === 'done' || task.status === 'done_early';
                      const isRunning = task.status === 'in_progress';
                      const isBeingCarried = carriedTask?.id === task.id || draggedTask?.id === task.id;
                      const isJustMoved = recentlyMovedTaskId === task.id;
                      const isHoldingThis = holdingTaskId === task.id;

                      // Time period determination
                      const startHour = new Date(task.startTime).getHours();
                      const timePeriodLabel =
                        startHour < 12
                          ? 'صباحاً'
                          : startHour < 17
                          ? 'ظهراً وعصراً'
                          : 'مساءً وليلاً';

                      return (
                        <div
                          key={task.id}
                          data-task-id={task.id}
                          draggable={isBeingCarried}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          onPointerDown={(e) => {
                            if ((e.target as HTMLElement).closest('button:not([data-grip-handle])')) return;
                            handleTaskPointerDown(task, e);
                          }}
                          style={{ touchAction: 'pan-y' }}
                          className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 overflow-hidden max-w-full box-border select-none ${
                            isJustMoved
                              ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-lg scale-[1.01] animate-pulse'
                              : isHoldingThis
                              ? 'ring-2 ring-purple-500 scale-[1.02] shadow-lg border-purple-400 bg-purple-50 dark:bg-purple-950/60 transition-transform'
                              : isBeingCarried
                              ? 'opacity-35 scale-95 border-2 border-dashed border-[#7C3AED] bg-purple-100/60 dark:bg-purple-950/40 cursor-grabbing'
                              : isDone
                              ? 'opacity-70 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                              : isRunning
                              ? 'bg-gradient-to-r from-purple-50/70 to-white dark:from-purple-950/30 dark:to-slate-900 border-purple-300 dark:border-purple-800 shadow-md ring-1 ring-purple-400/30'
                              : isDarkMode
                              ? 'bg-slate-900/90 border-slate-800 hover:border-purple-500/50'
                              : 'bg-white border-slate-200/90 shadow-xs hover:border-purple-300'
                          }`}
                        >
                          <div className="flex flex-col gap-2.5 overflow-hidden max-w-full">
                            {/* Upper Row: Checkbox, Grip, Time, Title, and Actions */}
                            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 min-w-0 w-full max-w-full overflow-hidden">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1 max-w-full">
                                {/* Direct 1-Tap Quick Completion Toggle Checkbox */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isDone) {
                                      if (onToggleTaskStatus) {
                                        onToggleTaskStatus(task.id, 'pending');
                                      } else {
                                        onEditTask({ ...task, status: 'pending', completedAt: undefined });
                                      }
                                      triggerInstantFeedback();
                                      hapticFeedback.light();
                                      setToastMessage(`تم إعادة فتح المهمة «${task.title}»`);
                                    } else {
                                      onMarkDoneEarly(task);
                                      triggerInstantFeedback();
                                      hapticFeedback.success();
                                      setToastMessage(`تم إنجاز «${task.title}» بنجاح`);
                                    }
                                  }}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                    isDone
                                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                                      : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                  }`}
                                  title={isDone ? 'انقر لإلغاء الإكمال وإعادة فتح المهمة' : 'انقر لتعليم المهمة كمكتملة فوراً'}
                                >
                                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>

                                {/* Drag Handle Slot */}
                                <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                                  {!isDone ? (
                                    <button
                                      type="button"
                                      data-grip-handle="true"
                                      onPointerDown={(e) => {
                                        e.stopPropagation();
                                        handleTaskPointerDown(task, e);
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleCarryTask(task);
                                      }}
                                      className={`w-7 h-7 rounded-lg transition-all shrink-0 select-none flex items-center justify-center cursor-grab active:cursor-grabbing ${
                                        isBeingCarried
                                          ? 'bg-[#6D28D9] text-white shadow-md ring-2 ring-purple-300'
                                          : isHoldingThis
                                          ? 'bg-purple-600 text-white animate-pulse'
                                          : 'bg-slate-100 dark:bg-slate-700/70 text-slate-400 hover:text-purple-600 hover:bg-purple-100/70 dark:hover:bg-purple-900/50'
                                      }`}
                                      title="اضغط مطولاً للنقل، أو انقر لحمل المهمة وتثبيتها في خانة أخرى"
                                    >
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </button>
                                  ) : null}
                                </div>

                                {/* Time Chip */}
                                <div className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shrink-0 text-center">
                                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 font-mono" dir="ltr">
                                    {formatTime(task.startTime)} - {formatTime(task.endTime)}
                                  </span>
                                </div>

                                {/* Title */}
                                <h4
                                  className={`text-sm font-bold truncate ${
                                    isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
                                  }`}
                                >
                                  {task.title}
                                </h4>
                              </div>

                              {/* Unified Action Buttons Toolbar */}
                              <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0 max-w-full overflow-x-auto">
                                {/* Done Early 2-sec hold button */}
                                {!isDone && <CalendarDoneEarlyButton task={task} onDone={onMarkDoneEarly} />}

                                {/* Trigger Overlay simulator or Wake-Up Alarm Test */}
                                {!isDone &&
                                  (task.isWakeUpAlarm || task.category === 'wake_up' ? (
                                    <button
                                      type="button"
                                      onClick={() => onTriggerWakeUpModal?.(task)}
                                      className="h-7 px-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 shadow-xs active:scale-95"
                                      title="تجربة رنين منبه الصحوة الحاسم"
                                    >
                                      <Bell className="w-3 h-3 text-amber-100 shrink-0 animate-pulse" />
                                      <span>تجربة المنبه</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => onTriggerOverlay(task)}
                                      className="h-7 px-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 shadow-xs active:scale-95"
                                      title="اختبر شاشة الإنفاذ (Overlay) الآن"
                                    >
                                      <ShieldAlert className="w-3 h-3 text-purple-200 shrink-0" />
                                      <span>إنفاذ</span>
                                    </button>
                                  ))}

                                {/* Quick Reschedule */}
                                {!isDone && (
                                  <button
                                    type="button"
                                    onClick={() => setRescheduleModalTask(task)}
                                    className="w-7 h-7 rounded-lg text-slate-600 dark:text-slate-300 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer flex items-center justify-center shrink-0"
                                    title="إعادة جدولة سريعة"
                                  >
                                    <CalendarClock className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() => onEditTask(task)}
                                  className="w-7 h-7 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer flex items-center justify-center shrink-0"
                                  title="تعديل"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => onDeleteTask(task.id)}
                                  className="w-7 h-7 rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer flex items-center justify-center shrink-0"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Lower Row: Badges & Info */}
                            <div className="pr-8.5 flex flex-wrap items-center gap-1.5 text-[10px] min-w-0">
                              {/* Time Period Tag */}
                              <span className="px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {timePeriodLabel}
                              </span>

                              {/* Category Badge */}
                              <span
                                style={{ backgroundColor: catInfo.bg, color: catInfo.text, borderColor: catInfo.border }}
                                className="px-2 py-0.5 rounded-md font-bold border shrink-0 text-center"
                              >
                                {catInfo.label}
                              </span>

                              {/* Fixed vs Flexible badge */}
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                                  isFixed
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                                }`}
                              >
                                {isFixed ? <Pin className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                                <span>{isFixed ? 'ثابت (Fixed)' : 'مرن (Flexible)'}</span>
                              </span>

                              {/* Status */}
                              {task.status === 'done_early' && (
                                <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  منجز مبكراً
                                </span>
                              )}
                              {task.status === 'done' && (
                                <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  مكتمل
                                </span>
                              )}
                              {isRunning && (
                                <span className="px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                                  قيد التنفيذ
                                </span>
                              )}

                              {/* Postpone indicator */}
                              {task.postponeCount > 0 && (
                                <div className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                  <Flame className="w-3 h-3" />
                                  <span>تأجيلات: {task.postponeCount}</span>
                                </div>
                              )}

                              {/* Notes */}
                              {task.notes && (
                                <span className="text-slate-400 truncate max-w-[250px]" title={task.notes}>
                                  • {task.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* VIEW: WEEK VIEW (7 Days Horizontal Matrix with Droppable Columns) */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => {
            const dayDate = new Date(selectedDate);
            const currentDayOfWeek = dayDate.getDay(); // 0 is Sun
            const diff = i - currentDayOfWeek;
            dayDate.setDate(dayDate.getDate() + diff);

            const dayTasks = filteredTasks.filter((t) => isSameDay(new Date(t.startTime), dayDate));
            const isToday = isSameDay(dayDate, new Date());
            const isSelected = isSameDay(dayDate, selectedDate);
            const dayKey = `week-day-${i}`;
            const isDropTarget = dragOverTarget === dayKey;
            const isAnyCarried = Boolean(carriedTask || draggedTask);

            return (
              <div
                key={i}
                data-drop-day-date={dayDate.toISOString()}
                data-slot-key={dayKey}
                onClick={() => {
                  if (carriedTask) {
                    handleDropOnDayColumn(dayDate, carriedTask);
                  } else {
                    setSelectedDate(dayDate);
                  }
                }}
                onDragOver={(e) => handleDragOver(e, dayKey)}
                onDragLeave={(e) => handleDragLeave(e, dayKey)}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnDayColumn(dayDate);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer min-h-[170px] flex flex-col relative ${
                  isDropTarget
                    ? 'border-2 border-dashed border-[#7C3AED] bg-purple-100/90 dark:bg-purple-950/70 ring-4 ring-purple-500 scale-[1.02]'
                    : isAnyCarried
                    ? 'border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-slate-800/60 hover:bg-purple-100/60 cursor-pointer shadow-inner'
                    : isSelected
                    ? 'ring-2 ring-[#6D28D9] border-transparent'
                    : isToday
                    ? 'border-purple-300 bg-purple-50/30 dark:bg-purple-950/20'
                    : isDarkMode
                    ? 'bg-slate-900/60 border-slate-800'
                    : 'bg-white border-slate-200/80 shadow-sm'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 pointer-events-none">
                  <div>
                    <span className="text-xs font-bold text-slate-500 block">
                      {dayDate.toLocaleDateString('ar-EG', { weekday: 'short' })}
                    </span>
                    {showHijriCalendar && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block leading-tight">
                        {getHijriDayShort(dayDate)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      isToday ? 'bg-[#6D28D9] text-white' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {dayDate.getDate()}
                  </span>
                </div>

                {/* Drop Indicator */}
                {isDropTarget && (
                  <div className="p-2 mb-2 rounded-xl bg-[#E9E3FB] text-[#6D28D9] text-[10px] font-black text-center animate-pulse border border-[#6D28D9]">
                    أفلت هنا للنقل ليوم {dayDate.toLocaleDateString('ar-EG', { weekday: 'short' })}
                  </div>
                )}

                {/* Tasks List */}
                <div className="space-y-1.5 flex-1 overflow-y-auto">
                  {dayTasks.length === 0 ? (
                    <span className="text-[10px] text-slate-400 block text-center mt-6">
                      {isAnyCarried ? 'انقر هنا للنقل' : 'فارغ'}
                    </span>
                  ) : (
                    dayTasks.map((t) => {
                      const cat = CATEGORY_COLORS[t.category] || CATEGORY_COLORS.other;
                      const isDone = t.status === 'done' || t.status === 'done_early';
                      const isBeingCarried = carriedTask?.id === t.id || draggedTask?.id === t.id;
                      const isJustMoved = recentlyMovedTaskId === t.id;
                      const isHoldingThis = holdingTaskId === t.id;

                      return (
                        <div
                          key={t.id}
                          draggable={isBeingCarried}
                          onDragStart={(e) => handleDragStart(e, t)}
                          onDragEnd={handleDragEnd}
                          onPointerDown={(e) => {
                            if ((e.target as HTMLElement).closest('button:not([data-grip-handle])')) return;
                            handleTaskPointerDown(t, e);
                          }}
                          style={{
                            borderRightColor: cat.border,
                            backgroundColor: isJustMoved
                              ? (isDarkMode ? '#064e3b' : '#DDF4EA')
                              : isBeingCarried
                              ? (isDarkMode ? '#4c1d95' : '#E9E3FB')
                              : cat.bg,
                            touchAction: 'pan-y',
                          }}
                          className={`p-1.5 rounded-lg border-r-4 text-[11px] font-bold truncate transition flex items-center justify-between group select-none ${
                            isDarkMode ? 'text-slate-200' : 'text-slate-900'
                          } ${
                            isJustMoved
                              ? 'ring-2 ring-emerald-500 shadow-md animate-pulse scale-[1.02]'
                              : isHoldingThis
                              ? 'ring-2 ring-purple-500 scale-[1.02] shadow-md border-purple-400 bg-purple-50 dark:bg-purple-950/60 transition-transform'
                              : isBeingCarried
                              ? 'opacity-40 scale-95 border-2 border-dashed border-[#7C3AED] cursor-grabbing'
                              : 'hover:shadow-xs'
                          }`}
                        >
                          <div className="truncate flex-1 min-w-0">
                            <div className={`text-[9px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{formatTime(t.startTime)}</div>
                            <div className="truncate">{t.title}</div>
                          </div>
                          <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                            {!isDone ? (
                              <button
                                type="button"
                                data-grip-handle="true"
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  handleTaskPointerDown(t, e);
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleCarryTask(t);
                                }}
                                className={`w-6 h-6 rounded flex items-center justify-center transition cursor-grab active:cursor-grabbing ${
                                  isBeingCarried
                                    ? 'bg-[#6D28D9] text-white shadow-xs'
                                    : isHoldingThis
                                    ? 'bg-purple-600 text-white animate-pulse'
                                    : 'text-slate-400 hover:text-purple-700'
                                }`}
                                title="اضغط مطولاً للنقل، أو انقر لحمل المهمة"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: MONTH VIEW (Grid with Droppable Days) */}
      {viewMode === 'month' && (
        <div className={`p-4 sm:p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          {showHijriCalendar && (
            <div className="mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">التقويم الهجري المقابل لهذا الشهر:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                <Moon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{hijriMonth}</span>
              </span>
            </div>
          )}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400">
            <div>السبت</div>
            <div>الأحد</div>
            <div>الاثنين</div>
            <div>الثلاثاء</div>
            <div>الأربعاء</div>
            <div>الخميس</div>
            <div>الجمعة</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, idx) => {
              const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
              const dayOffset = (startOfMonth.getDay() + 1) % 7; // Align to Saturday
              const dayNumber = idx - dayOffset + 1;
              const cellDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dayNumber);
              const isCurrentMonth = cellDate.getMonth() === selectedDate.getMonth();
              const isToday = isSameDay(cellDate, new Date());
              const isSelected = isSameDay(cellDate, selectedDate);
              const cellKey = `month-cell-${idx}`;
              const isDropTarget = dragOverTarget === cellKey;
              const isAnyCarried = Boolean(carriedTask || draggedTask);

              const cellTasks = filteredTasks.filter((t) => isSameDay(new Date(t.startTime), cellDate));

              return (
                <div
                  key={idx}
                  data-drop-day-date={cellDate.toISOString()}
                  data-slot-key={cellKey}
                  onClick={() => {
                    if (carriedTask) {
                      handleDropOnDayColumn(cellDate, carriedTask);
                    } else {
                      setSelectedDate(cellDate);
                    }
                  }}
                  onDragOver={(e) => handleDragOver(e, cellKey)}
                  onDragLeave={(e) => handleDragLeave(e, cellKey)}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropOnDayColumn(cellDate);
                  }}
                  className={`min-h-[74px] p-1.5 rounded-xl border transition cursor-pointer flex flex-col justify-between relative ${
                    isDropTarget
                      ? 'border-2 border-dashed border-[#7C3AED] bg-purple-100 dark:bg-purple-950/70 ring-4 ring-purple-400 scale-[1.03]'
                      : isAnyCarried
                      ? 'border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/40 hover:bg-purple-100/70 cursor-pointer'
                      : isSelected
                      ? 'ring-2 ring-[#6D28D9] border-transparent'
                      : !isCurrentMonth
                      ? 'opacity-30 border-transparent'
                      : isToday
                      ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300'
                      : 'border-slate-100 dark:border-slate-800 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {isDropTarget ? (
                      <span className="text-[9px] font-black text-[#6D28D9]">نقل هنا</span>
                    ) : showHijriCalendar && isCurrentMonth ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 select-none" title={`هجري: ${getHijriDayShort(cellDate)}`}>
                        {getHijriDayNumber(cellDate)}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span
                      className={`text-xs font-bold mr-auto w-5 h-5 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-[#6D28D9] text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cellDate.getDate()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {cellTasks.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[t.category]?.border || '#7C3AED' }}
                        title={`${formatTime(t.startTime)}: ${t.title}`}
                      />
                    ))}
                    {cellTasks.length > 3 && (
                      <span className="text-[9px] font-black text-purple-600">+{cellTasks.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK RESCHEDULE MODAL (Accessible alternative for touch / 1-tap reschedule) */}
      {rescheduleModalTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-[#6D28D9]">
                <CalendarClock className="w-5 h-5" />
                <h3 className="font-black text-sm">إعادة جدولة سريعة</h3>
              </div>
              <button
                onClick={() => setRescheduleModalTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 font-semibold">
              المهمة: <span className="text-slate-900 dark:text-white font-black">{rescheduleModalTask.title}</span>
            </p>

            <div className="mt-4 space-y-3">
              <p className="text-[11px] font-bold text-slate-400">اختر موعداً جديداً بنقرة واحدة:</p>
              
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  onClick={() => handleQuickReschedule(9)}
                  className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-purple-300 hover:bg-purple-100 border border-purple-200 transition text-center"
                >
                  صباحاً (09:00 ص)
                </button>
                <button
                  onClick={() => handleQuickReschedule(13)}
                  className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-purple-300 hover:bg-purple-100 border border-purple-200 transition text-center"
                >
                  ظهراً (01:00 م)
                </button>
                <button
                  onClick={() => handleQuickReschedule(17)}
                  className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-purple-300 hover:bg-purple-100 border border-purple-200 transition text-center"
                >
                  عصراً (05:00 م)
                </button>
                <button
                  onClick={() => handleQuickReschedule(20)}
                  className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-purple-300 hover:bg-purple-100 border border-purple-200 transition text-center"
                >
                  مساءً (08:00 م)
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleQuickReschedule(new Date(rescheduleModalTask.startTime).getHours(), 1)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-black text-slate-800 dark:text-slate-200 transition text-center flex items-center justify-center gap-1.5"
                >
                  <CalendarClock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>نقل إلى الغد في نفس الوقت</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CARRIED CARD PREVIEW (Follows Pointer/Finger Live across the screen) */}
      {(carriedTask || draggedTask) && pointerPos && (
        <div
          className="fixed pointer-events-none z-[99999] transition-transform duration-75 ease-out select-none"
          style={{
            left: `${pointerPos.x}px`,
            top: `${pointerPos.y - 45}px`,
            transform: 'translate(-50%, -50%) rotate(2.5deg) scale(1.05)',
            width: 'min(90vw, 360px)',
          }}
        >
          {(() => {
            const task = carriedTask || draggedTask!;
            const catInfo = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.other;
            return (
              <div className="flex flex-col items-center">
                <div className="w-full p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-[#7C3AED] shadow-[0_22px_55px_rgba(109,40,217,0.45)] ring-4 ring-purple-400/30 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#6D28D9] text-white shrink-0 animate-bounce shadow-md">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          style={{ backgroundColor: catInfo.bg, color: catInfo.text, borderColor: catInfo.border }}
                          className="px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0"
                        >
                          {catInfo.label}
                        </span>
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <Move className="w-2.5 h-2.5" />
                          <span>نقل المهمة</span>
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate mt-1">
                        {task.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {formatTime(task.startTime)} - {formatTime(task.endTime)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-900/95 text-white text-[11px] font-bold shadow-xl border border-white/20 backdrop-blur-sm">
                    {dragOverTarget ? 'أفلت الآن لنقل المهمة' : 'حرّك نحو أي وقت أو يوم'}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* FLOATING CARRY STATUS BAR (Accessible & clear guide when holding a card) */}
      {carriedTask && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92vw] p-3.5 rounded-2xl bg-slate-900/95 text-white shadow-2xl border-2 border-purple-500 backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shrink-0 text-white shadow-md">
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="truncate flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-purple-300">المهمة المحددة:</span>
                <span className="text-xs font-black truncate">{carriedTask.title}</span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                انقر على أي خانة في الجدول لنقل المهمة إليها
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCarriedTask(null);
              setDraggedTask(null);
              setPointerPos(null);
              setDragOverTarget(null);
              setToastMessage('تم إلغاء نقل المهمة');
            }}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold shrink-0 transition flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>إلغاء</span>
          </button>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-purple-900/95 text-white text-xs font-black shadow-2xl border border-purple-400 backdrop-blur-md animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
