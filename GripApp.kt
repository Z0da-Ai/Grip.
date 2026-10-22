package com.grip.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

class GripApp : Application() {
    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)

            // 1. Strict Enforcement & Lock Channel
            val enforcementChannel = NotificationChannel(
                "grip_enforcement_channel",
                "Grip Self-Discipline Enforcement",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Strict lock screen overlay and mandatory task adherence reminders"
                enableVibration(true)
            }

            // 2. College Lectures & Wake-up Alarms Channel
            val lectureChannel = NotificationChannel(
                "grip_lecture_channel",
                "Grip Lectures & Punctual Alarms",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "University lecture attendance alerts and automatic companion study schedules"
                enableVibration(true)
            }

            // 3. Ongoing Status Bar Mind-Dump Channel (على بالك)
            val alaBalakChannel = NotificationChannel(
                "grip_alabalak_channel",
                "Grip On-Your-Mind (على بالك)",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Ongoing persistent reminder in notification shade for daily intentions"
                setShowBadge(false)
            }

            manager?.createNotificationChannel(enforcementChannel)
            manager?.createNotificationChannel(lectureChannel)
            manager?.createNotificationChannel(alaBalakChannel)
        }
    }
}
