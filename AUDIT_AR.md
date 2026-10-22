# تقرير فحص Grip — المشاكل، اللي اتصلّح، واللي لسه محتاج قرارك

> ملحوظة أمانة: مفيش عندي Android SDK ولا إنترنت في بيئتي، فمقدرتش أبني الـ APK ولا أشغّل `npm install`. اللي اتراجع عليه فعلاً: فحص ستاتيكي لكل الملفات + فحص syntax لملفات TypeScript اللي اتعدلت. **أول حاجة تعملها: افتح فولدر `android/` في Android Studio واضغط Sync/Build** وابعتلي أي error يظهر.

## 🔴 مشاكل كانت بتمنع أو بتخطر (اتصلّحت)

| # | المشكلة | الإصلاح |
|---|---|---|
| 1 | مشروع الأندرويد **مش بيتبني**: كلاسات ناقصة (`GripAlarmScheduler`, `StudyDao`, `Converters`, أيقونة `ic_grip_chain`) وكلاس `BootReceiver` متكرر مرتين | اتكتبت الكلاسات الناقصة، واتفصل `BootReceiver` بمنطق إعادة جدولة حقيقي |
| 2 | شاشة الإنفاذ كانت **هتعمل crash** وقت التشغيل (ComposeView جوه Service من غير LifecycleOwner) | أُضيف `OverlayLifecycleOwner` |
| 3 | `targetSdk 35` — جوجل بلاي بقت **ترفض** أي تطبيق جديد/تحديث مش على API 36 (من 31 أغسطس 2026) | `compileSdk/targetSdk = 36`، AGP 8.13، Gradle 8.13، Kotlin 2.0.21، Compose BOM 2025.06 |
| 4 | `gradlew` مجرد سكريبت بيحمّل Gradle 8.7 (ومفيش `gradle-wrapper.jar`) و8.7 لا يدعم AGP الجديد | اتحدّث لـ 8.13. **لازم مرة واحدة**: `cd android && gradle wrapper` (أو Android Studio بيعملها لوحده) |
| 5 | زرار "تحميل المشروع ZIP" ظاهر **لكل مستخدم**، وسكريبت الـ zip كان ممكن يحط ملف `.env` (مفتاح Gemini) جواه | اتشال الـ endpoint والأزرار التلاتة، والسكريبت بيستبعد `.env` والـ keystore |
| 6 | **باب خلفي للمطوّر**: الكلمة `zoda2007` والإيميل الشخصي مكتوبين في كود المتصفح، وأي ضغطة "Google" في الـ onboarding كانت بتديك `isDeveloper: true` | دلوقتي وضع المطوّر شغال في `npm run dev` بس، ومش موجود في نسخة الإنتاج |
| 7 | الـ API الذكي من غير أي حماية: أي حد يقدر يستنزف حصة Gemini بتاعتك | rate limit (20/دقيقة)، حد للنصوص، body أصغر (12MB بدل 25)، security headers |
| 8 | موديل `gemini-3.8-flash` غالباً مش موجود، ومكتوب في 3 أماكن بأسماء مختلفة | متغير واحد `GEMINI_MODEL` (الافتراضي `gemini-2.5-flash`) — **اتأكد من الاسم في حسابك** |
| 9 | باج: "بعد بكرة" كانت بتتفهم "بكرة" (ترتيب الـ regex) | اتصلّح |
| 10 | `viewport` فيه `user-scalable=no` (بيمنع التكبير — مشكلة وصول) وسكريبت بيخبّي أي error فيه حرفين `ws` | اتصلّحوا |

## 🟠 مخالفات لسياسات جوجل بلاي (اتعالج جزء، والباقي قرارك)

- **صلاحيات اتشالت لأنها restricted أو مش لازمة:** `USE_EXACT_ALARM`، `READ_PHONE_STATE` (اتبدّلت بفحص `AudioManager`)، `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`. `allowBackup` بقى `false`.
- **وصف المتجر وسياسة الخصوصية كانوا فيهم ادعاءات غلط:** "بياناتك مشفرة" (Room مش مشفّر)، "أوفلاين 100%" (فيه ميزات AI بتبعت للسيرفر)، "متوافق مع COPPA/GDPR". اتعدّلوا، واتضاف إفصاح إن الصوت والصور/PDF بتتبعت لـ Gemini.
- **رابط سياسة الخصوصية** كان على رابط معاينة مؤقت (`ais-pre-...run.app`). اتحوّل لـ `https://YOUR-DOMAIN.example` — **لازم تحط دومينك الدايم** في `google-play-listing.json` والـ README ووقت رفع التطبيق.
- ⚠️ **"تسجيل الدخول بجوجل" وهمي**: بيكتب المستخدم أي إيميل/اسم وخلاص، من غير مصادقة حقيقية. ده ممكن يتصنّف "deceptive behavior". اختار: (أ) تطبيق Google Identity Services بـ Client ID حقيقي، أو (ب) تشيل الزرار وتسيبه "ملف شخصي محلي". ماعدلتش الواجهة لأن ده قرار منتج.
- ⚠️ **شاشة الإنفاذ** (قفل الشاشة، ضغط 10–30 ثانية، خروج طوارئ مخفي 60 ثانية) هي أكبر خطر رفض في المراجعة. نصيحتي: زرار خروج **ظاهر دايماً**، ونص "Prominent Disclosure" واضح قبل طلب إذن العرض فوق التطبيقات.
- في Play Console هتحتاج تملأ: **Data safety**، تصريح **SYSTEM_ALERT_WINDOW**، تصريح **Foreground service (specialUse)**، وتصريح **Exact alarms**. الحسابات الشخصية الجديدة ممكن تحتاج **Closed testing** (عدد testers لمدة 14 يوم) قبل الإنتاج — راجع الشروط الحالية في Play Console.

