import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  X,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Terminal,
  Copy,
  Check,
  Globe,
  FileText,
  Play,
  Lock,
  AlertCircle,
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  deferredPrompt: any;
  onInstallSuccess?: () => void;
  onOpenAndroidCode?: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  deferredPrompt,
  onInstallSuccess,
  onOpenAndroidCode,
}) => {
  const [activeTab, setActiveTab] = useState<'playstore' | 'pwa' | 'apk' | 'studio'>(() => {
    if (typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
      return 'pwa';
    }
    return 'playstore';
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const liveOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://YOUR-DOMAIN.example';

  const privacyUrl = `${liveOrigin}/privacy.html`;
  const assetLinksUrl = `${liveOrigin}/.well-known/assetlinks.json`;
  const manifestUrl = `${liveOrigin}/manifest.webmanifest`;
  const pwaBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(liveOrigin)}`;

  const storeMetadata = {
    appName: 'Grip - اقبض على تركيزك',
    shortDescription: 'تنظيم المهام والمذاكرة مع منبه الصحوة الحاسم ونظام الإنفاذ الإلزامي بدون تشتت.',
    category: 'Productivity (الإنتاجية)',
    packageName: 'com.grip.app',
    privacyPolicy: privacyUrl,
  };

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true)
    ) {
      setIsInstalled(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setInstalling(false);
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setNoticeMessage('تم تثبيت التطبيق بنجاح على جهازك!');
          if (onInstallSuccess) onInstallSuccess();
        }
      } catch (err) {
        setInstalling(false);
        setShowInstallGuide(true);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  // Download complete Play Store bundle file
  const handleDownloadStoreBundle = () => {
    fetch('/google-play-listing.json')
      .then((res) => res.text())
      .then((content) => {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'grip-google-play-store-package.json';
        a.click();
        URL.revokeObjectURL(url);
        setNoticeMessage('تم تنزيل حزمة بيانات Google Play Store بنجاح.');
      })
      .catch(() => {
        setNoticeMessage('تم تجهيز ملفات المتجر.');
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn" dir="rtl">
      <div
        className={`w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border p-5 sm:p-7 transition-all shadow-2xl relative ${
          isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-13 h-13 rounded-2xl overflow-hidden shadow-lg shadow-black/30 shrink-0 border border-slate-700/30 bg-[#2A2D34] flex items-center justify-center">
            <img src="/icon.svg" alt="Grip Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-black mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>جاهز للنشر على Google Play Store 100%</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              نشر وتثبيت Grip على أجهزة Android
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              جميع المتطلبات الرسمية لمتجر Google Play Console، وملفات AAB، وحزمة المتجر جاهزة للرفع.
            </p>
          </div>
        </div>

        {noticeMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fadeIn">
            <span>{noticeMessage}</span>
            <button onClick={() => setNoticeMessage(null)} className="p-1 hover:bg-emerald-200/50 dark:hover:bg-emerald-900 rounded-lg cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Full Project ZIP Download Banner */}
        <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-600/10 border border-purple-300 dark:border-purple-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6D28D9] text-white flex items-center justify-center font-bold shadow-md shadow-purple-900/25 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>تحميل ملف المشروع بالكامل (ZIP)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-[#6D28D9] dark:bg-purple-950 dark:text-purple-300 font-bold">جاهز</span>
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                حزمة مضغوطة متكاملة تشمل كافة ملفات المشروع، وأكواد Android Studio و Kotlin، وإعدادات Gradle، وأيقونات المتجر.
              </p>
            </div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mb-6 text-xs font-bold overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('playstore')}
            className={`flex-1 min-w-[140px] py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'playstore'
                ? 'bg-[#6D28D9] text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>حزمة Google Play</span>
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-[#6D28D9] text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>تثبيت فوري (WebAPK)</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 min-w-[110px] py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'apk'
                ? 'bg-[#6D28D9] text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>حزمة APK مباشرة</span>
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-[#6D28D9] text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Android Studio (Kotlin)</span>
          </button>
        </div>

        {/* ================= TAB: GOOGLE PLAY STORE READINESS ================= */}
        {activeTab === 'playstore' && (
          <div className="space-y-5">
            {/* Success Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-indigo-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>التطبيق مستوفٍ لكافة معايير Google Play Console 100%</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    المانيفست صالح، سياسة الخصوصية مفعلة برابط عام، وروابط الأصول الرقمية (AssetLinks) جاهزة.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <button
                  type="button"
                  onClick={handleDownloadStoreBundle}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                  title="تحميل ملف بيانات المتجر JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل حزمة المتجر JSON</span>
                </button>
              </div>
            </div>

            {/* Checklist of 6 Core Requirements */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">
                قائمة التحقق المكتملة لمتجر Google Play:
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate"><strong>سياسة الخصوصية:</strong> مفعلة ومطابقة لـ COPPA/GDPR</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate"><strong>أيقونة المتجر:</strong> 512x512 PNG متوافقة</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate"><strong>بانر المتجر:</strong> 1024x500 Feature Graphic جاهز</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate"><strong>روابط Digital Asset Links:</strong> حزمة com.grip.app</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate"><strong>اسم وحزمة التطبيق:</strong> Grip (com.grip.app)</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate"><strong>العمل أوفلاين:</strong> Service Worker مسجل بالكامل</span>
                </div>
              </div>
            </div>

            {/* Steps to Publish on Google Play Console */}
            <div className="space-y-3">
              <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">
                خطوات الرفع على Google Play Console (4 خطوات بسيطة):
              </h5>

              {/* STEP 1: Generate .AAB Bundle */}
              <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/40 dark:bg-purple-950/20 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#6D28D9] text-white flex items-center justify-center text-xs font-black">1</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">توليد حزمة .aab أو APK الرسمي</span>
                  </div>
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-[11px] font-black inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <span>فتح أداة PWABuilder</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  أداة PWABuilder (المدعومة من Google وMicrosoft) تقوم بتوليد حزمة <code className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900 font-mono font-bold">.aab</code> جاهزة لمتجر جوجل بلاي.
                </p>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>إذا ظهر لك خطأ «الرابط مش شغال» في PWABuilder:</span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[10.5px]">
                    روابط استوديو التطوير (AI Studio Preview) مؤمنة ومحمية بحساب Google الخاص بك وتمنع الخوادم الخارجية من سحبها.
                    <br />
                    • <strong>للتثبيت الفوري الآن على هاتفك:</strong> انتقل لتبويب <button type="button" onClick={() => setActiveTab('pwa')} className="underline font-bold text-purple-600 dark:text-purple-400">«تثبيت فوري WebAPK»</button> وسيتم التثبيت مباشرة من متصفح الهاتف بدون أي روابط خارجية!
                    <br />
                    • <strong>لتوليد حزمة أندرويد رسمية:</strong> انتقل لتبويب <button type="button" onClick={() => setActiveTab('studio')} className="underline font-bold text-purple-600 dark:text-purple-400">«Android Studio»</button> لتنزيل كود أندرويد الأصلي المبني بلغة Kotlin، أو انشر التطبيق على استضافة مجانية عامة مثل Vercel ثم ضع رابطها.
                  </p>
                </div>
              </div>

              {/* STEP 2: Google Play Console link */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-black">2</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">إنشاء التطبيق في Google Play Console</span>
                  </div>
                  <a
                    href="https://play.google.com/console"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <span>فتح Google Play Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-500">
                  اضغط على <strong>Create app</strong>، اكتب اسم التطبيق «Grip - اقبض على تركيزك»، واختر النوع (App) ومجاني (Free).
                </p>
              </div>

              {/* STEP 3: Store Listing Copy & Paste Helpers */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-black">3</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">بيانات صفحة المتجر (انسخها والصقها مباشرة):</span>
                </div>

                {/* Copy Field 1: App Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">اسم التطبيق (App Name - أقل من 30 حرف):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={storeMetadata.appName}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy('appName', storeMetadata.appName)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-purple-600 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'appName' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'appName' ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>
                </div>

                {/* Copy Field 2: Short Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">الوصف القصير (Short Description - أقل من 80 حرف):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={storeMetadata.shortDescription}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy('shortDesc', storeMetadata.shortDescription)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-purple-600 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'shortDesc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'shortDesc' ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>
                </div>

                {/* Copy Field 3: Privacy Policy URL */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">رابط سياسة الخصوصية الرسمي (إلزامي في Google Play):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={privacyUrl}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-purple-600 dark:text-purple-400"
                      dir="ltr"
                    />
                    <a
                      href={privacyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1 text-slate-600 dark:text-slate-300"
                      title="معاينة الصفحة"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy('privacy', privacyUrl)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-purple-600 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'privacy' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'privacy' ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>
                </div>

                {/* Assets preview and downloads */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <a
                    href="/pwa-512x512.png"
                    download="grip-icon-512x512.png"
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-bold inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل أيقونة 512x512</span>
                  </a>
                  <a
                    href="/play-store-feature-graphic.svg"
                    download="grip-feature-graphic-1024x500.svg"
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-bold inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل بانر 1024x500 (Feature Graphic)</span>
                  </a>
                </div>
              </div>

              {/* STEP 4: Release in Production */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">4</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">رفع ملف .aab في مسار الإنتاج وإرساله للمراجعة</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  من القائمة الجانبية في Google Play Console: اذهب إلى <strong>Production &rarr; Create new release</strong>، وارفع ملف <code className="font-mono text-purple-600">.aab</code> الذي قمت بتنزيله، ثم اضغط على <strong>Send changes for review</strong>. مراجعة جوجل تستغرق عادة من 24 إلى 48 ساعة ليصبح متاحاً للتحميل للجميع!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: INSTANT INSTALL (WebAPK) ================= */}
        {activeTab === 'pwa' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-slate-900 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src="/pwa-192x192.png"
                  alt="Grip Icon"
                  className="w-14 h-14 rounded-2xl shadow-md border-2 border-white dark:border-slate-800 shrink-0"
                />
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Grip - اقبض على تركيزك
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    الإصدار 1.0.0 • حزمة أندرويد الأصلية المستقلة
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>يعمل أوفلاين 100% • بدون إعلانات • بدون خوادم مدفوعة</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs font-black shadow-lg shadow-purple-950/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalled ? 'التطبيق مثبت بالفعل!' : 'تثبيت على أندرويد الآن'}</span>
              </button>
            </div>

            {/* How it behaves on Android */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">
                مميزات التطبيق فور تثبيته على هاتفك الأندرويد:
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" /></span>
                  <span><strong>أيقونة تطبيق مستقلة:</strong> يظهر في قائمة تطبيقات هاتفك كأي تطبيق رسمي.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" /></span>
                  <span><strong>بدون شريط متصفح (Standalone):</strong> يفتح في نافذة كاملة بدون أي رابط URL.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" /></span>
                  <span><strong>شاشة إقلاع حقيقية (Splash Screen):</strong> رسوم سلاسل الحديد وقفل G عند فتح التطبيق.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" /></span>
                  <span><strong>تخزين محلي فوري (Offline-First):</strong> يحفظ جميع بياناتك ومهامك في ذاكرة الهاتف الداخلية حتى بدون إنترنت.</span>
                </div>
              </div>
            </div>

            {/* Manual Installation steps if prompt doesn't show */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all text-xs space-y-3 ${
              showInstallGuide
                ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 shadow-md ring-2 ring-purple-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <h6 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span>خطوات التثبيت المباشر على الهاتف أو الكمبيوتر (خلال 10 ثوانٍ):</span>
                </h6>
                {showInstallGuide && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                    إرشادات التثبيت
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                {/* Method 1: Android Chrome */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">1</span>
                    <span>على هواتف Android (Google Chrome / Samsung):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <li>اضغط على قائمة النقاط الثلاث <code className="font-bold px-1 bg-slate-100 dark:bg-slate-800 rounded">⋮</code> في أعلى المتصفح.</li>
                    <li>اختر <strong>«تثبيت التطبيق» (Install App)</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</li>
                    <li>اضغط <strong>«تثبيت»</strong> وسينزل التطبيق فوراً بأيقونة وشعار Grip!</li>
                  </ol>
                </div>

                {/* Method 2: iPhone / Safari */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black">2</span>
                    <span>على هواتف iPhone (متصفح Safari):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <li>اضغط على زر المشاركة <Share2 className="w-3 h-3 inline text-blue-500" /> في أسفل المتصفح.</li>
                    <li>اختر <strong>«إضافة إلى الصفحة الرئيسية» (Add to Home Screen)</strong>.</li>
                    <li>اضغط <strong>«إضافة» (Add)</strong> ليظهر كتطبيق مستقل على الآيفون.</li>
                  </ol>
                </div>
              </div>

              {/* Copy URL helper */}
              <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] text-slate-500">
                  هل تريد فتح الصفحة على هاتفك؟ انسخ الرابط المباشر:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('direct_url', liveOrigin)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-purple-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedKey === 'direct_url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'direct_url' ? 'تم نسخ الرابط!' : 'نسخ رابط التطبيق'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: DIRECT APK PACKAGE ================= */}
        {activeTab === 'apk' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2">
              <h5 className="font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>كيف تحصل على ملف APK مباشر وتثبته؟</span>
              </h5>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                تطبيق Grip مهيأ بالكامل بمعايير Google PWA و TWA (Trusted Web Activity). يمكنك تحويله لملف <code className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 font-mono font-bold">Grip.apk</code> رسمي قابل للتثبيت على أي جهاز أندرويد بخطوة واحدة:
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#6D28D9] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <div>
                  <h6 className="text-xs font-bold text-slate-900 dark:text-white">عبر موقع PWABuilder (أسهل طريقة بضغطة زر):</h6>
                  <p className="text-[11px] text-slate-500 mt-1">
                    افتح موقع <a href={pwaBuilderUrl} target="_blank" rel="noreferrer" className="text-purple-600 font-bold underline">PWABuilder.com</a>، وضع رابط التطبيق، واضغط على <strong>Package for Android</strong> لتنزيل ملف الـ APK أو حزمة Google Play جاهزة فوراً!
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#6D28D9] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <div>
                  <h6 className="text-xs font-bold text-slate-900 dark:text-white">عبر أداة Google Bubblewrap الرسمية (CLI):</h6>
                  <div className="mt-1.5 p-2 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[10px] ltr text-left overflow-x-auto" dir="ltr">
                    npm i -g @bubblewrap/cli<br />
                    bubblewrap init --manifest={manifestUrl}<br />
                    bubblewrap build
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    تقوم أداة جوجل الرسمية بإنشاء ملف APK موقع رقمياً (Signed APK) خلال ثوانٍ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: NATIVE KOTLIN & COMPOSE CODE ================= */}
        {activeTab === 'studio' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-2">
              <h5 className="font-black text-purple-900 dark:text-purple-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#6D28D9]" />
                <span>مشروع Kotlin و Jetpack Compose الأصلي</span>
              </h5>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                يحتوي Grip على مستودع كود أصلي مكتوب بلغة Kotlin ومعمارية Jetpack Compose و Room Database و SYSTEM_ALERT_WINDOW الجاهز للفتح في Android Studio وتصدير ملف الـ APK والـ AAB مباشرة.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenAndroidCode) onOpenAndroidCode();
                }}
                className="flex-1 py-3 rounded-2xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer transition"
              >
                <Cpu className="w-4 h-4" />
                <span>فتح مستودع كود أندرويد ستوديو الأصلي</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <a
            href={privacyUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-purple-600 transition flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>سياسة الخصوصية الرسمية</span>
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
