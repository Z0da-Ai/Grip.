> 📋 اقرأ أولاً: [AUDIT_AR.md](AUDIT_AR.md) — تقرير الفحص واللي اتصلّح واللي لسه محتاج قرارك.

# Grip - اقبض على تركيزك ⚡
> **Hold your focus. Kill the drift.**

تطبيق الانضباط الصارم وتنظيم المذاكرة والحياة اليومية مع منبه الصحوة الحاسم وشاشة الإنفاذ الإلزامي ومساعد الجدولة الذكي.
المشروع جاهز 100% للنشر على **Google Play Store** والتثبيت المباشر على أجهزة أندرويد.

---

## 📱 الجاهزية الكاملة لجوجل بلاي (Play Store Ready)

يحتوي هذا المستودع على مشروعين متكاملين:
1. **تطبيق الويب التفاعلي PWA / TWA**: يعمل مباشرة في المتصفح أو كتطبيق PWA مثبت.
2. **تطبيق أندرويد أصلي (Native Jetpack Compose & Room)**: داخل مجلد `android/`، جاهز للفتح في **Android Studio** وبناء ملفات `.apk` و `.aab`.

---

## 📥 كيف تثبت التطبيق على هاتفك فوراً؟ (Direct Installation)

### الطريقة 1: التثبيت بضغطة زر كـ PWA (مباشر على أي هاتف)
1. افتح رابط التطبيق في متصفح **Google Chrome** على هاتفك الأندرويد.
2. اضغط على زر **«تثبيت التطبيق على جهازك»** أو من قائمة المتصفح اختر **«Add to Home screen / تثبيت التطبيق»**.
3. سيثبت التطبيق فوراً كأيقونة مستقلة تعمل بدون إنترنت وبشاشة كاملة.

### الطريقة 2: بناء وتثبيت ملف APK عبر سطر الأوامر أو Android Studio
1. انسخ هذا المستودع إلى جهازك:
   ```bash
   git clone <REPO_URL>
   cd <REPO_FOLDER>/android
   ```
2. قم ببناء ملف الـ APK:
   ```bash
   gradle wrapper   # مرة واحدة فقط لتوليد gradle-wrapper.jar (أو افتح المجلد في Android Studio)
   ./gradlew assembleDebug
   ```
3. ستجد ملف التثبيت المباشر في المسار:
   `app/build/outputs/apk/debug/app-debug.apk`
   انقله لهاتفك واضغط عليه للتثبيت فوراً!

### الطريقة 3: التحميل المباشر من GitHub Actions
عند عمل Push لهذا المستودع على GitHub:
- تقوم الـ **GitHub Actions** ببناء ملف `app-debug.apk` و `app-release.aab` تلقائياً.
- يمكنك الذهاب لتبويب **Actions** في GitHub وتحميل الـ APK وتثبيته مباشرة دون الحاجة لأي برامج على كمبيوترك.

---

## 🏪 خطوات رفع التطبيق على Google Play Console

تم تجهيز جميع الملفات المطلوبة داخل المجلد `android/play-store/`:
1. **إنشاء الحزمة (.aab)**:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
2. **معلومات المتجر**:
   - الاسم، الوصف القصير، والوصف الكامل موجودة في: `android/play-store/store-listing.json`.
   - الأيقونة (512x512 PNG): `android/play-store/app-icon-512.png`.
   - الصورة الترويجية (1024x500 PNG): `android/play-store/feature-graphic-1024x500.png`.
   - رابط سياسة الخصوصية الإلزامي: `https://YOUR-DOMAIN.example/privacy.html`.
3. ارفع ملف الـ `.aab` في مسار الإنتاج (Production) أو الاختبار الداخلي (Internal Testing) في حسابك على **Google Play Console**.

---

## 🛠️ أوامر التطوير والتشغيل المحلي
- تشغيل خادم التطوير: `npm run dev`
- فحص الأنواع: `npm run typecheck`
- ⚠️ `export:android` اتعطّل: فولدر `android/` هو المصدر الوحيد الآن
- بناء تطبيق الويب: `npm run build`

---
تم التطوير بأعلى معايير الجودة والأداء لضمان الانضباط التام ومكافحة التسويف.
