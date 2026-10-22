import { GripTask } from '../types/grip';

/**
 * Reschedule engine:
 * Finds any flexible tasks that are missed or need rescheduling,
 * and finds available time slots in the calendar, strictly avoiding any FIXED tasks or scheduled tasks.
 */
export function autoRescheduleFlexibleTask(
  taskToReschedule: GripTask,
  allTasks: GripTask[]
): GripTask {
  const durationMs = new Date(taskToReschedule.endTime).getTime() - new Date(taskToReschedule.startTime).getTime();
  const safeDurationMs = Math.max(durationMs, 30 * 60 * 1000); // at least 30 mins

  // We search starting from now (rounded up to next 15 minutes)
  const now = new Date();
  const remainder = 15 - (now.getMinutes() % 15);
  now.setMinutes(now.getMinutes() + remainder, 0, 0);

  let searchCursor = now.getTime();
  const maxSearchLimit = searchCursor + 7 * 24 * 60 * 60 * 1000; // within 7 days

  // Get all fixed tasks and already active tasks
  const occupiedIntervals = allTasks
    .filter((t) => t.id !== taskToReschedule.id && t.status !== 'missed')
    .map((t) => ({
      start: new Date(t.startTime).getTime(),
      end: new Date(t.endTime).getTime(),
      isFixed: t.type === 'FIXED',
    }))
    .sort((a, b) => a.start - b.start);

  while (searchCursor < maxSearchLimit) {
    const candidateStart = searchCursor;
    const candidateEnd = candidateStart + safeDurationMs;

    // Check night sleep protection (e.g., avoid 11:30 PM to 6:30 AM unless specified)
    const startDate = new Date(candidateStart);
    const hours = startDate.getHours();
    if (hours >= 23 || hours < 7) {
      // jump to next day 8 AM
      startDate.setHours(8, 0, 0, 0);
      if (hours >= 23) {
        startDate.setDate(startDate.getDate() + 1);
      }
      searchCursor = startDate.getTime();
      continue;
    }

    // Check conflict with any existing task (especially FIXED tasks)
    const hasConflict = occupiedIntervals.some((interval) => {
      return (
        (candidateStart >= interval.start && candidateStart < interval.end) ||
        (candidateEnd > interval.start && candidateEnd <= interval.end) ||
        (candidateStart <= interval.start && candidateEnd >= interval.end)
      );
    });

    if (!hasConflict) {
      // Found clear slot!
      return {
        ...taskToReschedule,
        startTime: new Date(candidateStart).toISOString(),
        endTime: new Date(candidateEnd).toISOString(),
        status: 'pending',
        notes: (taskToReschedule.notes ? taskToReschedule.notes + ' • ' : '') + 'أعيدت جدولتها آلياً لمنع التضارب',
      };
    }

    // Move forward by 30 mins
    searchCursor += 30 * 60 * 1000;
  }

  return taskToReschedule;
}
