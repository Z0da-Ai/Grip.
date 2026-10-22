package com.grip.app.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.grip.app.data.local.entity.TaskEntity
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * EnforcementOverlayCompose
 * Features:
 * - "روح خلّصها" message
 * - ONLY button: "ذكّرني لاحقاً" with escalating hold (10s -> 20s -> 30s)
 * - "أنجزت المهمة مبكراً" with an enforced 2-second continuous press-and-hold!
 * - Hidden 60-second emergency exit
 */
@Composable
fun EnforcementOverlayCompose(
    task: TaskEntity,
    onPostponeSuccess: (freeWindowMinutes: Int) -> Unit,
    onDoneEarly: () -> Unit,
    onEmergencyExit: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()

    // 2-Second Hold State for "Done Early"
    var isHoldingDoneEarly by remember { mutableStateOf(false) }
    var doneEarlyProgress by remember { mutableFloatStateOf(0f) }

    // Escalating friction calculation
    val requiredHoldSecs = when {
        task.postponeCount < 3 -> 10
        task.postponeCount < 6 -> 20
        else -> 30
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xE6090D16))
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Grip",
                    fontWeight = FontWeight.Black,
                    fontSize = 20.sp,
                    color = Color.White
                )
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0x33EF4444)
                ) {
                    Text(
                        text = "شاشة الإنفاذ النشطة",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        color = Color(0xFFFCA5A5),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Central Task Command
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = task.title,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(16.dp))

                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0x336D28D9)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "روح خلّصها",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFFC4B5FD)
                        )
                        Text(
                            text = "لا يوجد زر لبدء المهمة لأنك في وقتها بالفعل.",
                            fontSize = 12.sp,
                            color = Color(0xFF94A3B8),
                            textAlign = TextAlign.Center
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // The only main button: "ذكّرني لاحقاً" — escalating hold (10s -> 20s -> 30s)
                HoldToConfirmButton(
                    label = "ذكّرني لاحقاً (اضغط واستمر ${requiredHoldSecs}ث)",
                    holdMs = requiredHoldSecs * 1000L,
                    color = Color(0xFF4C1D95),
                    fill = Color(0xFF7C3AED),
                    modifier = Modifier.fillMaxWidth(),
                    onConfirmed = { onPostponeSuccess(4) }
                )
            }

            // Bottom Actions: Done Early (Enforced 2s hold)
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Done Early Button with 2-second continuous hold!
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp)
                        .background(Color(0xFF064E3B), RoundedCornerShape(14.dp))
                        .pointerInput(Unit) {
                            detectTapGestures(
                                onPress = {
                                    isHoldingDoneEarly = true
                                    doneEarlyProgress = 0f
                                    val holdJob = coroutineScope.launch {
                                        val totalMs = 2000L
                                        val interval = 40L
                                        var elapsed = 0L
                                        while (elapsed < totalMs) {
                                            delay(interval)
                                            elapsed += interval
                                            doneEarlyProgress = (elapsed.toFloat() / totalMs).coerceIn(0f, 1f)
                                        }
                                        onDoneEarly()
                                    }
                                    tryAwaitRelease()
                                    // If finger is lifted early -> cancel and reset!
                                    holdJob.cancel()
                                    isHoldingDoneEarly = false
                                    doneEarlyProgress = 0f
                                }
                            )
                        },
                    contentAlignment = Alignment.Center
                ) {
                    // Progress fill indicator
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(doneEarlyProgress)
                            .align(Alignment.CenterEnd)
                            .background(Color(0xFF10B981), RoundedCornerShape(14.dp))
                    )

                    Text(
                        text = if (isHoldingDoneEarly)
                            "جاري التأكيد: ${(doneEarlyProgress * 2).format(1)}ث / 2.0ث"
                        else
                            "أنجزت المهمة مبكراً (اضغط واستمر ثانيتين)",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }

                // Always-visible emergency exit (required so the user is never trapped).
                Spacer(modifier = Modifier.height(10.dp))
                HoldToConfirmButton(
                    label = "خروج طارئ (اضغط 5 ثوانٍ)",
                    holdMs = 5000L,
                    color = Color(0x33FFFFFF),
                    fill = Color(0x66EF4444),
                    modifier = Modifier.fillMaxWidth(0.7f),
                    height = 44,
                    onConfirmed = onEmergencyExit
                )
            }
        }
    }
}

/** Press-and-hold button: fills while held, confirms when full, resets if released early. */
@Composable
private fun HoldToConfirmButton(
    label: String,
    holdMs: Long,
    color: Color,
    fill: Color,
    modifier: Modifier = Modifier,
    height: Int = 54,
    onConfirmed: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var progress by remember { mutableFloatStateOf(0f) }
    Box(
        modifier = modifier
            .height(height.dp)
            .background(color, RoundedCornerShape(14.dp))
            .pointerInput(holdMs) {
                detectTapGestures(
                    onPress = {
                        val job = scope.launch {
                            var elapsed = 0L
                            while (elapsed < holdMs) {
                                delay(40)
                                elapsed += 40
                                progress = (elapsed.toFloat() / holdMs).coerceIn(0f, 1f)
                            }
                            onConfirmed()
                        }
                        tryAwaitRelease()
                        job.cancel()
                        progress = 0f
                    }
                )
            },
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .fillMaxWidth(progress)
                .align(Alignment.CenterEnd)
                .background(fill, RoundedCornerShape(14.dp))
        )
        Text(
            text = label,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp
        )
    }
}

private fun Float.format(digits: Int) = "%.1f".format(this)
