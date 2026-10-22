package com.grip.app.data.local.entity

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
)
