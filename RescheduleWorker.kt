package com.grip.app.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.grip.app.data.local.AppDatabase
import com.grip.app.data.local.entity.TaskEntity
import com.grip.app.data.local.entity.TaskType
import com.grip.app.util.GripAlarmScheduler

/**
 * RescheduleWorker (WorkManager)
 * Auto-reschedules flexible tasks when missed without EVER overlapping fixed tasks.
 */
class RescheduleWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val db = AppDatabase.getInstance(applicationContext)
        val now = System.currentTimeMillis()

        val missedFlexTasks = db.taskDao().getMissedFlexibleTasks(now)
        val allUpcomingTasks = db.taskDao().getTasksForDay(now, now + 7 * 86400000L)

        for (flexTask in missedFlexTasks) {
            val newSlot = findNextAvailableSlot(flexTask, allUpcomingTasks, now)
            if (newSlot != null) {
                val updatedTask = flexTask.copy(
                    startTimeEpochMs = newSlot.first,
                    endTimeEpochMs = newSlot.second,
                    notes = "${flexTask.notes} • أُعيدت جدولتها تلقائياً"
                )
                db.taskDao().updateTask(updatedTask)
                GripAlarmScheduler.scheduleExactTaskAlarm(applicationContext, updatedTask)
            }
        }

        return Result.success()
    }

    private fun findNextAvailableSlot(
        task: TaskEntity,
        existing: List<TaskEntity>,
        fromTimeMs: Long
    ): Pair<Long, Long>? {
        val durationMs = task.endTimeEpochMs - task.startTimeEpochMs
        var candidateStart = fromTimeMs + 15 * 60 * 1000L // 15 mins buffer

        val fixedIntervals = existing
            .filter { it.type == TaskType.FIXED }
            .map { it.startTimeEpochMs to it.endTimeEpochMs }
            .sortedBy { it.first }

        for (i in 0..48) { // Search next 24-48 hours
            val candidateEnd = candidateStart + durationMs
            val collidesWithFixed = fixedIntervals.any { (fStart, fEnd) ->
                (candidateStart in fStart until fEnd) ||
                (candidateEnd in (fStart + 1)..fEnd) ||
                (candidateStart <= fStart && candidateEnd >= fEnd)
            }

            if (!collidesWithFixed) {
                return candidateStart to candidateEnd
            }
            candidateStart += 30 * 60 * 1000L
        }
        return null
    }
}
