package com.grip.app

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
                            "مهام اليوم (${tasks.size})",
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
