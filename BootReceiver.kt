package com.grip.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.grip.app.data.local.AppDatabase
import com.grip.app.data.local.entity.TaskStatus
import com.grip.app.util.GripAlarmScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Alarms are cleared by Android on reboot, so we re-create every upcoming one from Room.
 * goAsync() keeps the process alive until the database work is finished.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED &&
            intent.action != "android.intent.action.QUICKBOOT_POWERON"
        ) return

        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val now = System.currentTimeMillis()
                val tasks = AppDatabase.getInstance(context).taskDao()
                    .getTasksForDay(now, now + 7 * 86_400_000L)
                tasks.filter { it.startTimeEpochMs > now && it.status == TaskStatus.PENDING }
                    .forEach { GripAlarmScheduler.scheduleExactTaskAlarm(context, it) }
            } finally {
                pending.finish()
            }
        }
    }
}
