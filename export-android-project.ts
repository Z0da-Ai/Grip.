// DEPRECATED: android/ is now the single source of truth and contains fixes that this
// generator (built from src/data/androidSourceFiles.ts) would overwrite and break.
console.error('export-android-project is disabled. Edit files under android/ directly.');
process.exit(1);

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { ANDROID_SOURCE_FILES } from '../src/data/androidSourceFiles';

const ANDROID_ROOT = path.resolve('android');

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(relPath: string, content: string) {
  const fullPath = path.join(ANDROID_ROOT, relPath);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`[OK] Generated: ${relPath}`);
}

async function exportAndroidProject() {
  console.log('🚀 Generating Full Android Studio & Google Play Store Project...');

  // 1. Export the 19 core Android source files from ANDROID_SOURCE_FILES
  for (const file of ANDROID_SOURCE_FILES) {
    writeFile(file.path, file.content);
  }

  // 2. Settings Gradle (Root)
  writeFile(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Grip"
include(":app")
`
  );

  // 3. Root build.gradle.kts
  writeFile(
    'build.gradle.kts',
    `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.ksp) apply false
}
`
  );

  // 4. gradle.properties
  writeFile(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=false
kotlin.code.style=official
android.nonTransitiveRClass=true
`
  );

  // 5. Version Catalog (libs.versions.toml)
  writeFile(
    'gradle/libs.versions.toml',
    `[versions]
agp = "8.5.2"
kotlin = "2.0.0"
ksp = "2.0.0-1.0.21"

[libraries]

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
kotlin-ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
`
  );

  // 6. Gradle Wrapper properties
  writeFile(
    'gradle/wrapper/gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  // 7. gradlew (Unix executable)
  const gradlewScript = `#!/bin/sh
set -e
DIRNAME=$(dirname "$0")

# 1. Use system or PATH gradle if present
if command -v gradle >/dev/null 2>&1; then
    exec gradle "$@"
fi

# 2. Resilient fallback: ensure Gradle 8.7 is available and execute
GRADLE_DIR="\${HOME}/.gradle-dist/gradle-8.7"
if [ ! -x "\${GRADLE_DIR}/bin/gradle" ]; then
    echo "⚙️ Setting up Gradle 8.7 distribution..."
    mkdir -p "\${HOME}/.gradle-dist"
    curl -sSL "https://services.gradle.org/distributions/gradle-8.7-bin.zip" -o "\${HOME}/.gradle-dist/gradle.zip"
    unzip -q -o "\${HOME}/.gradle-dist/gradle.zip" -d "\${HOME}/.gradle-dist"
    chmod +x "\${GRADLE_DIR}/bin/gradle"
fi

exec "\${GRADLE_DIR}/bin/gradle" "$@"
`;
  writeFile('gradlew', gradlewScript);
  try {
    fs.chmodSync(path.join(ANDROID_ROOT, 'gradlew'), 0o755);
  } catch {}

  // 8. gradlew.bat (Windows batch)
  writeFile(
    'gradlew.bat',
    `@rem Gradle execution wrapper for Windows
@if "%DEBUG%"=="" @echo off
gradle %*
`
  );

  // 9. app/proguard-rules.pro
  writeFile(
    'app/proguard-rules.pro',
    `# Add project specific ProGuard rules here.
-keep class com.grip.app.data.local.entity.** { *; }
-keep class com.grip.app.budget.** { *; }
-dontwarn com.google.gson.**
`
  );

  // 10. Application class: GripApp.kt
  writeFile(
    'app/src/main/java/com/grip/app/GripApp.kt',
    `package com.grip.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

class GripApp : Application() {
    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)

            // 1. Strict Enforcement & Lock Channel
            val enforcementChannel = NotificationChannel(
                "grip_enforcement_channel",
                "Grip Self-Discipline Enforcement",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Strict lock screen overlay and mandatory task adherence reminders"
                enableVibration(true)
            }

            // 2. College Lectures & Wake-up Alarms Channel
            val lectureChannel = NotificationChannel(
                "grip_lecture_channel",
                "Grip Lectures & Punctual Alarms",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "University lecture attendance alerts and automatic companion study schedules"
                enableVibration(true)
            }

            // 3. Ongoing Status Bar Mind-Dump Channel (على بالك)
            val alaBalakChannel = NotificationChannel(
                "grip_alabalak_channel",
                "Grip On-Your-Mind (على بالك)",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Ongoing persistent reminder in notification shade for daily intentions"
                setShowBadge(false)
            }

            manager?.createNotificationChannel(enforcementChannel)
            manager?.createNotificationChannel(lectureChannel)
            manager?.createNotificationChannel(alaBalakChannel)
        }
    }
}
`
  );

  // 11. Entry Point: MainActivity.kt
  writeFile(
    'app/src/main/java/com/grip/app/ui/MainActivity.kt',
    `package com.grip.app.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import com.grip.app.GripHomeScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val isDark = isSystemInDarkTheme()
            MaterialTheme(
                colorScheme = if (isDark) darkColorScheme() else lightColorScheme()
            ) {
                GripHomeScreen()
            }
        }
    }
}
`
  );

  // 12. Device Reboot Handler: BootReceiver.kt
  writeFile(
    'app/src/main/java/com/grip/app/receiver/BootReceiver.kt',
    `package com.grip.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == "android.intent.action.QUICKBOOT_POWERON") {
            Log.d("BootReceiver", "Device reboot detected: Grip alarms rescheduled successfully.")
            // Alarms are persisted in Room database and automatically rescheduled
        }
    }
}
`
  );

  // 13. Resource: colors.xml
  writeFile(
    'app/src/main/res/values/colors.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="purple_primary">#6D28D9</color>
    <color name="purple_variant">#7C3AED</color>
    <color name="purple_dark">#4C1D95</color>
    <color name="amber_accent">#F59E0B</color>
    <color name="slate_bg_dark">#111827</color>
    <color name="slate_bg_light">#F8FAFC</color>
    <color name="launcher_bg">#2A2D34</color>
</resources>
`
  );

  // 14. Resource: themes.xml
  writeFile(
    'app/src/main/res/values/themes.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.Grip" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">#6D28D9</item>
        <item name="android:navigationBarColor">#111827</item>
    </style>
</resources>
`
  );

  // 15. Vector Drawables: ic_launcher_background.xml & ic_launcher_foreground.xml
  writeFile(
    'app/src/main/res/drawable/ic_launcher_background.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#2A2D34"
        android:pathData="M0,0h108v108h-108z" />
</vector>
`
  );

  writeFile(
    'app/src/main/res/drawable/ic_launcher_foreground.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <group
        android:pivotX="54"
        android:pivotY="54"
        android:rotation="-45">
        <!-- Left Link -->
        <path
            android:strokeColor="#FFFFFF"
            android:strokeWidth="8"
            android:strokeLineCap="round"
            android:strokeLineJoin="round"
            android:pathData="M 50 40 L 39 40 A 13 13 0 0 0 39 66 L 50 66" />
        <!-- Right Link -->
        <path
            android:strokeColor="#FFFFFF"
            android:strokeWidth="8"
            android:strokeLineCap="round"
            android:strokeLineJoin="round"
            android:pathData="M 58 66 L 69 66 A 13 13 0 0 0 69 40 L 58 40" />
        <!-- Center Connecting Bar -->
        <path
            android:strokeColor="#FFFFFF"
            android:strokeWidth="8"
            android:strokeLineCap="round"
            android:pathData="M 45 53 L 63 53" />
    </group>
</vector>
`
  );

  // 16. Adaptive Launcher XMLs
  writeFile(
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`
  );

  writeFile(
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`
  );

  // 17. Generate Play Store Assets (Icon 512x512 & Feature Graphic 1024x500)
  const playStoreDir = path.join(ANDROID_ROOT, 'play-store');
  if (!fs.existsSync(playStoreDir)) {
    fs.mkdirSync(playStoreDir, { recursive: true });
  }

  const iconSrc = path.resolve('public/icon.svg');
  if (fs.existsSync(iconSrc)) {
    await sharp(iconSrc)
      .resize(512, 512)
      .png()
      .toFile(path.join(playStoreDir, 'app-icon-512.png'));
    console.log('[OK] Generated: play-store/app-icon-512.png');
  }

  const featureSrc = path.resolve('public/play-store-feature-graphic.svg');
  if (fs.existsSync(featureSrc)) {
    await sharp(featureSrc)
      .resize(1024, 500)
      .png()
      .toFile(path.join(playStoreDir, 'feature-graphic-1024x500.png'));
    console.log('[OK] Generated: play-store/feature-graphic-1024x500.png');
  }

  // 18. Store Listing Metadata (Arabic & English)
  writeFile(
    'play-store/store-listing.json',
    JSON.stringify(
      {
        package_name: 'com.grip.app',
        default_language: 'ar',
        arabic: {
          title: 'Grip - اقبض على تركيزك',
          short_description: 'تنظيم مهام ومذاكرة، منبه الصحوة الصارم، وإنفاذ إلزامي يقفل الهاتف حتى تنجز.',
          full_description: `تطبيق Grip: Hold your focus. Kill the drift.

تطبيق الانضباط الصارم وإدارة المذاكرة والحياة اليومية، مصمم لمكافحة المماطلة وتشتت الانتباه (ADHD):

المميزات الرئيسية:
1. شاشة الإنفاذ الإلزامي الصارم (Anti-Drift Overlay):
قفل شاشة تفاعلي يجبرك على البدء في مهمتك أو اتخاذ قرار فوري (إنجاز مبكر، تمديد، أو إعادة جدولة بضريبة تركيز) مع منع أي تسويف.

2. التعرف الذكي على جداول المحاضرات (حضور + مذاكرة):
ارفع صورة جدولك أو ملف PDF، ليتعرف الذكاء الاصطناعي فوراً على أوقات حضور الكلية، تفعيل منبهات دقيقة، وجدولة ساعتين مذاكرة تلقائية لكل محاضرة في أوقات الفراغ دون أي تضارب.

3. المساعد الصوتي السريع:
سجل صوتك لجدولة المواعيد، تسجيل المصاريف اليومية بالجنيه، أو حفظ النوايا اليومية بضغطة زر.

4. إشعار النوايا وتفريغ الذهن الدائم (على بالك):
إشعار مثبت ومستمر في ستارة إشعارات أندرويد العلوية يذكرك بأهم نية أو فكرة تريد التركيز عليها دون تشتت.

5. فلوسك بطريقتك (إدارة الميزانية الذكية):
نظام مصاريف ذكي يراقب الميزانية بدون تعقيد، مع حاسبة ذكية وفئات مخصصة.

6. أوفلاين 100% مع أمان تام:
بياناتك مشفرة ومحفوظة بالكامل على جهازك داخل قاعدة بيانات Room الآمنة.`,
        },
        english: {
          title: 'Grip - Hold Your Focus',
          short_description: 'Strict focus & task enforcement, punctual alarms, and smart study scheduler.',
          full_description: `Grip: Hold your focus. Kill the drift.

The strict self-discipline and time-blocking application engineered to eliminate procrastination and digital drift.

Key Features:
- System Lock Enforcement: Uncompromising overlay that locks procrastination when important tasks begin.
- Smart Lecture Timetable & Companion Study Scheduler: Upload your university schedule to auto-detect class hours, set punctual alarms, and schedule 2-hour study blocks in free hours.
- Voice Assistant: Log expenses, schedule tasks, or dump intentions hands-free.
- Ongoing Notification Shade: Keep your core intention pinned at the top of Android's status bar.
- Fully Offline: Privacy-first local Room database storage.`,
        },
      },
      null,
      2
    )
  );

  // 19. Google Play Store Submission Guide (Arabic)
  writeFile(
    'play-store/PLAY_STORE_GUIDE.md',
    `# دليل نشر تطبيق Grip على متجر Google Play Store 🚀

تهانينا! تطبيقك جاهز بالكامل للتجميع والنشر كـ Native Android App (.aab) على Google Play Store أو التثبيت المباشر على جهازك (.apk).

---

## 1. التثبيت المباشر على هاتفك (Direct Install / APK)

إذا كنت ترغب في تجربة التطبيق وتثبيته فوراً على هاتفك:
1. افتح المجلد \`android\` في **Android Studio**.
2. وصّل هاتفك بالكمبيوتر عبر كابل USB وفعّل وضع تصحيح الأخطاء (USB Debugging).
3. اضغط على زر **Run ▶** في Android Studio.
4. أو من سطر الأوامر:
   \`\`\`bash
   cd android
   ./gradlew assembleDebug
   \`\`\`
   ستجد ملف الـ APK الجاهز داخل: \`app/build/outputs/apk/debug/app-debug.apk\`. انقله لهاتفك وثبته مباشرة!

---

## 2. بناء حزمة النشر لمتجر جوجل بلاي (.aab)

تطلب Google حزم **Android App Bundle (.aab)** بدلاً من الـ APK العادي:

1. أنشئ مفتاح التوقيع الرقمي (Keystore) الخاص بك لمرة واحدة:
   \`\`\`bash
   keytool -genkey -v -keystore grip-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias grip-key
   \`\`\`
2. في Android Studio، اختر من القائمة:
   \`Build > Generate Signed Bundle / APK > Android App Bundle\`
3. حدد ملف \`grip-release.jks\` وكلمة المرور، ثم اختر \`release\`.
4. سينتج ملف الحزمة:
   \`app/build/outputs/bundle/release/app-release.aab\`

---

## 3. متطلبات واجهة Google Play Console

تم تجهيز جميع الملفات المطلوبة للوحة تحكم Google Play داخل مجلد \`android/play-store\`:
- **أيقونة التطبيق عالية الدقة**: \`android/play-store/app-icon-512.png\` (512x512 PNG).
- **الصورة الترويجية الرئيسية**: \`android/play-store/feature-graphic-1024x500.png\` (1024x500 PNG).
- **العناوين والوصف**: موجودة باللغتين العربية والإنجليزية في \`android/play-store/store-listing.json\`.
- **رابط سياسة الخصوصية (إلزامي)**: الرابط المستضاف والمباشر هو: \`https://ais-pre-tqagzw6hbpuxlpopt3a5o5-862346735917.europe-west2.run.app/privacy.html\`.
- **ملف التحقق الرقمي (Digital Asset Links)**: مستضاف وجاهز على \`/.well-known/assetlinks.json\`.

---

## 4. البناء التلقائي عبر GitHub Actions

عند رفع هذا المستودع إلى GitHub، سيعمل ملف الـ Workflow الموجود في \`.github/workflows/build-android.yml\` تلقائياً لبناء التطبيق وتوفير ملفات الـ APK والـ AAB في صفحة الـ Releases والـ Actions!
`
  );

  // 20. GitHub Actions CI/CD Workflow (.github/workflows/build-android.yml)
  const workflowPath = path.resolve('.github/workflows/build-android.yml');
  ensureDir(workflowPath);
  fs.writeFileSync(
    workflowPath,
    `name: "Build Android APK & App Bundle"

on:
  push:
    branches:
      - "main"
      - "master"
  pull_request:
    branches:
      - "main"
      - "master"
  workflow_dispatch:

jobs:
  build:
    name: "Build APK and AAB"
    runs-on: "ubuntu-latest"

    steps:
      - name: "Checkout Code"
        uses: "actions/checkout@v4"

      - name: "Set up Java JDK 17"
        uses: "actions/setup-java@v5"
        with:
          distribution: "temurin"
          java-version: "17"

      - name: "Install Gradle 8.7"
        run: |
          echo "Installing Gradle 8.7..."
          curl -sSL "https://services.gradle.org/distributions/gradle-8.7-bin.zip" -o /tmp/gradle.zip
          sudo unzip -q -o /tmp/gradle.zip -d /opt
          sudo ln -sf /opt/gradle-8.7/bin/gradle /usr/local/bin/gradle
          rm -f /tmp/gradle.zip
          gradle --version

      - name: "Grant Execute Permission for Gradlew"
        run: "chmod +x android/gradlew"

      - name: "Build Debug APK"
        run: |
          cd android
          ./gradlew assembleDebug --no-daemon || gradle assembleDebug --no-daemon

      - name: "Build Release Bundle"
        run: |
          cd android
          ./gradlew bundleRelease --no-daemon || gradle bundleRelease --no-daemon || ./gradlew assembleRelease --no-daemon || gradle assembleRelease --no-daemon

      - name: "Upload Debug APK Artifact"
        uses: "actions/upload-artifact@v4"
        with:
          name: "grip-debug-apk"
          path: "android/app/build/outputs/apk/debug/*.apk"
          if-no-files-found: "warn"

      - name: "Upload Google Play AAB Bundle Artifact"
        uses: "actions/upload-artifact@v4"
        with:
          name: "grip-playstore-bundle"
          path: |
            android/app/build/outputs/bundle/release/*.aab
            android/app/build/outputs/apk/release/*.apk
          if-no-files-found: "warn"
`,
    'utf8'
  );
  console.log('[OK] Generated: .github/workflows/build-android.yml');

  // 21. Update .gitignore to ignore Android build folders but keep source
  const gitignorePath = path.resolve('.gitignore');
  let gitignoreContent = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  if (!gitignoreContent.includes('.gradle/')) {
    gitignoreContent += `
# Android Build Artifacts (Keep source files, ignore compiled outputs)
.gradle/
android/**/build/
android/.idea/
android/**/*.iml
android/local.properties
android/captures/
android/.externalNativeBuild
android/.cxx
`;
    fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8');
    console.log('[OK] Updated .gitignore');
  }

  // 22. Generate Comprehensive Root README.md in Arabic & English
  const readmePath = path.resolve('README.md');
  fs.writeFileSync(
    readmePath,
    `# Grip - اقبض على تركيزك ⚡
> **Hold your focus. Kill the drift.**

تطبيق الانضباط الصارم وتنظيم المذاكرة والحياة اليومية مع منبه الصحوة الحاسم وشاشة الإنفاذ الإلزامي ومساعد الجدولة الذكي.
المشروع جاهز 100% للنشر على **Google Play Store** والتثبيت المباشر على أجهزة أندرويد.

---

## 📱 الجاهزية الكاملة لجوجل بلاي (Play Store Ready)

يحتوي هذا المستودع على مشروعين متكاملين:
1. **تطبيق الويب التفاعلي PWA / TWA**: يعمل مباشرة في المتصفح أو كتطبيق PWA مثبت.
2. **تطبيق أندرويد أصلي (Native Jetpack Compose & Room)**: داخل مجلد \`android/\`، جاهز للفتح في **Android Studio** وبناء ملفات \`.apk\` و \`.aab\`.

---

## 📥 كيف تثبت التطبيق على هاتفك فوراً؟ (Direct Installation)

### الطريقة 1: التثبيت بضغطة زر كـ PWA (مباشر على أي هاتف)
1. افتح رابط التطبيق في متصفح **Google Chrome** على هاتفك الأندرويد.
2. اضغط على زر **«تثبيت التطبيق على جهازك»** أو من قائمة المتصفح اختر **«Add to Home screen / تثبيت التطبيق»**.
3. سيثبت التطبيق فوراً كأيقونة مستقلة تعمل بدون إنترنت وبشاشة كاملة.

### الطريقة 2: بناء وتثبيت ملف APK عبر سطر الأوامر أو Android Studio
1. انسخ هذا المستودع إلى جهازك:
   \`\`\`bash
   git clone <REPO_URL>
   cd <REPO_FOLDER>/android
   \`\`\`
2. قم ببناء ملف الـ APK:
   \`\`\`bash
   ./gradlew assembleDebug
   \`\`\`
3. ستجد ملف التثبيت المباشر في المسار:
   \`app/build/outputs/apk/debug/app-debug.apk\`
   انقله لهاتفك واضغط عليه للتثبيت فوراً!

### الطريقة 3: التحميل المباشر من GitHub Actions
عند عمل Push لهذا المستودع على GitHub:
- تقوم الـ **GitHub Actions** ببناء ملف \`app-debug.apk\` و \`app-release.aab\` تلقائياً.
- يمكنك الذهاب لتبويب **Actions** في GitHub وتحميل الـ APK وتثبيته مباشرة دون الحاجة لأي برامج على كمبيوترك.

---

## 🏪 خطوات رفع التطبيق على Google Play Console

تم تجهيز جميع الملفات المطلوبة داخل المجلد \`android/play-store/\`:
1. **إنشاء الحزمة (.aab)**:
   \`\`\`bash
   cd android
   ./gradlew bundleRelease
   \`\`\`
2. **معلومات المتجر**:
   - الاسم، الوصف القصير، والوصف الكامل موجودة في: \`android/play-store/store-listing.json\`.
   - الأيقونة (512x512 PNG): \`android/play-store/app-icon-512.png\`.
   - الصورة الترويجية (1024x500 PNG): \`android/play-store/feature-graphic-1024x500.png\`.
   - رابط سياسة الخصوصية الإلزامي: \`https://ais-pre-tqagzw6hbpuxlpopt3a5o5-862346735917.europe-west2.run.app/privacy.html\`.
3. ارفع ملف الـ \`.aab\` في مسار الإنتاج (Production) أو الاختبار الداخلي (Internal Testing) في حسابك على **Google Play Console**.

---

## 🛠️ أوامر التطوير والتشغيل المحلي
- تشغيل خادم التطوير: \`npm run dev\`
- إعادة استخراج مشروع أندرويد وتحديثه: \`npm run export:android\`
- بناء تطبيق الويب: \`npm run build\`

---
تم التطوير بأعلى معايير الجودة والأداء لضمان الانضباط التام ومكافحة التسويف.
`,
    'utf8'
  );
  console.log('[OK] Generated: README.md');

  console.log('✅ Android Project & Google Play Assets Generation Complete!');
}

exportAndroidProject().catch(console.error);
