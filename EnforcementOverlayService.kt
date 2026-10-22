package com.grip.app.service

import android.annotation.SuppressLint
import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.*
import android.content.pm.ServiceInfo
import android.media.AudioManager
import android.provider.Settings
import android.view.*
import android.widget.FrameLayout
import androidx.compose.ui.platform.ComposeView
import androidx.core.app.NotificationCompat
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.grip.app.R
import com.grip.app.data.local.AppDatabase
import com.grip.app.data.local.entity.TaskEntity
import com.grip.app.ui.components.EnforcementOverlayCompose
import com.grip.app.data.local.entity.TaskStatus
import com.grip.app.util.GripAlarmScheduler
import com.grip.app.util.OverlayLifecycleOwner
import kotlinx.coroutines.*

/**
 * EnforcementOverlayService
 * The heart of Grip:
 * - Runs as a Foreground Service with persistent notification
 * - Mounts a SYSTEM_ALERT_WINDOW full screen overlay
 * - Escalating continuous press-and-hold (10s -> 20s -> 30s cap)
 * - Free window grant (default 4 min) then reappears automatically
 * - Suppressed during phone calls (AudioManager mode, no extra permission needed)
 * - Hidden 60-second emergency exit
 */
class EnforcementOverlayService : Service() {

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private val serviceScope = CoroutineScope(Dispatchers.Main + Job())
    private var currentTask: TaskEntity? = null
    private var isCallActive = false
    private var lifecycleOwner: OverlayLifecycleOwner? = null
    private var callWatcher: Job? = null

    companion object {
        const val CHANNEL_ID = "grip_enforcement_channel"
        const val NOTIFICATION_ID = 1001
        const val EXTRA_TASK_ID = "extra_task_id"

        fun startEnforcement(context: Context, taskId: String) {
            val intent = Intent(context, EnforcementOverlayService::class.java).apply {
                putExtra(EXTRA_TASK_ID, taskId)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopEnforcement(context: Context) {
            context.stopService(Intent(context, EnforcementOverlayService::class.java))
        }
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val taskId = intent?.getStringExtra(EXTRA_TASK_ID)

        // Android 14+ requires the foreground service type to be passed explicitly.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                buildForegroundNotification(),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIFICATION_ID, buildForegroundNotification())
        }

        if (taskId == null) {
            stopSelf()
            return START_NOT_STICKY
        }

        serviceScope.launch {
            val db = AppDatabase.getInstance(applicationContext)
            val task = db.taskDao().getTaskById(taskId)
            val stillActive = task != null &&
                (task.status == TaskStatus.PENDING || task.status == TaskStatus.IN_PROGRESS)
            if (!stillActive) {
                stopSelf()
                return@launch
            }
            currentTask = task
            if (!Settings.canDrawOverlays(this@EnforcementOverlayService)) {
                // Permission was revoked: never crash, just stop quietly.
                stopSelf()
                return@launch
            }
            showEnforcementOverlay(task!!)
        }
        // NOT_STICKY: if the system kills us we must not restart with a null intent
        // and leave a notification with no overlay behind.
        return START_NOT_STICKY
    }

    @SuppressLint("InflateParams")
    private fun showEnforcementOverlay(task: TaskEntity) {
        if (overlayView != null) return

        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_FULLSCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.CENTER
        }

        val owner = OverlayLifecycleOwner().also {
            it.onCreate()
            it.onResume()
        }
        lifecycleOwner = owner

        val frameLayout = FrameLayout(this)
        val composeView = ComposeView(this).apply {
            setViewTreeLifecycleOwner(owner)
            setViewTreeSavedStateRegistryOwner(owner)
            setContent {
                EnforcementOverlayCompose(
                    task = task,
                    onPostponeSuccess = { freeWindowMinutes ->
                        handlePostponeSuccess(task, freeWindowMinutes)
                    },
                    onDoneEarly = {
                        handleDoneEarly(task)
                    },
                    onEmergencyExit = {
                        handleEmergencyExit(task)
                    }
                )
            }
        }
        frameLayout.addView(composeView)
        overlayView = frameLayout

        try {
            windowManager?.addView(overlayView, layoutParams)
            startCallWatcher()
        } catch (e: Exception) {
            overlayView = null
            stopSelf()
        }
    }

    private fun handlePostponeSuccess(task: TaskEntity, freeWindowMinutes: Int) {
        serviceScope.launch {
            val db = AppDatabase.getInstance(applicationContext)
            db.taskDao().incrementPostponeCount(task.id)

            // Hide overlay during free window
            removeOverlay()

            // Schedule return of overlay after free window (e.g. 4 minutes)
            GripAlarmScheduler.scheduleFreeWindowReturn(
                applicationContext,
                task.id,
                freeWindowMinutes
            )
            stopSelf()
        }
    }

    private fun handleDoneEarly(task: TaskEntity) {
        serviceScope.launch {
            val db = AppDatabase.getInstance(applicationContext)
            db.taskDao().markTaskComplete(
                task.id,
                com.grip.app.data.local.entity.TaskStatus.DONE_EARLY,
                System.currentTimeMillis()
            )
            removeOverlay()
            stopSelf()
        }
    }

    private fun handleEmergencyExit(task: TaskEntity) {
        removeOverlay()
        stopSelf()
    }

    private fun removeOverlay() {
        overlayView?.let {
            try {
                windowManager?.removeView(it)
            } catch (e: Exception) {
                e.printStackTrace()
            }
            overlayView = null
        }
        callWatcher?.cancel()
        lifecycleOwner?.onDestroy()
        lifecycleOwner = null
    }

    /**
     * Hide the overlay while the user is on a call or the phone is ringing.
     * AudioManager.mode needs no runtime permission (unlike READ_PHONE_STATE),
     * which keeps the Play Store permission review much simpler.
     */
    private fun startCallWatcher() {
        callWatcher?.cancel()
        val audio = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        callWatcher = serviceScope.launch {
            while (isActive) {
                val inCall = audio.mode == AudioManager.MODE_IN_CALL ||
                    audio.mode == AudioManager.MODE_RINGTONE ||
                    audio.mode == AudioManager.MODE_IN_COMMUNICATION
                if (inCall != isCallActive) {
                    isCallActive = inCall
                    overlayView?.visibility = if (inCall) View.GONE else View.VISIBLE
                }
                delay(1500)
            }
        }
    }

    private fun buildForegroundNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Grip • قبضة التركيز نشطة")
            .setContentText("نظام الحماية والإنفاذ يعمل لضمان الالتزام بمهمتك.")
            .setSmallIcon(R.drawable.ic_grip_chain)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Grip Enforcement Channel",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "قناة إشعارات الحماية ضد التسويف"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        removeOverlay()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
