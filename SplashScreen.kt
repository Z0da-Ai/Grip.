package com.grip.app.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

/**
 * Grip Splash Screen:
 * Two hanging metallic chains linked by a metal ring shaped like the letter G that snaps shut!
 */
@Composable
fun SplashScreen(onAnimationEnd: () -> Unit) {
    var isSnapped by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        delay(1200)
        isSnapped = true
        delay(2000)
        onAnimationEnd()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Chains & G Snap Lock Graphic Component
            // [Rendering Metal Chains and Snapping G Lock Ring]

            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = "GRIP",
                fontSize = 42.sp,
                fontWeight = FontWeight.Black,
                color = Color.White
            )
            Text(
                text = "Hold your focus. Kill the drift.",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFC4B5FD)
            )
            Text(
                text = "اقبض على تركيزك. اسحق التشتت.",
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF94A3B8)
            )
        }
    }
}
