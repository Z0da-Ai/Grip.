package com.grip.app.budget

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
