package com.grip.app.budget

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
