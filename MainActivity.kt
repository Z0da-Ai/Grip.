package com.grip.app.ui

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.grip.app.HomeScreen
import com.grip.app.ui.screens.SplashScreen
import com.grip.app.util.GripAlarmScheduler

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val isDark = isSystemInDarkTheme()
            MaterialTheme(colorScheme = if (isDark) darkColorScheme() else lightColorScheme()) {
                var showSplash by remember { mutableStateOf(true) }
                if (showSplash) {
                    SplashScreen(onAnimationEnd = { showSplash = false })
                } else {
                    Column(Modifier.fillMaxSize().statusBarsPadding()) {
                        PermissionsCard()
                        Box(Modifier.weight(1f)) { HomeScreen() }
                    }
                }
            }
        }
    }
}

/**
 * Asks for the three things Grip needs, one at a time, with a plain-language explanation
 * (Google Play requires a clear in-app disclosure before sending people to the overlay setting).
 * The card disappears once everything is granted.
 */
@Composable
private fun PermissionsCard() {
    val context = LocalContext.current
    var overlayOk by remember { mutableStateOf(Settings.canDrawOverlays(context)) }
    var exactOk by remember { mutableStateOf(GripAlarmScheduler.canScheduleExact(context)) }
    var notifOk by remember {
        mutableStateOf(
            Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
                android.content.pm.PackageManager.PERMISSION_GRANTED
        )
    }
    var showDisclosure by remember { mutableStateOf(false) }

    val notifLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
        notifOk = it
    }

    // Re-check when the user comes back from the system settings screens.
    val activity = context as ComponentActivity
    DisposableEffect(activity) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                overlayOk = Settings.canDrawOverlays(context)
                exactOk = GripAlarmScheduler.canScheduleExact(context)
            }
        }
        activity.lifecycle.addObserver(observer)
        onDispose { activity.lifecycle.removeObserver(observer) }
    }

    if (overlayOk && exactOk && notifOk) return

    Card(Modifier.fillMaxWidth().padding(12.dp)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("خطوات التفعيل", style = MaterialTheme.typography.titleMedium)
            if (!notifOk) {
                Text("1) الإشعارات: لتنبيهك بموعد المهام.")
                Button(onClick = {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        notifLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    }
                }) { Text("السماح بالإشعارات") }
            }
            if (!exactOk) {
                Text("2) المنبهات الدقيقة: لتبدأ المهمة في ثانيتها بالضبط.")
                Button(onClick = {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        context.startActivity(
                            Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}"))
                        )
                    }
                }) { Text("السماح بالمنبهات الدقيقة") }
            }
            if (!overlayOk) {
                Text("3) الظهور فوق التطبيقات: لعرض شاشة التذكير عند موعد المهمة.")
                Button(onClick = { showDisclosure = true }) { Text("تفعيل شاشة التذكير") }
            }
        }
    }

    if (showDisclosure) {
        AlertDialog(
            onDismissRequest = { showDisclosure = false },
            title = { Text("إذن الظهور فوق التطبيقات") },
            text = {
                Text(
                    "Grip يعرض شاشة تذكير كاملة فوق التطبيقات الأخرى عند بدء مهمة مجدولة، " +
                        "لمساعدتك على البدء بدل التسويف. لا يقرأ التطبيق ما تفعله في تطبيقات أخرى ولا يجمع " +
                        "أي بيانات من خلال هذا الإذن. يمكنك إغلاق الشاشة في أي وقت بزر «خروج طارئ»، " +
                        "وسحب الإذن من إعدادات الهاتف متى شئت."
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    showDisclosure = false
                    context.startActivity(
                        Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
                    )
                }) { Text("موافق، افتح الإعدادات") }
            },
            dismissButton = { TextButton(onClick = { showDisclosure = false }) { Text("لاحقاً") } }
        )
    }
}
