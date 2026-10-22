package com.grip.app.util

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.grip.app.data.local.entity.TaskEntity
import com.grip.app.receiver.AlarmReceiver
import com.grip.app.service.EnforcementOverlayService

/**
 * Single place that talks to AlarmManager.
 * Uses exact alarms only when the user has granted the permission (Android 12+),
 * otherwise falls back to an inexact-but-idle-safe alarm so the app never crashes.
 */
object GripAlarmScheduler {

    const val ACTION_TRIGGER_TASK = "com.grip.app.ACTION_TRIGGER_TASK"
    const val ACTION_FREE_WINDOW_EXPIRED = "com.grip.app.ACTION_FREE_WINDOW_EXPIRED"

    fun scheduleExactTaskAlarm(context: Context, task: TaskEntity) {
        schedule(context, task.id, ACTION_TRIGGER_TASK, task.startTimeEpochMs)
    }

    fun scheduleFreeWindowReturn(context: Context, taskId: String, minutes: Int) {
        val triggerAt = System.currentTimeMillis() + minutes.coerceAtLeast(1) * 60_000L
        schedule(context, taskId, ACTION_FREE_WINDOW_EXPIRED, triggerAt)
    }

    fun cancel(context: Context, taskId: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        listOf(ACTION_TRIGGER_TASK, ACTION_FREE_WINDOW_EXPIRED).forEach { action ->
            alarmManager.cancel(pendingIntent(context, taskId, action))
        }
    }

    fun canScheduleExact(context: Context): Boolean {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()
    }

    private fun schedule(context: Context, taskId: String, action: String, triggerAtMs: Long) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pi = pendingIntent(context, taskId, action)
        try {
            if (canScheduleExact(context)) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pi)
            } else {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pi)
            }
        } catch (_: SecurityException) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pi)
        }
    }

    private fun pendingIntent(context: Context, taskId: String, action: String): PendingIntent {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            this.action = action
            putExtra(EnforcementOverlayService.EXTRA_TASK_ID, taskId)
        }
        // Distinct request code per (task, action) so alarms never overwrite each other.
        val requestCode = (taskId + action).hashCode()
        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
