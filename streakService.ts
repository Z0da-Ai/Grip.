import { DailyTrackerRecord, GripTask } from '../types/grip';

export interface DayStreakStatus {
  date: string; // YYYY-MM-DD
  dayName: string; // الأحد، الإثنين، إلخ
  shortDayName: string; // ح، ن، ث، ر، خ، ج، س
  isCompleted: boolean;
  isToday: boolean;
  completedCount: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  isCompletedToday: boolean;
  todayCompletedCount: number;
  totalActiveDays: number;
  streakStatus: 'burning' | 'active_pending_today' | 'at_risk' | 'frozen';
  weeklyDays: DayStreakStatus[];
  milestone: {
    level: number;
    title: string;
    nextMilestoneDays: number;
    progressPercent: number;
    badgeEmoji: string;
  };
}

const MILESTONES = [
  { days: 3, level: 1, title: 'شعلة البداية', emoji: '🌱' },
  { days: 7, level: 2, title: 'قبضة الأسبوع الذهبي', emoji: '⚡' },
  { days: 14, level: 3, title: 'محارب التسويف', emoji: '🛡️' },
  { days: 21, level: 4, title: 'بطل العادات الراسخة', emoji: '💎' },
  { days: 30, level: 5, title: 'قبضة حديدية لا تنكسر', emoji: '👑' },
  { days: 60, level: 6, title: 'أسطورة التركيز والإنتاجية', emoji: '🔥' },
  { days: 100, level: 7, title: 'نادي المائة يوم', emoji: '🏆' },
];

function getArabicDayNames(date: Date): { full: string; short: string } {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const shorts = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const dayIndex = date.getDay();
  return { full: days[dayIndex], short: shorts[dayIndex] };
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateStreakStats(
  trackerHistory: DailyTrackerRecord[],
  tasks: GripTask[]
): StreakStats {
  const now = new Date();
  const todayStr = formatDateKey(now);

  // Map of date string -> completed count from tracker history
  const completionMap = new Map<string, number>();

  trackerHistory.forEach((rec) => {
    completionMap.set(rec.date, (completionMap.get(rec.date) || 0) + (rec.completedTasks || 0));
  });

  // Calculate today's completed tasks directly from live tasks
  const todayCompletedCount = tasks.filter((t) => {
    if (t.status !== 'done' && t.status !== 'done_early') return false;
    if (t.completedAt) {
      const compDate = formatDateKey(new Date(t.completedAt));
      return compDate === todayStr;
    }
    const taskStart = formatDateKey(new Date(t.startTime));
    return taskStart === todayStr;
  }).length;

  // If today has completed tasks in live tasks, ensure completionMap reflects it
  const currentTodayInMap = completionMap.get(todayStr) || 0;
  const effectiveTodayCompleted = Math.max(currentTodayInMap, todayCompletedCount);
  completionMap.set(todayStr, effectiveTodayCompleted);

  const isCompletedToday = effectiveTodayCompleted > 0;

  // Calculate current streak backwards from today (or yesterday if today isn't done yet)
  let currentStreak = 0;

  if (isCompletedToday) {
    currentStreak = 1;
    let checkDate = new Date(now);
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const key = formatDateKey(checkDate);
      const count = completionMap.get(key) || 0;
      if (count > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    // Today not done yet: check if yesterday was done to keep the streak alive
    let checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayKey = formatDateKey(checkDate);
    const yesterdayCount = completionMap.get(yesterdayKey) || 0;

    if (yesterdayCount > 0) {
      currentStreak = 1;
      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const key = formatDateKey(checkDate);
        const count = completionMap.get(key) || 0;
        if (count > 0) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }
  }

  // Calculate longest streak from all recorded dates
  const sortedDates = Array.from(completionMap.keys()).sort();
  let longestStreak = currentStreak;
  let runningStreak = 0;
  let prevTimestamp: number | null = null;

  for (const dStr of sortedDates) {
    const count = completionMap.get(dStr) || 0;
    if (count > 0) {
      const [year, month, day] = dStr.split('-').map(Number);
      const curTimestamp = new Date(year, month - 1, day).getTime();

      if (prevTimestamp === null) {
        runningStreak = 1;
      } else {
        const diffDays = Math.round((curTimestamp - prevTimestamp) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          runningStreak++;
        } else {
          runningStreak = 1;
        }
      }
      prevTimestamp = curTimestamp;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
      prevTimestamp = null;
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Total active days
  let totalActiveDays = 0;
  completionMap.forEach((count) => {
    if (count > 0) totalActiveDays++;
  });

  // Generate last 7 days status (Weekly chain)
  const weeklyDays: DayStreakStatus[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = formatDateKey(d);
    const dayCompleted = (completionMap.get(key) || 0) > 0;
    const names = getArabicDayNames(d);
    weeklyDays.push({
      date: key,
      dayName: names.full,
      shortDayName: names.short,
      isCompleted: dayCompleted,
      isToday: i === 0,
      completedCount: completionMap.get(key) || 0,
    });
  }

  // Milestone calculation
  let currentMilestone = MILESTONES[0];
  let nextMilestoneDays = MILESTONES[0].days;

  for (let i = 0; i < MILESTONES.length; i++) {
    if (currentStreak >= MILESTONES[i].days) {
      currentMilestone = MILESTONES[i];
      nextMilestoneDays = MILESTONES[i + 1]?.days || MILESTONES[i].days + 30;
    } else {
      nextMilestoneDays = MILESTONES[i].days;
      break;
    }
  }

  const prevMilestoneDays = currentStreak >= currentMilestone.days ? currentMilestone.days : 0;
  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      Math.round(((currentStreak - prevMilestoneDays) / (nextMilestoneDays - prevMilestoneDays || 1)) * 100)
    )
  );

  let streakStatus: StreakStats['streakStatus'] = 'active_pending_today';
  if (isCompletedToday) {
    streakStatus = 'burning';
  } else if (currentStreak > 0) {
    streakStatus = 'at_risk';
  } else {
    streakStatus = 'active_pending_today';
  }

  return {
    currentStreak,
    longestStreak,
    isCompletedToday,
    todayCompletedCount: effectiveTodayCompleted,
    totalActiveDays,
    streakStatus,
    weeklyDays,
    milestone: {
      level: currentMilestone.level,
      title: currentMilestone.title,
      nextMilestoneDays,
      progressPercent,
      badgeEmoji: currentMilestone.emoji,
    },
  };
}
