package com.grip.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.grip.app.service.EnforcementOverlayService

/**
 * Fires at the exact task start time (or when a "free window" ends)
 * and brings the enforcement overlay back.
 */
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val taskId = intent.getStringExtra(EnforcementOverlayService.EXTRA_TASK_ID) ?: return
        EnforcementOverlayService.startEnforcement(context, taskId)
    }
}
