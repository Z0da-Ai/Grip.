package com.grip.app.budget

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
