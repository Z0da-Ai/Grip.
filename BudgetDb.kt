package com.grip.app.budget

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
