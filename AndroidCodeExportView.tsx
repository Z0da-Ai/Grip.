import React, { useState } from 'react';
import { ANDROID_SOURCE_FILES, AndroidFile } from '../data/androidSourceFiles';
import {
  Folder,
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  Cpu,
  Layers,
  ShieldAlert,
  Play,
  ExternalLink,
} from 'lucide-react';

interface AndroidCodeExportViewProps {
  isDarkMode: boolean;
}

export const AndroidCodeExportView: React.FC<AndroidCodeExportViewProps> = ({ isDarkMode }) => {
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_SOURCE_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const filteredFiles = ANDROID_SOURCE_FILES.filter((f) => {
    if (activeCategoryFilter === 'all') return true;
    return f.category === activeCategoryFilter;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.title;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    // Generate combined bundle of all files
    let bundle = `/**\n * GRIP - NATIVE ANDROID PROJECT BUNDLE\n * Package: com.grip.app\n * Generated for Android Studio\n */\n\n`;
    ANDROID_SOURCE_FILES.forEach((f) => {
      bundle += `\n/* ========================================================\n * FILE: ${f.path}\n * ======================================================== */\n\n${f.content}\n\n`;
    });
    const blob = new Blob([bundle], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grip-android-native-source.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none" dir="rtl">
      {/* Top Banner */}
      <div
        className={`p-6 rounded-3xl border ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-300 text-xs font-bold mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>Native Android Architecture (Kotlin • Compose • Room • Services)</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              مستودع الكود المصدري الأصلي لـ Android Studio
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              تصفح وانسخ ملفات تطبيق أندرويد الحقيقية بحزمة <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-purple-600 font-mono text-[11px]">com.grip.app</code> مع معمارية الإنفاذ والخدمات وقاعدة البيانات Room.
            </p>
          </div>

          <button
            onClick={handleDownloadAll}
            className="px-5 py-3 rounded-2xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>تحميل كامل حزمة أندرويد</span>
          </button>
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeCategoryFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            جميع الملفات ({ANDROID_SOURCE_FILES.length})
          </button>
          <button
            onClick={() => setActiveCategoryFilter('manifest')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeCategoryFilter === 'manifest'
                ? 'bg-[#6D28D9] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Manifest والأذونات
          </button>
          <button
            onClick={() => setActiveCategoryFilter('database')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeCategoryFilter === 'database'
                ? 'bg-[#6D28D9] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            قاعدة بيانات Room
          </button>
          <button
            onClick={() => setActiveCategoryFilter('service')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeCategoryFilter === 'service'
                ? 'bg-[#6D28D9] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            شاشة الإنفاذ والخدمات
          </button>
          <button
            onClick={() => setActiveCategoryFilter('worker')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeCategoryFilter === 'worker'
                ? 'bg-[#6D28D9] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            WorkManager
          </button>
        </div>
      </div>

      {/* Main Code Explorer Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: File Tree (4 Cols) */}
        <div
          className={`lg:col-span-4 p-4 rounded-3xl border flex flex-col gap-2 ${
            isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs font-black text-slate-400 px-2 pb-2 block border-b border-slate-100 dark:border-slate-800">
            ملفات مشروع Android Studio:
          </span>

          <div className="space-y-1.5 overflow-y-auto max-h-[500px]">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  type="button"
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full p-2.5 rounded-xl text-right transition flex items-center gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-300 font-black ring-1 ring-purple-300 dark:ring-purple-700'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <FileCode className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
                  <div className="truncate flex-1">
                    <span className="text-xs font-bold block truncate">{file.title}</span>
                    <span className="text-[10px] text-slate-400 block truncate font-mono" dir="ltr">
                      {file.path}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Viewer (8 Cols) */}
        <div
          className={`lg:col-span-8 rounded-3xl border overflow-hidden flex flex-col ${
            isDarkMode ? 'bg-[#0B0F19] border-slate-800' : 'bg-[#0F172A] border-slate-700 text-white shadow-sm'
          }`}
        >
          {/* Code Viewer Toolbar */}
          <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-xs text-slate-300 font-mono mr-2" dir="ltr">
                {selectedFile.path}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadFile}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="تحميل الملف"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Code Body */}
          <div className="p-4 sm:p-5 overflow-x-auto max-h-[500px] font-mono text-xs text-slate-200 leading-relaxed" dir="ltr">
            <pre>
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Build & Run Guide in Android Studio */}
      <div
        className={`p-6 rounded-3xl border ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-[#6D28D9]" />
          <span>خطوات التشغيل والبناء في Android Studio</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="w-7 h-7 rounded-lg bg-[#6D28D9] text-white flex items-center justify-center font-bold mb-2">
              1
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">فتح المشروع وتثبيت التبعيات</h4>
            <p className="text-slate-500 dark:text-slate-400">
              افتح Android Studio (Giraffe أو أحدث)، تأكد من تثبيت Android SDK 35 مع JDK 17، ثم قم بعمل <strong>Gradle Sync</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="w-7 h-7 rounded-lg bg-[#6D28D9] text-white flex items-center justify-center font-bold mb-2">
              2
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">منح إذن الظهور فوق التطبيقات</h4>
            <p className="text-slate-500 dark:text-slate-400">
              في أول تشغيل، ستفتح شاشة الـ Onboarding تلقائياً لمنح <code>SYSTEM_ALERT_WINDOW</code> وإذن المنبهات الدقيقة واستثناء البطارية.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="w-7 h-7 rounded-lg bg-[#6D28D9] text-white flex items-center justify-center font-bold mb-2">
              3
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">اختبار شاشة الإنفاذ والصمود</h4>
            <p className="text-slate-500 dark:text-slate-400">
              جدول مهمة أو اضغط "اختبار الإنفاذ". ستظهر شاشة <strong>روح خلّصها</strong> فوق أي تطبيق بزر الضغط المطول التصاعدي (10s/20s/30s).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
