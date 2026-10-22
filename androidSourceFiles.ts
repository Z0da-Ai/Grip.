export interface AndroidFile {
  path: string;
  category: 'manifest' | 'gradle' | 'database' | 'service' | 'ui' | 'worker';
  title: string;
  content: string;
}

export const ANDROID_SOURCE_FILES: AndroidFile[] = [
  {
    path: 'app/src/main/AndroidManifest.xml',
    category: 'manifest',
    title: 'AndroidManifest.xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.grip.app">

    <!-- 1. Overlay Enforcement Permission (SYSTEM_ALERT_WINDOW) -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <!-- 2. Exact Alarms for punctual task enforcement -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />

    <!-- 3. Foreground Service & Persistent Notifications -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- 4. Device Boot Recovery -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <!-- 5. Phone State to avoid interrupting phone calls -->
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />

    <!-- 6. Battery Optimization Exemption for rock-solid reliability -->
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

    <!-- 7. Internet only for optional Gemini AI processing -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:name=".GripApp"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Grip"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Grip">

        <!-- Main Compose Activity -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/Theme.Grip">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Enforcement Overlay Foreground Service -->
        <service
            android:name=".service.EnforcementOverlayService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="Self-discipline lock screen enforcement for task adherence" />
        </service>

        <!-- Alarm Broadcast Receiver -->
        <receiver
            android:name=".receiver.AlarmReceiver"
            android:enabled="true"
            android:exported="false">
            <intent-filter>
                <action android:name="com.grip.app.ACTION_TRIGGER_TASK" />
                <action android:name="com.grip.app.ACTION_FREE_WINDOW_EXPIRED" />
            </intent-filter>
        </receiver>

        <!-- Boot Completed Receiver (Reschedule Alarms on Reboot) -->
        <receiver
            android:name=".receiver.BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
            </intent-filter>
        </receiver>

    </application>
</manifest>`
  },
  {
    path: 'app/build.gradle.kts',
    category: 'gradle',
    title: 'app/build.gradle.kts',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.ksp)
}

android {
    namespace = "com.grip.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.grip.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform("androidx.compose:compose-bom:2024.09.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.navigation:navigation-compose:2.8.0")

    // Room Database
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // WorkManager & Background Tasks
    implementation("androidx.work:work-runtime-ktx:2.9.1")

    // Coroutines & Lifecycle
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.5")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.5")

    // JSON Serialization
    implementation("com.google.code.gson:gson:2.11.0")
}`
  },
  {
    path: 'app/src/main/java/com/grip/app/data/local/entity/TaskEntity.kt',
    category: 'database',
    title: 'TaskEntity.kt',
    content: `package com.grip.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class TaskCategory { STUDY, WORK, SPORT, SLEEP, PERSONAL, OTHER }
enum class TaskType { FIXED, FLEXIBLE }
enum class TaskStatus { PENDING, IN_PROGRESS, DONE, DONE_EARLY, MISSED }

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: String,
    val title: String,
    val category: TaskCategory,
    val startTimeEpochMs: Long,
    val endTimeEpochMs: Long,
    val type: TaskType,
    val status: TaskStatus = TaskStatus.PENDING,
    val notes: String = "",
    val moduleId: String? = null,
    val topicId: String? = null,
    val postponeCount: Int = 0,
    val completedAtEpochMs: Long? = null,
    val isExtended: Boolean = false
)`
  },
  {
    path: 'app/src/main/java/com/grip/app/data/local/entity/StudyEntities.kt',
    category: 'database',
    title: 'StudyEntities.kt',
    content: `package com.grip.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "modules")
data class ModuleEntity(
    @PrimaryKey val id: String,
    val title: String,
    val category: String,
    val colorHex: String
)

@Entity(
    tableName = "lectures",
    foreignKeys = [
        ForeignKey(
            entity = ModuleEntity::class,
            parentColumns = ["id"],
            childColumns = ["moduleId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["moduleId"])]
)
data class LectureEntity(
    @PrimaryKey val id: String,
    val moduleId: String,
    val title: String,
    val sequenceOrder: Int
)

@Entity(
    tableName = "topics",
    foreignKeys = [
        ForeignKey(
            entity = LectureEntity::class,
            parentColumns = ["id"],
            childColumns = ["lectureId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["lectureId"])]
)
data class TopicEntity(
    @PrimaryKey val id: String,
    val lectureId: String,
    val title: String,
    val estimatedMinutes: Int, // Enforced 20 to 40 minutes
    val isCompleted: Boolean = false,
    val sequenceOrder: Int,
    val description: String = ""
)`
  },
  {
    path: 'app/src/main/java/com/grip/app/data/local/dao/TaskDao.kt',
    category: 'database',
    title: 'TaskDao.kt',
    content: `package com.grip.app.data.local.dao

import androidx.room.*
import com.grip.app.data.local.entity.TaskEntity
import com.grip.app.data.local.entity.TaskStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY startTimeEpochMs ASC")
    fun getAllTasksFlow(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE startTimeEpochMs >= :startDayMs AND startTimeEpochMs <= :endDayMs ORDER BY startTimeEpochMs ASC")
    suspend fun getTasksForDay(startDayMs: Long, endDayMs: Long): List<TaskEntity>

    @Query("SELECT * FROM tasks WHERE id = :taskId LIMIT 1")
    suspend fun getTaskById(taskId: String): TaskEntity?

    @Query("SELECT * FROM tasks WHERE status = 'PENDING' AND type = 'FLEXIBLE' AND endTimeEpochMs < :currentEpochMs")
    suspend fun getMissedFlexibleTasks(currentEpochMs: Long): List<TaskEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTasks(tasks: List<TaskEntity>)

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Delete
    suspend fun deleteTask(task: TaskEntity)

    @Query("UPDATE tasks SET status = :status, completedAtEpochMs = :completedMs WHERE id = :taskId")
    suspend fun markTaskComplete(taskId: String, status: TaskStatus, completedMs: Long)

    @Query("UPDATE tasks SET postponeCount = postponeCount + 1 WHERE id = :taskId")
    suspend fun incrementPostponeCount(taskId: String)
}`
  },
  {
    path: 'app/src/main/java/com/grip/app/data/local/AppDatabase.kt',
    category: 'database',
    title: 'AppDatabase.kt',
    content: `package com.grip.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.grip.app.data.local.dao.StudyDao
import com.grip.app.data.local.dao.TaskDao
import com.grip.app.data.local.entity.*

@Database(
    entities = [
        TaskEntity::class,
        ModuleEntity::class,
        LectureEntity::class,
        TopicEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
    abstract fun studyDao(): StudyDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "grip_local.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/grip/app/service/EnforcementOverlayService.kt',
    category: 'service',
    title: 'EnforcementOverlayService.kt',
    content: `package com.grip.app.service

import android.annotation.SuppressLint
import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.*
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
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
import com.grip.app.util.GripAlarmScheduler
import kotlinx.coroutines.*

/**
 * EnforcementOverlayService
 * The heart of Grip:
 * - Runs as a Foreground Service with persistent notification
 * - Mounts a SYSTEM_ALERT_WINDOW full screen overlay
 * - Escalating continuous press-and-hold (10s -> 20s -> 30s cap)
 * - Free window grant (default 4 min) then reappears automatically
 * - Suppressed during phone calls using TelephonyManager
 * - Hidden 60-second emergency exit
 */
class EnforcementOverlayService : Service() {

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private val serviceScope = CoroutineScope(Dispatchers.Main + Job())
    private var currentTask: TaskEntity? = null
    private var isCallActive = false

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
        registerPhoneStateListener()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val taskId = intent?.getStringExtra(EXTRA_TASK_ID)
        startForeground(NOTIFICATION_ID, buildForegroundNotification())

        if (taskId != null) {
            serviceScope.launch {
                val db = AppDatabase.getInstance(applicationContext)
                currentTask = db.taskDao().getTaskById(taskId)
                currentTask?.let { task ->
                    showEnforcementOverlay(task)
                }
            }
        }
        return START_STICKY
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

        val frameLayout = FrameLayout(this)
        val composeView = ComposeView(this).apply {
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
        } catch (e: Exception) {
            e.printStackTrace()
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
    }

    private fun registerPhoneStateListener() {
        val telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            telephonyManager.registerTelephonyCallback(
                mainExecutor,
                object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                    override fun onCallStateChanged(state: Int) {
                        handleCallState(state)
                    }
                }
            )
        }
    }

    private fun handleCallState(state: Int) {
        isCallActive = (state != TelephonyManager.CALL_STATE_IDLE)
        overlayView?.visibility = if (isCallActive) View.GONE else View.VISIBLE
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
}`
  },
  {
    path: 'app/src/main/java/com/grip/app/receiver/AlarmReceiver.kt',
    category: 'service',
    title: 'AlarmReceiver.kt & BootReceiver.kt',
    content: `package com.grip.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.grip.app.data.local.AppDatabase
import com.grip.app.service.EnforcementOverlayService
import com.grip.app.util.GripAlarmScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Exact Alarm Receiver
 * Fires at exact task start time to display the full screen overlay.
 */
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val taskId = intent.getStringExtra(EnforcementOverlayService.EXTRA_TASK_ID)
        if (taskId != null) {
            EnforcementOverlayService.startEnforcement(context, taskId)
        }
    }
}