## 🟡 تحسينات جودة (مقترحة، ماتنفذتش)

1. **كود مكرر**: التطبيق موجود مرتين (React PWA + Kotlin أصلي) بميزات مختلفة، وكود الأندرويد كمان منسوخ كنصوص في `androidSourceFiles.ts` (109KB). عطّلت `export:android` عشان ما يمسحش الإصلاحات؛ فولدر `android/` دلوقتي هو المصدر الوحيد. القرار الاستراتيجي: إما تكمل native (أنسب للـ overlay) أو تلف الـ PWA بـ Capacitor/TWA للإصدار الأول.
2. `App.tsx` (61KB) و`CalendarView.tsx` (107KB) و`SmartAiModal.tsx` (79KB) ضخمين: قسّمهم وفعّل code-splitting (`React.lazy`) عشان التحميل أسرع.
3. شيل واجهات المطوّر (`DeveloperWorkspaceView`, `AndroidCodeExportView`, `AndroidInstallModal`) من نسخة الإنتاج تماماً.
4. البيانات في `localStorage` — انقلها لـ IndexedDB، وضيف تصدير/استيراد نسخة احتياطية (بما إن `allowBackup=false`).
5. أضف: اختبارات (منطق `rescheduleEngine` و`BudgetMath`)، تقرير أعطال (Crashlytics)، شاشة طلب إذن الإشعارات (Android 13+) وإذن المنبهات الدقيقة، Widget للمهمة الحالية، ودعم تكبير الخط وTalkBack.
6. إصدارات الحزم في `package.json` (vite 8، typescript 7، plugin-react 6) لم أقدر أتحقق منها بدون إنترنت — شغّل `npm install && npm run typecheck && npm run build`.
7. `public/.well-known/assetlinks.json` فيه بصمة شهادة — مش لازمة لتطبيق native؛ لو هتستخدم TWA لازم تكون بصمة **Play App Signing**.

## 🚀 خطوات النشر

1. ثبّت Android Studio، افتح `android/`، Sync. جرّب على موبايل: Run ▶.
2. ولّد keystore: `keytool -genkey -v -keystore grip-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias grip-key` (**احتفظ بنسخة، لو ضاع مش هتقدر تحدّث التطبيق**). انسخ `android/keystore.properties.example` إلى `keystore.properties` واملأه.
3. `cd android && gradle bundleRelease` → ملف `app-release.aab`.
4. في Play Console: أنشئ التطبيق، ارفع الـ AAB لمسار Internal/Closed testing، املأ الـ listing من `android/play-store/`، والخصوصية والـ Data safety والتصاريح أعلاه.
5. انشر السيرفر (Cloud Run مثلاً) وحط `GEMINI_API_KEY` كـ secret، وحدّث رابط الخصوصية.

## 🎨 الأيقونة
أيقونة التطبيق الحالية (رابط أبيض على خلفية رمادية داكنة #484B50) متولدة من صورتك: أيقونة أندرويد adaptive + نسخة monochrome لثيم أندرويد 13، وأيقونة Play Store 512، وأيقونات الـ PWA والـ favicon. سكريبتي `generate-icons` و`export-android-project` اتعطلوا عشان ما يمسحوهاش.

## 🔁 تحديث: جولة التصليح التانية

- **`MainActivity` كان بينادي `GripHomeScreen` وده مش موجود** (الدالة اسمها `HomeScreen`) → خطأ بناء تاني. اتصلّح، واتربط: Splash ثم الشاشة الرئيسية.
- **شاشة الإنفاذ كان فيها زرار "ذكّرني لاحقاً" مجرد تعليق (مش مكتوب)، وزرار الطوارئ مش متوصّل** → المستخدم كان ممكن يتحبس. اتكتب الزرار بنظام الضغط المطوّل (10/20/30 ث) واتضاف **زرار «خروج طارئ» ظاهر دايماً** (5 ثوانٍ).
- **التطبيق مكانش بيطلب أي إذن أصلاً** (يعني الـ overlay والمنبهات ماكانوش هيشتغلوا). اتضافت شاشة تفعيل بتشرح كل إذن، فيها **Prominent Disclosure** المطلوب من جوجل قبل إذن «الظهور فوق التطبيقات».
- **تسجيل الدخول بجوجل الوهمي اتشال**: بقى «ابدأ بسرعة (ملف محلي على جهازك)». اتشالت كمان شارة «حساب Google متصل».

### ⚠️ الحقيقة المهمة عن نسخة الأندرويد الأصلية
نسخة Kotlin **نموذج أولي (prototype)**: الشاشة الرئيسية بمهام تجريبية ثابتة غير موصّلة بقاعدة البيانات، ومفيش إضافة مهام ولا تقويم ولا ذكاء اصطناعي. **التطبيق الكامل هو نسخة الويب (React)**. لو عايز تنزّل الأبلكيشن الكامل بسرعة:
1. انشر نسخة الويب على دومين دائم (Cloud Run مثلاً).
2. ادخل على pwabuilder.com، ألصق الرابط، واختار Android → بيطلعلك ملف AAB جاهز لجوجل بلاي (TWA) من غير برمجة.
ده الطريق الأسرع للنسخة الكاملة. نسخة Kotlin تفضل خيار لو عايز شاشة الإنفاذ الأصلية، بس محتاجة شغل تكميلي (ربط Room بالشاشات وإضافة المهام).
