package com.grip.app.data.local.dao

import androidx.room.*
import com.grip.app.data.local.entity.LectureEntity
import com.grip.app.data.local.entity.ModuleEntity
import com.grip.app.data.local.entity.TopicEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface StudyDao {
    @Query("SELECT * FROM modules ORDER BY title ASC")
    fun getModulesFlow(): Flow<List<ModuleEntity>>

    @Query("SELECT * FROM lectures WHERE moduleId = :moduleId ORDER BY sequenceOrder ASC")
    fun getLecturesFlow(moduleId: String): Flow<List<LectureEntity>>

    @Query("SELECT * FROM topics WHERE lectureId = :lectureId ORDER BY sequenceOrder ASC")
    fun getTopicsFlow(lectureId: String): Flow<List<TopicEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertModule(module: ModuleEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertLecture(lecture: LectureEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertTopics(topics: List<TopicEntity>)

    @Query("UPDATE topics SET isCompleted = :done WHERE id = :topicId")
    suspend fun setTopicCompleted(topicId: String, done: Boolean)

    @Delete
    suspend fun deleteModule(module: ModuleEntity)
}