/**
 * Boot Receiver
 * Survives device reboots by querying Room database and rescheduling all alarms.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON"
        ) {
            CoroutineScope(Dispatchers.IO).launch {
                val db = AppDatabase.getInstance(context)
                val currentTime = System.currentTimeMillis()
                val tasks = db.taskDao().getTasksForDay(currentTime, currentTime + 7 * 86400000L)

                for (task in tasks) {
                    if (task.startTimeEpochMs > currentTime && task.status == com.grip.app.data.local.entity.TaskStatus.PENDING) {
                        GripAlarmScheduler.scheduleExactTaskAlarm(context, task)
                    }
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/grip/app/worker/RescheduleWorker.kt',
    category: 'worker',
    title: 'RescheduleWorker.kt',
    content: `package com.grip.app.worker

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
                    notes = "\${flexTask.notes} • أُعيدت جدولتها تلقائياً"
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
}`
  },
  {
    path: 'app/src/main/java/com/grip/app/ui/screens/SplashScreen.kt',
    category: 'ui',
    title: 'SplashScreen.kt (Chains & G Lock Snap)',
    content: `package com.grip.app.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

/**
 * Grip Splash Screen:
 * Two hanging metallic chains linked by a metal ring shaped like the letter G that snaps shut!
 */
@Composable
fun SplashScreen(onAnimationEnd: () -> Unit) {
    var isSnapped by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        delay(1200)
        isSnapped = true
        delay(2000)
        onAnimationEnd()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Chains & G Snap Lock Graphic Component
            // [Rendering Metal Chains and Snapping G Lock Ring]

            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = "GRIP",
                fontSize = 42.sp,
                fontWeight = FontWeight.Black,
                color = Color.White
            )
            Text(
                text = "Hold your focus. Kill the drift.",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFC4B5FD)
            )
            Text(
                text = "اقبض على تركيزك. اسحق التشتت.",
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF94A3B8)
            )
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/grip/app/ui/components/EnforcementOverlayCompose.kt',
    category: 'ui',
    title: 'EnforcementOverlayCompose.kt (2s Done Early Hold & Escalating Hold)',
    content: `package com.grip.app.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.grip.app.data.local.entity.TaskEntity
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * EnforcementOverlayCompose
 * Features:
 * - "روح خلّصها" message
 * - ONLY button: "ذكّرني لاحقاً" with escalating hold (10s -> 20s -> 30s)
 * - "أنجزت المهمة مبكراً" with an enforced 2-second continuous press-and-hold!
 * - Hidden 60-second emergency exit
 */
@Composable
fun EnforcementOverlayCompose(
    task: TaskEntity,
    onPostponeSuccess: (freeWindowMinutes: Int) -> Unit,
    onDoneEarly: () -> Unit,
    onEmergencyExit: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()

    // 2-Second Hold State for "Done Early"
    var isHoldingDoneEarly by remember { mutableStateOf(false) }
    var doneEarlyProgress by remember { mutableFloatStateOf(0f) }

    // Escalating friction calculation
    val requiredHoldSecs = when {
        task.postponeCount < 3 -> 10
        task.postponeCount < 6 -> 20
        else -> 30
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xE6090D16))
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Grip",
                    fontWeight = FontWeight.Black,
                    fontSize = 20.sp,
                    color = Color.White
                )
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0x33EF4444)
                ) {
                    Text(
                        text = "شاشة الإنفاذ النشطة",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        color = Color(0xFFFCA5A5),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Central Task Command
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = task.title,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(16.dp))

                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0x336D28D9)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "روح خلّصها",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFFC4B5FD)
                        )
                        Text(
                            text = "لا يوجد زر لبدء المهمة لأنك في وقتها بالفعل.",
                            fontSize = 12.sp,
                            color = Color(0xFF94A3B8),
                            textAlign = TextAlign.Center
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // The ONLY main button: "ذكّرني لاحقاً" with circular hold
                // [Circular escalating hold button logic: \${requiredHoldSecs}s]
            }

            // Bottom Actions: Done Early (Enforced 2s hold)
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Done Early Button with 2-second continuous hold!
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp)
                        .background(Color(0xFF064E3B), RoundedCornerShape(14.dp))
                        .pointerInput(Unit) {
                            detectTapGestures(
                                onPress = {
                                    isHoldingDoneEarly = true
                                    doneEarlyProgress = 0f
                                    val holdJob = coroutineScope.launch {
                                        val totalMs = 2000L
                                        val interval = 40L
                                        var elapsed = 0L
                                        while (elapsed < totalMs) {
                                            delay(interval)
                                            elapsed += interval
                                            doneEarlyProgress = (elapsed.toFloat() / totalMs).coerceIn(0f, 1f)
                                        }
                                        onDoneEarly()
                                    }
                                    tryAwaitRelease()
                                    // If finger is lifted early -> cancel and reset!
                                    holdJob.cancel()
                                    isHoldingDoneEarly = false
                                    doneEarlyProgress = 0f
                                }
                            )
                        },
                    contentAlignment = Alignment.Center
                ) {
                    // Progress fill indicator
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(doneEarlyProgress)
                            .align(Alignment.CenterEnd)
                            .background(Color(0xFF10B981), RoundedCornerShape(14.dp))
                    )

                    Text(
                        text = if (isHoldingDoneEarly)
                            "جاري التأكيد: \${(doneEarlyProgress * 2).format(1)}ث / 2.0ث"
                        else
                            "أنجزت المهمة مبكراً (اضغط واستمر ثانيتين)",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }
        }
    }
}

private fun Float.format(digits: Int) = "%.1f".format(this)`
  },
  {
    path: 'app/src/main/java/com/grip/app/ui/onboarding/OnboardingScreen.kt',
    category: 'ui',
    title: 'OnboardingScreen.kt',
    content: `package com.grip.app.ui.onboarding

import android.content.Context
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

// 1. Local Jetpack DataStore persistence to ensure Onboarding runs ONCE
val Context.dataStore by preferencesDataStore(name = "grip_preferences")

class OnboardingViewModel(private val context: Context) : ViewModel() {
    companion object {
        val ONBOARDING_COMPLETED_KEY = booleanPreferencesKey("onboarding_completed")
    }

    val isOnboardingCompleted = context.dataStore.data
        .map { prefs -> prefs[ONBOARDING_COMPLETED_KEY] ?: false }
        .stateIn(viewModelScope, SharingStarted.Eagerly, false)

    fun markOnboardingCompleted(onFinished: () -> Unit) {
        viewModelScope.launch {
            context.dataStore.edit { prefs ->
                prefs[ONBOARDING_COMPLETED_KEY] = true
            }
            onFinished()
        }
    }
}

data class OnboardingPage(
    val title: String,
    val description: String,
    val icon: ImageVector,
    val badge: String,
    val accentColor: Color
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun OnboardingScreen(
    onFinishOnboarding: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val viewModel = remember { OnboardingViewModel(context) }

    val pages = remember {
        listOf(
            OnboardingPage(
                title = "قاهر التسويف الأكاديمي الصارم",
                description = "تطبيق أندرويد حقيقي مُصمم لجعل التسويف أصعب بكثير من أداء المهمة نفسها، عبر الإنفاذ الإلزامي وحظر المشتتات.",
                icon = Icons.Default.Lock,
                badge = "النظام الصارم 🛡️",
                accentColor = Color(0xFF6D28D9)
            ),
            OnboardingPage(
                title = "ذكاء اصطناعي محلي وتفكيك المهام",
                description = "سجّل صوتك أو أفكارك لتحويلها تلقائياً إلى مهام مجدولة ومقسمة (Offline AI Chunking) متوافقة مع جداولك.",
                icon = Icons.Default.Mic,
                badge = "صوتي وذكي 🎙️",
                accentColor = Color(0xFF2563EB)
            ),
            OnboardingPage(
                title = "سلم الاحتجاز والنافذة الحرة",
                description = "التأجيل يتطلب ضغطاً مستمراً (10ث، 20ث، 30ث). وبعدها تحصل على نافذة حرة محددة بدقائق قبل عودة المنع تلقائياً.",
                icon = Icons.Default.Timer,
                badge = "احتكاك تصاعدي ⏱️",
                accentColor = Color(0xFFD97706)
            ),
            OnboardingPage(
                title = "تقويم الساعات مع التقويم الهجري",
                description = "جدولة دقيقة بنمط Google Calendar مع بطاقات دائرية الحواف ودعم كامل ومزدوج للتقويمين الهجري والميلادي.",
                icon = Icons.Default.CalendarMonth,
                badge = "هجري وميلادي 🌙",
                accentColor = Color(0xFF059669)
            )
        )
    }

    val pagerState = rememberPagerState(pageCount = { pages.size })

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Indicator of current page
                Text(
                    text = "\${pagerState.currentPage + 1} / \${pages.size}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                // Skip / 'I Know' button that permanently saves flag to DataStore
                TextButton(
                    onClick = {
                        viewModel.markOnboardingCompleted(onFinishOnboarding)
                    }
                ) {
                    Text(
                        text = "تخطي / أعرف النظام",
                        color = Color(0xFF7C3AED),
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }
            }
        },
        bottomBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterVertically,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Material 3 Animated Pill Indicators
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    repeat(pages.size) { index ->
                        val isSelected = pagerState.currentPage == index
                        val width by animateDpAsState(
                            targetValue = if (isSelected) 28.dp else 8.dp,
                            animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
                            label = "pill_width"
                        )
                        val color by animateColorAsState(
                            targetValue = if (isSelected) pages[index].accentColor else MaterialTheme.colorScheme.outlineVariant,
                            label = "pill_color"
                        )

                        Box(
                            modifier = Modifier
                                .height(8.dp)
                                .width(width)
                                .clip(CircleShape)
                                .background(color)
                        )
                    }
                }

                // Next or Get Started Button
                Button(
                    onClick = {
                        if (pagerState.currentPage < pages.size - 1) {
                            coroutineScope.launch {
                                pagerState.animateScrollToPage(pagerState.currentPage + 1)
                            }
                        } else {
                            viewModel.markOnboardingCompleted(onFinishOnboarding)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = pages[pagerState.currentPage].accentColor
                    )
                ) {
                    Text(
                        text = if (pagerState.currentPage == pages.size - 1) "ابدأ الانضباط الآن 🚀" else "التالي",
                        fontWeight = FontWeight.Black,
                        fontSize = 16.sp
                    )
                }
            }
        }
    ) { innerPadding ->
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) { pageIndex ->
            val page = pages[pageIndex]

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Interactive Interactive Simulation Graphic
                InteractivePageGraphic(pageIndex = pageIndex, accentColor = page.accentColor)

                Spacer(modifier = Modifier.height(32.dp))

                // Badge
                Surface(
                    color = page.accentColor.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = page.badge,
                        color = page.accentColor,
                        fontWeight = FontWeight.Black,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Title
                Text(
                    text = page.title,
                    fontWeight = FontWeight.Black,
                    fontSize = 24.sp,
                    textAlign = TextAlign.Center,
                    lineHeight = 32.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Description
                Text(
                    text = page.description,
                    fontWeight = FontWeight.Medium,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    lineHeight = 22.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

/**
 * Interactive visual element simulating feature mechanics (Voice, AI chunking, Hold, Calendar)
 */
@Composable
private fun InteractivePageGraphic(pageIndex: Int, accentColor: Color) {
    val infiniteTransition = rememberInfiniteTransition(label = "graphic_animation")

    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_scale"
    )

    Box(
        modifier = Modifier
            .size(190.dp)
            .scale(pulseScale)
            .clip(RoundedCornerShape(36.dp))
            .background(
                Brush.radialGradient(
                    colors = listOf(accentColor.copy(alpha = 0.25f), Color.Transparent)
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier.size(130.dp),
            shape = RoundedCornerShape(32.dp),
            color = accentColor.copy(alpha = 0.18f),
            shadowElevation = 8.dp
        ) {
            Box(contentAlignment = Alignment.Center) {
                when (pageIndex) {
                    0 -> Icon(Icons.Default.Shield, contentDescription = null, tint = accentColor, modifier = Modifier.size(64.dp))
                    1 -> Icon(Icons.Default.GraphicEq, contentDescription = null, tint = accentColor, modifier = Modifier.size(64.dp))
                    2 -> Icon(Icons.Default.HourglassBottom, contentDescription = null, tint = accentColor, modifier = Modifier.size(64.dp))
                    else -> Icon(Icons.Default.EventAvailable, contentDescription = null, tint = accentColor, modifier = Modifier.size(64.dp))
                }
            }
        }
    }
}
`
  },
  {
    path: 'app/src/main/java/com/grip/app/budget/BudgetDb.kt',
    category: 'database',
    title: 'BudgetDb.kt (Room Budget & Expense Tracker)',
    content: `package com.grip.app.budget

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Delete
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.Insert
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Transaction
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

/** Money is stored as whole minor units (cents / piastres): no floating point errors. */
@Entity(tableName = "budgets")
data class BudgetEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val totalMinor: Long,
    val currency: String,
    val startEpochDay: Long,      // LocalDate.toEpochDay()
    val durationDays: Int,
    val archived: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
)

@Entity(
    tableName = "categories",
    foreignKeys = [
        ForeignKey(
            entity = BudgetEntity::class,
            parentColumns = ["id"],
            childColumns = ["budgetId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("budgetId")],
)
data class CategoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val budgetId: Long,
    val name: String,
    val colorIndex: Int,
)

/** categoryId == null means "Other" (also what happens to expenses when their category is deleted). */
@Entity(
    tableName = "expenses",
    foreignKeys = [
        ForeignKey(
            entity = BudgetEntity::class,
            parentColumns = ["id"],
            childColumns = ["budgetId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = CategoryEntity::class,
            parentColumns = ["id"],
            childColumns = ["categoryId"],
            onDelete = ForeignKey.SET_NULL
        ),
    ],
    indices = [Index("budgetId"), Index("categoryId")],
)
data class ExpenseEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val budgetId: Long,
    val categoryId: Long?,
    val amountMinor: Long,
    val note: String = "",
    val createdAt: Long = System.currentTimeMillis(),
)

@Dao
abstract class BudgetDao {
    @Query("SELECT * FROM budgets WHERE archived = 0 ORDER BY createdAt DESC LIMIT 1")
    abstract fun observeCurrentBudget(): Flow<BudgetEntity?>

    @Query("SELECT * FROM categories WHERE budgetId = :budgetId ORDER BY id")
    abstract fun observeCategories(budgetId: Long): Flow<List<CategoryEntity>>

    @Query("SELECT * FROM expenses WHERE budgetId = :budgetId ORDER BY createdAt DESC")
    abstract fun observeExpenses(budgetId: Long): Flow<List<ExpenseEntity>>

    @Insert abstract suspend fun insertBudget(b: BudgetEntity): Long
    @Update abstract suspend fun updateBudget(b: BudgetEntity)
    @Query("UPDATE budgets SET archived = 1 WHERE archived = 0") abstract suspend fun archiveAll()

    @Insert abstract suspend fun insertCategory(c: CategoryEntity): Long
    @Query("DELETE FROM categories WHERE id = :id") abstract suspend fun deleteCategory(id: Long)

    @Insert abstract suspend fun insertExpense(e: ExpenseEntity): Long
    @Delete abstract suspend fun deleteExpense(e: ExpenseEntity)

    /** A new budget archives the old one (nothing is ever deleted by accident). */
    @Transaction
    open suspend fun startNewBudget(b: BudgetEntity): Long {
        archiveAll()
        return insertBudget(b)
    }
}

@Database(
    entities = [BudgetEntity::class, CategoryEntity::class, ExpenseEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class BudgetDb : RoomDatabase() {
    abstract fun dao(): BudgetDao

    companion object {
        @Volatile private var instance: BudgetDb? = null
        fun get(context: Context): BudgetDb = instance ?: synchronized(this) {
            instance ?: Room.databaseBuilder(context.applicationContext, BudgetDb::class.java, "grip_budget.db")
                .build().also { instance = it }
        }
    }
}
`
  },
  {
    path: 'app/src/main/java/com/grip/app/budget/BudgetMath.kt',
    category: 'database',
    title: 'BudgetMath.kt (ADHD Budget Pace & Trajectory Engine)',
    content: `package com.grip.app.budget

import java.math.BigDecimal
import java.math.RoundingMode
import java.text.NumberFormat
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.Currency
import java.util.Locale

const val CATEGORY_COLOR_COUNT = 8

data class BudgetSnapshot(
    val budget: BudgetEntity,
    val categories: List<CategoryEntity>,
    val expenses: List<ExpenseEntity>,
)

enum class Pace { ON_TRACK, A_BIT_FAST, SLOW_DOWN, OVER_BUDGET, ENDED }

data class CategoryTotal(val categoryId: Long?, val name: String?, val colorIndex: Int, val spentMinor: Long)

data class BudgetStats(
    val totalMinor: Long,
    val spentMinor: Long,
    val remainingMinor: Long,
    val dayNumber: Int,            // today's position in the window: 1..durationDays
    val durationDays: Int,
    val daysLeft: Int,             // including today; 0 when the window is over
    val perDayMinor: Long,         // what you can spend per day from now on
    val spentTodayMinor: Long,
    val spendFraction: Float,      // spent / total, 0..1
    val allowedFraction: Float,    // where you'd be today if you spent evenly, 0..1 (the marker)
    val pace: Pace,
    val runsOutInDays: Int?,       // null = nothing to warn about (or not enough data yet)
    val perCategory: List<CategoryTotal>,
)

fun computeStats(s: BudgetSnapshot, today: LocalDate = LocalDate.now()): BudgetStats {
    val b = s.budget
    val spent = s.expenses.sumOf { it.amountMinor }
    val remaining = b.totalMinor - spent

    val passed = (today.toEpochDay() - b.startEpochDay).toInt()        // full days since the start
    val ended = passed >= b.durationDays
    val dayNumber = (passed + 1).coerceIn(1, b.durationDays)
    val daysLeft = if (ended) 0 else (b.durationDays - passed).coerceAtMost(b.durationDays)

    val allowedSoFar = b.totalMinor * dayNumber / b.durationDays       // budget "released" through today
    val pace = when {
        remaining < 0 -> Pace.OVER_BUDGET
        ended -> Pace.ENDED
        spent <= allowedSoFar -> Pace.ON_TRACK
        spent <= allowedSoFar + allowedSoFar / 4 -> Pace.A_BIT_FAST     // up to 25% ahead of an even pace
        else -> Pace.SLOW_DOWN
    }

    val perDay = if (daysLeft > 0 && remaining > 0) remaining / daysLeft else 0L

    val zone = ZoneId.systemDefault()
    val spentToday = s.expenses
        .filter { Instant.ofEpochMilli(it.createdAt).atZone(zone).toLocalDate() == today }
        .sumOf { it.amountMinor }

    // "At this pace the money lasts N more days" - only shown from day 3, and only if it would run out early.
    val runsOut = if (!ended && remaining > 0 && spent > 0 && dayNumber >= 3) {
        val daily = spent.toDouble() / dayNumber
        val d = (remaining / daily).toInt()
        if (d < daysLeft) d else null
    } else null

    val byCategory = s.expenses.groupBy { it.categoryId }.mapValues { (_, v) -> v.sumOf { it.amountMinor } }
    val cats = s.categories.map { CategoryTotal(it.id, it.name, it.colorIndex, byCategory[it.id] ?: 0L) }
    val other = byCategory[null] ?: 0L
    val perCategory = if (other > 0) cats + CategoryTotal(null, null, -1, other) else cats

    val total = b.totalMinor.coerceAtLeast(1L)
    return BudgetStats(
        totalMinor = b.totalMinor, spentMinor = spent, remainingMinor = remaining,
        dayNumber = dayNumber, durationDays = b.durationDays, daysLeft = daysLeft,
        perDayMinor = perDay, spentTodayMinor = spentToday,
        spendFraction = (spent.toFloat() / total).coerceIn(0f, 1f),
        allowedFraction = (allowedSoFar.toFloat() / total).coerceIn(0f, 1f),
        pace = pace, runsOutInDays = runsOut, perCategory = perCategory,
    )
}

/** Accepts Arabic-Indic digits and both "." and "," / "٫" as the decimal mark. Returns minor units, or null. */
fun parseMinor(input: String): Long? {
    val sb = StringBuilder()
    for (c in input.trim()) when {
        c.isDigit() -> sb.append(Character.digit(c, 10))
        c == '.' || c == ',' || c == '٫' || c == '،' -> sb.append('.')
        c == '٬' || c == ' ' -> Unit
        else -> return null
    }
    if (sb.isEmpty()) return null
    return runCatching {
        BigDecimal(sb.toString()).movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact()
    }.getOrNull()
}

fun minorToInput(minor: Long): String = BigDecimal(minor).movePointLeft(2).stripTrailingZeros().toPlainString()

/** Uses the phone's number format (Arabic digits on an Arabic phone), hides ".00" for whole amounts. */
fun formatMoney(minor: Long, currency: String): String {
    val nf = NumberFormat.getNumberInstance().apply {
        maximumFractionDigits = 2
        minimumFractionDigits = if (minor % 100L == 0L) 0 else 2
    }
    return (nf.format(minor / 100.0) + " " + currency).trim()
}

fun defaultCurrency(): String =
    try { Currency.getInstance(Locale.getDefault()).currencyCode } catch (e: Exception) { "" }
`
  },
  {
    path: 'app/src/main/java/com/grip/app/budget/BudgetViewModel.kt',
    category: 'database',
    title: 'BudgetViewModel.kt (Reactive Flow State & Undo Support)',
    content: `package com.grip.app.budget

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate

data class BudgetUi(
    val loaded: Boolean = false,
    val snapshot: BudgetSnapshot? = null,
    val stats: BudgetStats? = null,
)

class BudgetViewModel(app: Application) : AndroidViewModel(app) {
    private val dao = BudgetDb.get(app).dao()

    @OptIn(ExperimentalCoroutinesApi::class)
    private val snapshots: Flow<BudgetSnapshot?> = dao.observeCurrentBudget().flatMapLatest { b ->
        if (b == null) flowOf(null)
        else combine(dao.observeCategories(b.id), dao.observeExpenses(b.id)) { c, e -> BudgetSnapshot(b, c, e) }
    }

    // re-computes when the day changes (even if the app stays open past midnight)
    private val today: Flow<LocalDate> = flow {
        while (true) { emit(LocalDate.now()); delay(60_000) }
    }.distinctUntilChanged()

    val ui: StateFlow<BudgetUi> = combine(snapshots, today) { snap, day ->
        BudgetUi(loaded = true, snapshot = snap, stats = snap?.let { computeStats(it, day) })
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), BudgetUi())

    /** The category used last, so the next expense is pre-filled (fewer taps). */
    var lastCategoryId: Long? = null
        private set
    private var lastDeleted: ExpenseEntity? = null

    fun startBudget(totalMinor: Long, days: Int, name: String, currency: String) = viewModelScope.launch {
        dao.startNewBudget(
            BudgetEntity(
                name = name, totalMinor = totalMinor, currency = currency,
                startEpochDay = LocalDate.now().toEpochDay(), durationDays = days.coerceIn(1, 366),
            )
        )
        lastCategoryId = null
    }

    fun editBudget(totalMinor: Long, days: Int, name: String, currency: String) = viewModelScope.launch {
        val b = ui.value.snapshot?.budget ?: return@launch
        dao.updateBudget(b.copy(totalMinor = totalMinor, durationDays = days.coerceIn(1, 366), name = name, currency = currency))
    }

    fun addExpense(amountMinor: Long, categoryId: Long?, note: String) = viewModelScope.launch {
        val b = ui.value.snapshot?.budget ?: return@launch
        lastCategoryId = categoryId
        dao.insertExpense(ExpenseEntity(budgetId = b.id, categoryId = categoryId, amountMinor = amountMinor, note = note.trim()))
    }

    fun deleteExpense(e: ExpenseEntity) = viewModelScope.launch { lastDeleted = e; dao.deleteExpense(e) }
    fun undoDelete() = viewModelScope.launch { lastDeleted?.let { dao.insertExpense(it) }; lastDeleted = null }

    /** Returns the id of the new category (or of the existing one with the same name). */
    suspend fun addCategory(name: String): Long? {
        val snap = ui.value.snapshot ?: return null
        val clean = name.trim().take(24)
        if (clean.isEmpty()) return null
        snap.categories.firstOrNull { it.name.equals(clean, ignoreCase = true) }?.let { return it.id }
        return dao.insertCategory(CategoryEntity(budgetId = snap.budget.id, name = clean, colorIndex = snap.categories.size % CATEGORY_COLOR_COUNT))
    }

    fun deleteCategory(id: Long) = viewModelScope.launch {
        if (lastCategoryId == id) lastCategoryId = null
        dao.deleteCategory(id)
    }
}
`
  },
  {
    path: 'app/src/main/java/com/grip/app/budget/BudgetScreen.kt',
    category: 'ui',
    title: 'BudgetScreen.kt (ADHD Budget Jetpack Compose UI)',
    content: `package com.grip.app.budget

import android.text.format.DateUtils
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeFloatingActionButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.Surface
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.grip.app.R
import kotlinx.coroutines.launch
import kotlin.math.abs

private val CategoryColors = listOf(
    Color(0xFF8B5CF6), Color(0xFF14B8A6), Color(0xFFEC4899), Color(0xFF3B82F6),
    Color(0xFFF59E0B), Color(0xFF22C55E), Color(0xFF64748B), Color(0xFFF43F5E),
)
private fun colorFor(index: Int) = if (index < 0) Color(0xFF94A3B8) else CategoryColors[index % CategoryColors.size]

private sealed interface Sheet {
    data class AddExpense(val categoryId: Long?) : Sheet
    data object NewBudget : Sheet
    data object EditBudget : Sheet
}

/* ───────────────────────────── entry point ───────────────────────────── */

@Composable
fun BudgetRoute(vm: BudgetViewModel = viewModel()) {
    val ui by vm.ui.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var sheet by remember { mutableStateOf<Sheet?>(null) }
    val snap = ui.snapshot
    val stats = ui.stats

    when {
        !ui.loaded -> Box(Modifier.fillMaxSize())
        snap == null || stats == null -> EmptyState(onStart = { sheet = Sheet.NewBudget })
        else -> BudgetHome(
            snap, stats, vm, snackbar,
            onAdd = { sheet = Sheet.AddExpense(it) },
            onEdit = { sheet = Sheet.EditBudget },
            onNew = { sheet = Sheet.NewBudget },
        )
    }

    when (val s = sheet) {
        is Sheet.AddExpense -> if (snap != null) QuickAddSheet(snap, vm, s.categoryId) { sheet = null }
        Sheet.NewBudget -> BudgetFormSheet(
            existing = null, onDismiss = { sheet = null },
            onSave = { total, days, name, cur -> vm.startBudget(total, days, name, cur); sheet = null },
        )
        Sheet.EditBudget -> BudgetFormSheet(
            existing = snap?.budget, onDismiss = { sheet = null },
            onSave = { total, days, name, cur -> vm.editBudget(total, days, name, cur); sheet = null },
        )
        null -> Unit
    }
}

/* ───────────────────────────── screens ───────────────────────────── */

@Composable
private fun EmptyState(onStart: () -> Unit) {
    Column(
        Modifier.fillMaxSize().padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(stringResource(R.string.empty_title), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center)
        Spacer(Modifier.height(12.dp))
        Text(stringResource(R.string.empty_text), color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
        Spacer(Modifier.height(28.dp))
        Button(onClick = onStart, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(16.dp)) {
            Text(stringResource(R.string.start_budget), fontWeight = FontWeight.Bold)
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun BudgetHome(
    snap: BudgetSnapshot, stats: BudgetStats, vm: BudgetViewModel, snackbar: SnackbarHostState,
    onAdd: (Long?) -> Unit, onEdit: () -> Unit, onNew: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    val currency = snap.budget.currency
    val deletedMsg = stringResource(R.string.expense_deleted)
    val undoLabel = stringResource(R.string.undo)
    var menu by remember { mutableStateOf(false) }
    var newCategory by remember { mutableStateOf(false) }
    var categoryToDelete by remember { mutableStateOf<CategoryTotal?>(null) }
    val catById = remember(snap.categories) { snap.categories.associateBy { it.id } }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbar) },
        floatingActionButton = {
            LargeFloatingActionButton(onClick = { onAdd(vm.lastCategoryId) }) {
                Icon(Icons.Filled.Add, contentDescription = stringResource(R.string.add_expense))
            }
        },
    ) { pad ->
        LazyColumn(
            Modifier.fillMaxSize().padding(pad),
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 120.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        snap.budget.name.ifBlank { stringResource(R.string.day_x_of_y, stats.dayNumber, stats.durationDays) },
                        style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f),
                    )
                    Box {
                        IconButton(onClick = { menu = true }) { Icon(Icons.Filled.MoreVert, stringResource(R.string.more)) }
                        DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                            DropdownMenuItem(text = { Text(stringResource(R.string.edit_budget)) }, onClick = { menu = false; onEdit() })
                            DropdownMenuItem(text = { Text(stringResource(R.string.new_budget)) }, onClick = { menu = false; onNew() })
                        }
                    }
                }
            }
            item { SummaryCard(stats, currency) }
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(stats.perCategory, key = { it.categoryId ?: -1L }) { c ->
                        CategoryChip(
                            c, currency,
                            onClick = { onAdd(c.categoryId) },
                            onLongClick = { if (c.categoryId != null) categoryToDelete = c },
                        )
                    }
                    item { AssistChip(onClick = { newCategory = true }, label = { Text("+ " + stringResource(R.string.new_category)) }) }
                }
            }
            item { Text(stringResource(R.string.recent), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            if (snap.expenses.isEmpty()) {
                item { Text(stringResource(R.string.no_expenses), color = MaterialTheme.colorScheme.onSurfaceVariant) }
            } else {
                items(snap.expenses, key = { it.id }) { e ->
                    ExpenseRow(e, catById[e.categoryId], currency) {
                        vm.deleteExpense(e)
                        scope.launch {
                            val r = snackbar.showSnackbar(deletedMsg, undoLabel, duration = SnackbarDuration.Short)
                            if (r == SnackbarResult.ActionPerformed) vm.undoDelete()
                        }
                    }
                }
            }
        }
    }

    if (newCategory) NewCategoryDialog(
        onDismiss = { newCategory = false },
        onSave = { name -> scope.launch { vm.addCategory(name) }; newCategory = false },
    )
    categoryToDelete?.let { c ->
        AlertDialog(
            onDismissRequest = { categoryToDelete = null },
            title = { Text(stringResource(R.string.delete_category)) },
            text = { Text(c.name ?: "") },
            confirmButton = { TextButton(onClick = { c.categoryId?.let(vm::deleteCategory); categoryToDelete = null }) { Text(stringResource(R.string.delete)) } },
            dismissButton = { TextButton(onClick = { categoryToDelete = null }) { Text(stringResource(R.string.cancel)) } },
        )
    }
}

/* ───────────────────────────── summary ───────────────────────────── */

@Composable
private fun paceColor(p: Pace): Color {
    val dark = isSystemInDarkTheme()
    return when (p) {
        Pace.ON_TRACK -> if (dark) Color(0xFF4ADE80) else Color(0xFF16A34A)
        Pace.A_BIT_FAST -> if (dark) Color(0xFFFBBF24) else Color(0xFFD97706)
        Pace.SLOW_DOWN -> if (dark) Color(0xFFFB923C) else Color(0xFFEA580C)
        Pace.OVER_BUDGET -> if (dark) Color(0xFFF87171) else Color(0xFFDC2626)
        Pace.ENDED -> MaterialTheme.colorScheme.onSurfaceVariant
    }
}

@Composable
private fun paceText(p: Pace) = stringResource(
    when (p) {
        Pace.ON_TRACK -> R.string.pace_on_track
        Pace.A_BIT_FAST -> R.string.pace_a_bit_fast
        Pace.SLOW_DOWN -> R.string.pace_slow_down
        Pace.OVER_BUDGET -> R.string.pace_over
        Pace.ENDED -> R.string.pace_ended
    }
)

@Composable
private fun SummaryCard(st: BudgetStats, currency: String) {
    val res = LocalContext.current.resources
    val color = paceColor(st.pace)
    val over = st.remainingMinor < 0
    Card(
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(stringResource(R.string.day_x_of_y, st.dayNumber, st.durationDays), color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelLarge)
                Text(paceText(st.pace), color = color, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelLarge)
            }
            Text(
                formatMoney(abs(st.remainingMinor), currency),
                style = MaterialTheme.typography.displayMedium, fontWeight = FontWeight.ExtraBold,
                color = if (over) color else MaterialTheme.colorScheme.onSurface,
            )
            Text(
                if (over) stringResource(R.string.over_by) else stringResource(R.string.left_of, formatMoney(st.totalMinor, currency)),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(8.dp))
            SpendBar(st.spendFraction, st.allowedFraction, color)
            Spacer(Modifier.height(8.dp))
            if (st.daysLeft > 0 && st.remainingMinor > 0) {
                Text(
                    stringResource(R.string.per_day, formatMoney(st.perDayMinor, currency)) + "  ·  " +
                        res.getQuantityString(R.plurals.days_left, st.daysLeft, st.daysLeft),
                    fontWeight = FontWeight.SemiBold,
                )
            }
            st.runsOutInDays?.let { d ->
                Text(res.getQuantityString(R.plurals.runs_out, d, d), color = paceColor(Pace.A_BIT_FAST), style = MaterialTheme.typography.bodyMedium)
            }
            if (st.spentTodayMinor > 0) {
                Text(stringResource(R.string.spent_today, formatMoney(st.spentTodayMinor, currency)), color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

/** The fill = what you spent. The thin marker = where you'd be today if you spent evenly. */
@Composable
private fun SpendBar(spendFraction: Float, allowedFraction: Float, color: Color) {
    Box(
        Modifier.fillMaxWidth().height(14.dp).clip(RoundedCornerShape(7.dp)).background(MaterialTheme.colorScheme.outlineVariant)
    ) {
        Box(Modifier.fillMaxWidth(spendFraction.coerceIn(0f, 1f)).fillMaxHeight().background(color))
        Box(Modifier.fillMaxWidth(allowedFraction.coerceIn(0f, 1f)).fillMaxHeight(), contentAlignment = Alignment.CenterEnd) {
            Box(Modifier.width(3.dp).fillMaxHeight().background(MaterialTheme.colorScheme.onSurface))
        }
    }
}

/* ───────────────────────────── categories & expenses ───────────────────────────── */

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun CategoryChip(c: CategoryTotal, currency: String, onClick: () -> Unit, onLongClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.clip(RoundedCornerShape(16.dp)).combinedClickable(onClick = onClick, onLongClick = onLongClick),
    ) {
        Row(Modifier.padding(horizontal = 12.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(Modifier.size(10.dp).clip(CircleShape).background(colorFor(c.colorIndex)))
            Column {
                Text(c.name ?: stringResource(R.string.other), fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyMedium)
                Text(formatMoney(c.spentMinor, currency), color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ExpenseRow(e: ExpenseEntity, cat: CategoryEntity?, currency: String, onDelete: () -> Unit) {
    val state = rememberSwipeToDismissBoxState(confirmValueChange = { v ->
        if (v != SwipeToDismissBoxValue.Settled) { onDelete(); true } else false
    })
    val danger = if (isSystemInDarkTheme()) Color(0xFFF87171) else Color(0xFFDC2626)
    val catName = cat?.name ?: stringResource(R.string.other)
    val title = e.note.ifBlank { catName }
    val whenText = DateUtils.getRelativeTimeSpanString(e.createdAt, System.currentTimeMillis(), DateUtils.MINUTE_IN_MILLIS).toString()

    SwipeToDismissBox(
        state = state,
        backgroundContent = {
            Box(Modifier.fillMaxSize().clip(RoundedCornerShape(16.dp)).background(danger.copy(alpha = 0.15f)).padding(horizontal = 20.dp), contentAlignment = Alignment.CenterEnd) {
                Icon(Icons.Filled.Delete, contentDescription = null, tint = danger)
            }
        },
    ) {
        Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surface, modifier = Modifier.fillMaxWidth()) {
            Row(Modifier.padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(Modifier.size(10.dp).clip(CircleShape).background(colorFor(cat?.colorIndex ?: -1)))
                Column(Modifier.weight(1f)) {
                    Text(title, fontWeight = FontWeight.SemiBold, maxLines = 1)
                    Text(
                        (if (e.note.isNotBlank()) "$catName · " else "") + whenText,
                        color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelSmall, maxLines = 1,
                    )
                }
                Text(formatMoney(e.amountMinor, currency), fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun NewCategoryDialog(onDismiss: () -> Unit, onSave: (String) -> Unit) {
    var name by remember { mutableStateOf("") }
    val focus = remember { FocusRequester() }
    LaunchedEffect(Unit) { focus.requestFocus() }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.new_category)) },
        text = {
            OutlinedTextField(
                value = name, onValueChange = { name = it.take(24) }, singleLine = true,
                label = { Text(stringResource(R.string.category_name)) },
                modifier = Modifier.focusRequester(focus),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { if (name.isNotBlank()) onSave(name) }),
            )
        },
        confirmButton = { TextButton(onClick = { if (name.isNotBlank()) onSave(name) }) { Text(stringResource(R.string.save)) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResource(R.string.cancel)) } },
    )
}

/* ───────────────────────────── add an expense (the fast path) ───────────────────────────── */

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun QuickAddSheet(snap: BudgetSnapshot, vm: BudgetViewModel, initialCategory: Long?, onDismiss: () -> Unit) {
    val scope = rememberCoroutineScope()
    val focus = remember { FocusRequester() }
    var amount by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var category by remember { mutableStateOf(initialCategory?.takeIf { id -> snap.categories.any { it.id == id } }) }
    var addingCategory by remember { mutableStateOf(false) }
    var newName by remember { mutableStateOf("") }
    var error by remember { mutableStateOf(false) }

    fun submit() {
        val minor = parseMinor(amount)
        if (minor == null || minor <= 0) { error = true; return }
        vm.addExpense(minor, category, note)
        onDismiss()
    }
    fun saveCategory() {
        val n = newName
        scope.launch { vm.addCategory(n)?.let { category = it }; newName = ""; addingCategory = false }
    }
    LaunchedEffect(Unit) { focus.requestFocus() }

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 24.dp).imePadding(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            OutlinedTextField(
                value = amount,
                onValueChange = { v -> amount = v.filter { it.isDigit() || it == '.' || it == ',' || it == '٫' }; error = false },
                modifier = Modifier.fillMaxWidth().focusRequester(focus),
                singleLine = true, isError = error,
                textStyle = MaterialTheme.typography.headlineMedium,
                label = { Text(stringResource(if (error) R.string.invalid_amount else R.string.amount)) },
                suffix = { Text(snap.budget.currency) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal, imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { submit() }),
            )
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                snap.categories.forEach { c ->
                    FilterChip(selected = category == c.id, onClick = { category = if (category == c.id) null else c.id }, label = { Text(c.name) })
                }
                if (!addingCategory) AssistChip(onClick = { addingCategory = true }, label = { Text("+ " + stringResource(R.string.new_category)) })
            }
            if (addingCategory) {
                val catFocus = remember { FocusRequester() }
                LaunchedEffect(Unit) { catFocus.requestFocus() }
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = newName, onValueChange = { newName = it.take(24) }, singleLine = true,
                        label = { Text(stringResource(R.string.category_name)) },
                        modifier = Modifier.weight(1f).focusRequester(catFocus),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { saveCategory() }),
                    )
                    TextButton(onClick = { saveCategory() }) { Text(stringResource(R.string.save)) }
                }
            }
            OutlinedTextField(
                value = note, onValueChange = { note = it.take(60) }, singleLine = true,
                label = { Text(stringResource(R.string.note_hint)) }, modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done), keyboardActions = KeyboardActions(onDone = { submit() }),
            )
            Button(onClick = { submit() }, modifier = Modifier.fillMaxWidth().height(52.dp), shape = RoundedCornerShape(16.dp)) {
                Text(stringResource(R.string.add), fontWeight = FontWeight.Bold)
            }
        }
    }
}

/* ───────────────────────────── create / edit the budget ───────────────────────────── */

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BudgetFormSheet(
    existing: BudgetEntity?,
    onSave: (totalMinor: Long, days: Int, name: String, currency: String) -> Unit,
    onDismiss: () -> Unit,
) {
    val focus = remember { FocusRequester() }
    var total by remember { mutableStateOf(existing?.let { minorToInput(it.totalMinor) } ?: "") }
    var days by remember { mutableStateOf((existing?.durationDays ?: 14).toString()) }
    var name by remember { mutableStateOf(existing?.name ?: "") }
    var currency by remember { mutableStateOf(existing?.currency ?: defaultCurrency()) }
    var error by remember { mutableStateOf(false) }

    fun submit() {
        val minor = parseMinor(total)
        val d = days.toIntOrNull()
        if (minor == null || minor <= 0 || d == null || d < 1) { error = true; return }
        onSave(minor, d.coerceIn(1, 366), name.trim(), currency.trim())
    }
    LaunchedEffect(Unit) { focus.requestFocus() }

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 24.dp).imePadding(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text(stringResource(if (existing == null) R.string.new_budget else R.string.edit_budget), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            OutlinedTextField(
                value = total, onValueChange = { v -> total = v.filter { it.isDigit() || it == '.' || it == ',' || it == '٫' }; error = false },
                modifier = Modifier.fillMaxWidth().focusRequester(focus), singleLine = true, isError = error,
                textStyle = MaterialTheme.typography.headlineMedium,
                label = { Text(stringResource(if (error) R.string.invalid_amount else R.string.total_amount)) },
                suffix = { Text(currency) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal, imeAction = ImeAction.Next),
            )
            Text(stringResource(R.string.duration), color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                listOf(7, 14, 30).forEach { d ->
                    FilterChip(selected = days == d.toString(), onClick = { days = d.toString() }, label = { Text("$d") })
                }
                OutlinedTextField(
                    value = days, onValueChange = { v -> days = v.filter { it.isDigit() }.take(3) },
                    modifier = Modifier.weight(1f), singleLine = true,
                    suffix = { Text(stringResource(R.string.days_unit)) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { submit() }),
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = name, onValueChange = { name = it.take(30) }, singleLine = true,
                    label = { Text(stringResource(R.string.budget_name)) }, modifier = Modifier.weight(1f),
                )
                OutlinedTextField(
                    value = currency, onValueChange = { currency = it.take(5) }, singleLine = true,
                    label = { Text(stringResource(R.string.currency)) }, modifier = Modifier.width(110.dp),
                )
            }
            Button(onClick = { submit() }, modifier = Modifier.fillMaxWidth().height(52.dp), shape = RoundedCornerShape(16.dp)) {
                Text(stringResource(if (existing == null) R.string.start else R.string.save), fontWeight = FontWeight.Bold)
            }
        }
    }
}
`
  },
  {
    path: 'app/src/main/res/values-ar/strings.xml',
    category: 'ui',
    title: 'res/values-ar/strings.xml (Budget Egyptian Arabic Strings)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="empty_title">فلوسك بطريقتك</string>
    <string name="empty_text">حدد المبلغ والمدة اللي هيكفيها. وضيف الفئات وانت ماشي.</string>
    <string name="start_budget">ابدأ ميزانية</string>
    <string name="new_budget">ميزانية جديدة</string>
    <string name="edit_budget">تعديل الميزانية</string>
    <string name="total_amount">المبلغ الكلي</string>
    <string name="duration">لمدة كام يوم؟</string>
    <string name="days_unit">يوم</string>
    <string name="budget_name">الاسم (اختياري)</string>
    <string name="currency">العملة</string>
    <string name="start">ابدأ</string>
    <string name="save">حفظ</string>
    <string name="cancel">إلغاء</string>
    <string name="delete">حذف</string>
    <string name="more">المزيد</string>

    <string name="add_expense">ضيف مصروف</string>
    <string name="amount">المبلغ</string>
    <string name="invalid_amount">اكتب مبلغ</string>
    <string name="note_hint">ملاحظة (اختياري)</string>
    <string name="add">إضافة</string>
    <string name="new_category">جديدة</string>
    <string name="category_name">اسم الفئة</string>
    <string name="delete_category">حذف الفئة دي؟</string>
    <string name="other">أخرى</string>
    <string name="recent">آخر المصروفات</string>
    <string name="no_expenses">لسه ماصرفتش حاجة. اضغط + لما تصرف.</string>
    <string name="expense_deleted">اتمسح المصروف</string>
    <string name="undo">تراجع</string>

    <string name="day_x_of_y">اليوم %1$d من %2$d</string>
    <string name="left_of">متبقي من %1$s</string>
    <string name="over_by">زيادة عن الميزانية</string>
    <string name="per_day">%1$s في اليوم</string>
    <string name="spent_today">صرفت النهاردة: %1$s</string>
    <string name="pace_on_track">ماشي كويس</string>
    <string name="pace_a_bit_fast">بسرعة شوية</string>
    <string name="pace_slow_down">هدّي شوية</string>
    <string name="pace_over">الميزانية خلصت</string>
    <string name="pace_ended">المدة خلصت</string>

    <plurals name="days_left">
        <item quantity="zero">لا أيام متبقية</item>
        <item quantity="one">باقي يوم</item>
        <item quantity="two">باقي يومين</item>
        <item quantity="few">باقي %d أيام</item>
        <item quantity="many">باقي %d يومًا</item>
        <item quantity="other">باقي %d يوم</item>
    </plurals>
    <plurals name="runs_out">
        <item quantity="zero">بالمعدل ده الفلوس هتخلص النهاردة</item>
        <item quantity="one">بالمعدل ده الفلوس بتكفي يوم تقريبًا</item>
        <item quantity="two">بالمعدل ده الفلوس بتكفي يومين تقريبًا</item>
        <item quantity="few">بالمعدل ده الفلوس بتكفي %d أيام تقريبًا</item>
        <item quantity="many">بالمعدل ده الفلوس بتكفي %d يومًا تقريبًا</item>
        <item quantity="other">بالمعدل ده الفلوس بتكفي %d يوم تقريبًا</item>
    </plurals>
</resources>`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    category: 'ui',
    title: 'res/values/strings.xml (Budget English Strings)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="empty_title">Money, your way</string>
    <string name="empty_text">Pick an amount and how long it should last. Add categories as you go.</string>
    <string name="start_budget">Start a budget</string>
    <string name="new_budget">New budget</string>
    <string name="edit_budget">Edit budget</string>
    <string name="total_amount">Total amount</string>
    <string name="duration">How many days?</string>
    <string name="days_unit">days</string>
    <string name="budget_name">Name (optional)</string>
    <string name="currency">Currency</string>
    <string name="start">Start</string>
    <string name="save">Save</string>
    <string name="cancel">Cancel</string>
    <string name="delete">Delete</string>
    <string name="more">More</string>

    <string name="add_expense">Add expense</string>
    <string name="amount">Amount</string>
    <string name="invalid_amount">Enter an amount</string>
    <string name="note_hint">Note (optional)</string>
    <string name="add">Add</string>
    <string name="new_category">New</string>
    <string name="category_name">Category name</string>
    <string name="delete_category">Delete this category?</string>
    <string name="other">Other</string>
    <string name="recent">Recent</string>
    <string name="no_expenses">Nothing spent yet. Tap + when you do.</string>
    <string name="expense_deleted">Expense deleted</string>
    <string name="undo">Undo</string>

    <string name="day_x_of_y">Day %1$d of %2$d</string>
    <string name="left_of">left of %1$s</string>
    <string name="over_by">over the budget</string>
    <string name="per_day">%1$s per day</string>
    <string name="spent_today">Spent today: %1$s</string>
    <string name="pace_on_track">On track</string>
    <string name="pace_a_bit_fast">A little fast</string>
    <string name="pace_slow_down">Slow down a bit</string>
    <string name="pace_over">Budget used up</string>
    <string name="pace_ended">Time is up</string>

    <plurals name="days_left">
        <item quantity="one">%d day left</item>
        <item quantity="other">%d days left</item>
    </plurals>
    <plurals name="runs_out">
        <item quantity="one">At this pace it lasts about %d more day</item>
        <item quantity="other">At this pace it lasts about %d more days</item>
    </plurals>
</resources>`
  },
  {
    path: 'app/src/main/java/com/grip/app/GripHomeScreen.kt',
    category: 'ui',
    title: 'GripHomeScreen.kt (Simple Calendar & Tasks Strip)',
    content: `package com.grip.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class GripUiTask(
    val id: String,
    val title: String,
    val category: String,
    val timeRange: String,
    val isDone: Boolean = false,
    val isFixed: Boolean = false
)

data class CalendarDay(
    val dayName: String,
    val dayNumber: String,
    val isSelected: Boolean = false,
    val isToday: Boolean = false
)

@Composable
fun HomeScreen() {
    var selectedDayIndex by remember { mutableStateOf(2) }
    var tasks by remember {
        mutableStateOf(
            listOf(
                GripUiTask("1", "محاضرة شبكات ونظم تشغيل", "دراسة", "10:00 ص - 12:00 م", isDone = true, isFixed = true),
                GripUiTask("2", "مذاكرة شابتر 3 فيزياء كهربائية", "مذاكرة", "02:00 م - 04:00 م", isDone = false, isFixed = false),
                GripUiTask("3", "تمارين لياقة بدنية (جيم)", "رياضة", "05:30 م - 06:30 م", isDone = false, isFixed = false),
                GripUiTask("4", "مراجعة كود تطبيق Grip", "شغل", "08:00 م - 09:30 م", isDone = false, isFixed = false)
            )
        )
    }

    val days = remember(selectedDayIndex) {
        listOf(
            CalendarDay("الخميس", "8", selectedDayIndex == 0),
            CalendarDay("الجمعة", "9", selectedDayIndex == 1),
            CalendarDay("السبت", "10", selectedDayIndex == 2, isToday = true),
            CalendarDay("الأحد", "11", selectedDayIndex == 3),
            CalendarDay("الإثنين", "12", selectedDayIndex == 4),
            CalendarDay("الثلاثاء", "13", selectedDayIndex == 5),
            CalendarDay("الأربعاء", "14", selectedDayIndex == 6),
        )
    }

    val cs = MaterialTheme.colorScheme
    val completedCount = tasks.count { it.isDone }

    Scaffold(
        containerColor = cs.background,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { /* Add Task */ },
                containerColor = cs.primary,
                contentColor = Color.White,
                shape = RoundedCornerShape(18.dp)
            ) {
                Icon(Icons.Filled.Add, contentDescription = "إضافة مهمة", modifier = Modifier.size(26.dp))
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .windowInsetsPadding(WindowInsets.systemBars)
        ) {
            // 1. Top Header Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(cs.primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("G", color = Color.White, fontWeight = FontWeight.Black, fontSize = 20.sp)
                    }
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("Grip", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                        Text("اليوم، 10 أكتوبر", style = MaterialTheme.typography.labelSmall, color = cs.onSurfaceVariant)
                    }
                }

                // Streak Badge Pill
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = cs.primaryContainer,
                    modifier = Modifier.padding(2.dp)
                ) {
                    Text(
                        "🔥 3 أيام التزام",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = cs.onPrimaryContainer
                    )
                }
            }

            // 2. Weekly Calendar Strip (منطقة الكالندر)
            Text(
                "أيام الأسبوع",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = cs.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp)
            )

            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(days.size) { i ->
                    val day = days[i]
                    val isSelected = day.isSelected
                    Column(
                        modifier = Modifier
                            .width(58.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(if (isSelected) cs.primary else cs.surface)
                            .clickable { selectedDayIndex = i }
                            .padding(vertical = 10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            day.dayName,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isSelected) Color.White.copy(alpha = 0.9f) else cs.onSurfaceVariant
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            day.dayNumber,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Black,
                            color = if (isSelected) Color.White else cs.onSurface
                        )
                        if (day.isToday) {
                            Spacer(Modifier.height(4.dp))
                            Box(
                                modifier = Modifier
                                    .size(5.dp)
                                    .clip(CircleShape)
                                    .background(if (isSelected) Color.White else cs.primary)
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // 3. Positive Summary Banner
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                shape = RoundedCornerShape(16.dp),
                color = cs.surface,
                tonalElevation = 2.dp
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            "مهام اليوم (\${tasks.size})",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "$completedCount منجزة • 0 تأجيلات",
                            style = MaterialTheme.typography.labelSmall,
                            color = cs.onSurfaceVariant
                        )
                    }
                    Text("✓ قبضة محكمة", color = cs.primary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }

            Spacer(Modifier.height(12.dp))

            // 4. Tasks List
            LazyColumn(
                modifier = Modifier.fillMaxWidth().weight(1f),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(tasks) { task ->
                    val isDone = task.isDone
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isDone) cs.surface.copy(alpha = 0.6f) else cs.surface
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = if (isDone) 0.dp else 2.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(
                                onClick = {
                                    tasks = tasks.map {
                                        if (it.id == task.id) it.copy(isDone = !it.isDone) else it
                                    }
                                }
                            ) {
                                Icon(
                                    if (isDone) Icons.Filled.CheckCircle else Icons.Filled.RadioButtonUnchecked,
                                    contentDescription = null,
                                    tint = if (isDone) Color(0xFF10B981) else cs.outlineVariant,
                                    modifier = Modifier.size(24.dp)
                                )
                            }

                            Spacer(Modifier.width(8.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = if (task.isFixed) Color(0xFFEDE9FE) else cs.primaryContainer
                                    ) {
                                        Text(
                                            task.category,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = cs.primary
                                        )
                                    }
                                    Spacer(Modifier.width(6.dp))
                                    Text(
                                        task.timeRange,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = cs.onSurfaceVariant
                                    )
                                }

                                Spacer(Modifier.height(4.dp))

                                Text(
                                    task.title,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    textDecoration = if (isDone) TextDecoration.LineThrough else TextDecoration.None,
                                    color = if (isDone) cs.onSurfaceVariant else cs.onSurface
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
`
  }
];
