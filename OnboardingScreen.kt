package com.grip.app.ui.onboarding

import android.content.Context
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

// 1. Local Jetpack DataStore persistence to ensure Onboarding runs ONCE
val Context.dataStore by preferencesDataStore(name = "grip_preferences")

class OnboardingViewModel(private val context: Context) : ViewModel() {
    companion object {
        val ONBOARDING_COMPLETED_KEY = booleanPreferencesKey("onboarding_completed")
    }

    val isOnboardingCompleted = context.dataStore.data
        .map { prefs -> prefs[ONBOARDING_COMPLETED_KEY] ?: false }
        .stateIn(viewModelScope, SharingStarted.Eagerly, false)

    fun markOnboardingCompleted(onFinished: () -> Unit) {
        viewModelScope.launch {
            context.dataStore.edit { prefs ->
                prefs[ONBOARDING_COMPLETED_KEY] = true
            }
            onFinished()
        }
    }
}

data class OnboardingPage(
    val title: String,
    val description: String,
    val icon: ImageVector,
    val badge: String,
    val accentColor: Color
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun OnboardingScreen(
    onFinishOnboarding: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val viewModel = remember { OnboardingViewModel(context) }

    val pages = remember {
        listOf(
            OnboardingPage(
                title = "قاهر التسويف الأكاديمي الصارم",
                description = "تطبيق أندرويد حقيقي مُصمم لجعل التسويف أصعب بكثير من أداء المهمة نفسها، عبر الإنفاذ الإلزامي وحظر المشتتات.",
                icon = Icons.Default.Lock,
                badge = "النظام الصارم 🛡️",
                accentColor = Color(0xFF6D28D9)
            ),
            OnboardingPage(
                title = "ذكاء اصطناعي محلي وتفكيك المهام",
                description = "سجّل صوتك أو أفكارك لتحويلها تلقائياً إلى مهام مجدولة ومقسمة (Offline AI Chunking) متوافقة مع جداولك.",
                icon = Icons.Default.Mic,
                badge = "صوتي وذكي 🎙️",
                accentColor = Color(0xFF2563EB)
            ),
            OnboardingPage(
                title = "سلم الاحتجاز والنافذة الحرة",
                description = "التأجيل يتطلب ضغطاً مستمراً (10ث، 20ث، 30ث). وبعدها تحصل على نافذة حرة محددة بدقائق قبل عودة المنع تلقائياً.",
                icon = Icons.Default.Timer,
                badge = "احتكاك تصاعدي ⏱️",
                accentColor = Color(0xFFD97706)
            ),
            OnboardingPage(
                title = "تقويم الساعات مع التقويم الهجري",
                description = "جدولة دقيقة بنمط Google Calendar مع بطاقات دائرية الحواف ودعم كامل ومزدوج للتقويمين الهجري والميلادي.",
                icon = Icons.Default.CalendarMonth,
                badge = "هجري وميلادي 🌙",
                accentColor = Color(0xFF059669)
            )
        )
    }

    val pagerState = rememberPagerState(pageCount = { pages.size })

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Indicator of current page
                Text(
                    text = "${pagerState.currentPage + 1} / ${pages.size}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                // Skip / 'I Know' button that permanently saves flag to DataStore
                TextButton(
                    onClick = {
                        viewModel.markOnboardingCompleted(onFinishOnboarding)
                    }
                ) {
                    Text(
                        text = "تخطي / أعرف النظام",
                        color = Color(0xFF7C3AED),
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }
            }
        },
        bottomBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterVertically,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Material 3 Animated Pill Indicators
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    repeat(pages.size) { index ->
                        val isSelected = pagerState.currentPage == index
                        val width by animateDpAsState(
                            targetValue = if (isSelected) 28.dp else 8.dp,
                            animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
                            label = "pill_width"
                        )
                        val color by animateColorAsState(
                            targetValue = if (isSelected) pages[index].accentColor else MaterialTheme.colorScheme.outlineVariant,
                            label = "pill_color"
                        )

                        Box(
                            modifier = Modifier
                                .height(8.dp)
                                .width(width)
                                .clip(CircleShape)
                                .background(color)
                        )
                    }
                }

                // Next or Get Started Button
                Button(
                    onClick = {
                        if (pagerState.currentPage < pages.size - 1) {
                            coroutineScope.launch {
                                pagerState.animateScrollToPage(pagerState.currentPage + 1)
                            }
                        } else {
                            viewModel.markOnboardingCompleted(onFinishOnboarding)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = pages[pagerState.currentPage].accentColor
                    )
                ) {
                    Text(
                        text = if (pagerState.currentPage == pages.size - 1) "ابدأ الانضباط الآن 🚀" else "التالي",
                        fontWeight = FontWeight.Black,
                        fontSize = 16.sp
                    )
                }
            }
        }
    ) { innerPadding ->
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) { pageIndex ->
            val page = pages[pageIndex]

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Interactive Interactive Simulation Graphic
                InteractivePageGraphic(pageIndex = pageIndex, accentColor = page.accentColor)

                Spacer(modifier = Modifier.height(32.dp))

                // Badge
                Surface(
                    color = page.accentColor.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = page.badge,
                        color = page.accentColor,
                        fontWeight = FontWeight.Black,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Title
                Text(
                    text = page.title,
                    fontWeight = FontWeight.Black,
                    fontSize = 24.sp,
                    textAlign = TextAlign.Center,
                    lineHeight = 32.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Description
                Text(
                    text = page.description,
                    fontWeight = FontWeight.Medium,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    lineHeight = 22.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

/**
 * Interactive visual element simulating feature mechanics (Voice, AI chunking, Hold, Calendar)
 */
@Composable
private fun InteractivePageGraphic(pageIndex: Int, accentColor: Color) {
    val infiniteTransition = rememberInfiniteTransition(label = "graphic_animation")

    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_scale"
    )

    Box(
        modifier = Modifier
            .size(190.dp)
            .scale(pulseScale)
            .clip(RoundedCornerShape(36.dp))
            .background(
                Brush.radialGradient(
                    colors = listOf(accentColor.copy(alpha = 0.25f), Color.Transparent)
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier.size(130.dp),
            shape = RoundedCornerShape(32.dp),
            color = accentColor.copy(alpha = 0.18f),
            shadowElevation = 8.dp
        ) {
            Box(contentAlignment = Alignment.Center) {
                when (pageIndex) {
                    0 -> Icon(Icons.Default.Shield, contentDescription = null, tint = accentColor, modifier = Modifier.size(64.dp))
                    1 -> Icon(Icons.Default.GraphicEq, contentDescription = null, tint = accentColor, modifier = Modifier.size(64.dp))
                    2 -> Icon(Icons.Default.HourglassBottom, contentDescription = null, tint = accentColor, modifier = Modifier.size(64.dp))
                    else -> Icon(Icons.Default.EventAvailable, contentDescription = null, tint = accentColor, modifier = Modifier.size(64.dp))
                }
            }
        }
    }
}
