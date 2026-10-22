package com.grip.app.data.local.dao

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
}
