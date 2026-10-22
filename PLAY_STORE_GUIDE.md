# دليل نشر تطبيق Grip على متجر Google Play Store 🚀

تهانينا! تطبيقك جاهز بالكامل للتجميع والنشر كـ Native Android App (.aab) على Google Play Store أو التثبيت المباشر على جهازك (.apk).

---

## 1. التثبيت المباشر على هاتفك (Direct Install / APK)

إذا كنت ترغب في تجربة التطبيق وتثبيته فوراً على هاتفك:
1. افتح المجلد `android` في **Android Studio**.
2. وصّل هاتفك بالكمبيوتر عبر كابل USB وفعّل وضع تصحيح الأخطاء (USB Debugging).
3. اضغط على زر **Run ▶** في Android Studio.
4. أو من سطر الأوامر:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   ستجد ملف الـ APK الجاهز داخل: `app/build/outputs/apk/debug/app-debug.apk`. انقله لهاتفك وثبته مباشرة!

---

## 2. بناء حزمة النشر لمتجر جوجل بلاي (.aab)

تطلب Google حزم **Android App Bundle (.aab)** بدلاً من الـ APK العادي:

1. أنشئ مفتاح التوقيع الرقمي (Keystore) الخاص بك لمرة واحدة:
   ```bash
   keytool -genkey -v -keystore grip-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias grip-key
   ```
2. في Android Studio، اختر من القائمة:
   `Build > Generate Signed Bundle / APK > Android App Bundle`
3. حدد ملف `grip-release.jks` وكلمة المرور، ثم اختر `release`.
4. سينتج ملف الحزمة:
   `app/build/outputs/bundle/release/app-release.aab`

---

## 3. متطلبات واجهة Google Play Console

تم تجهيز جميع الملفات المطلوبة للوحة تحكم Google Play داخل مجلد `android/play-store`:
- **أيقونة التطبيق عالية الدقة**: `android/play-store/app-icon-512.png` (512x512 PNG).
- **الصورة الترويجية الرئيسية**: `android/play-store/feature-graphic-1024x500.png` (1024x500 PNG).
- **العناوين والوصف**: موجودة باللغتين العربية والإنجليزية في `android/play-store/store-listing.json`.
- **رابط سياسة الخصوصية (إلزامي)**: الرابط المستضاف والمباشر هو: `https://YOUR-DOMAIN.example/privacy.html`.
- **ملف التحقق الرقمي (Digital Asset Links)**: مستضاف وجاهز على `/.well-known/assetlinks.json`.

---

## 4. البناء التلقائي عبر GitHub Actions

عند رفع هذا المستودع إلى GitHub، سيعمل ملف الـ Workflow الموجود في `.github/workflows/build-android.yml` تلقائياً لبناء التطبيق وتوفير ملفات الـ APK والـ AAB في صفحة الـ Releases والـ Actions!
