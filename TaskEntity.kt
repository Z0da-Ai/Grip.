package com.grip.app.data.local.entity

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
)
