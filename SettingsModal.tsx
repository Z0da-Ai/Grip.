import React, { useState } from 'react';
import { GripSettings } from '../types/grip';
import { storage } from '../services/storage';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Moon,
  Sun,
  Shield,
  RotateCcw,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  Languages,
  CalendarDays,
  User as UserIcon,
  LogOut,
  Code2,
  HelpCircle,
  Bell,
  Smartphone,
} from 'lucide-react';
import { getHijriDateString } from '../utils/hijriCalendar';
import { GripUser } from '../types/grip';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GripSettings;
  onUpdateSettings: (settings: GripSettings) => void;
  onDataImported: () => void;
  currentUser?: GripUser | null;
  onOpenAuth?: (step?: 'walkthrough' | 'auth') => void;
  onLogout?: () => void;
  onReplaySplash?: () => void;
  onOpenAndroidInstall?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onDataImported,
  currentUser,
  onOpenAuth,
  onLogout,
  onReplaySplash,
  onOpenAndroidInstall,
}) => {
  if (!isOpen) return null;

  const [current, setCurrent] = useState<GripSettings>({ ...settings });
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Export JSON backup
  const handleExportBackup = () => {
    const jsonStr = storage.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grip-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const success = storage.importFullBackup(text);
        if (success) {
          setImportStatus('تم استعادة النسخة الاحتياطية بنجاح!');
          onDataImported();
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('خطأ: تعذر قراءة ملف النسخة الاحتياطية.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSave = () => {
    onUpdateSettings(current);
    storage.saveSettings(current);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" dir="rtl">
      <div
        className={`w-full max-w-lg rounded-3xl border p-6 transition-all shadow-2xl relative ${
          current.isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-[#6D28D9] flex items-center justify-center">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black">إعدادات نظام Grip</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تخصيص أزمنة الاحتجاز، النافذة الحرة، النسخ الاحتياطي، والمظهر.
            </p>
          </div>
        </div>

        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {/* User Account & Developer Mode Status */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-slate-50 to-slate-100 dark:from-purple-950/30 dark:via-slate-800/60 dark:to-slate-800/40 border border-purple-200 dark:border-purple-800/60">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6D28D9] to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {currentUser?.name || 'مستخدم Grip'}
                    </span>
                    {currentUser?.isDeveloper ? (
                      <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-200 dark:border-purple-800">
                        <Code2 className="w-3 h-3" />
                        <span>وضع المطور</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        حساب محلي
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono" dir="ltr">
                    {currentUser?.email || 'غير مسجل بعد'}
                  </span>
                </div>
              </div>

              {currentUser && onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-1 border-t border-purple-100 dark:border-slate-700/60">
              {onOpenAuth && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth('auth');
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-[#6D28D9] dark:text-purple-300 text-xs font-bold hover:bg-purple-200 transition cursor-pointer text-center"
                  >
                    تبديل الحساب / تسجيل بجيميل آخر
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth('walkthrough');
                    }}
                    className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 transition cursor-pointer flex items-center gap-1"
                    title="إعادة عرض الجولة التعريفية"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>الجولة التعريفية</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Google Play Store & Android Ready Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-emerald-500/10 border border-purple-300 dark:border-purple-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#6D28D9] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black block text-slate-900 dark:text-white">
                  تثبيت ونشر التطبيق (Android & Play Store)
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  تثبيت فوري WebAPK، حزمة Google Play، وكود أندرويد الأصلي
                </p>
              </div>
            </div>
            {onOpenAndroidInstall && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAndroidInstall();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs font-bold transition active:scale-95 cursor-pointer shrink-0 shadow-xs"
              >
                إدارة وتثبيت
              </button>
            )}
          </div>

          {/* Setting 1: Free Window Length (3 - 5 min, default 4) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black">مدة النافذة الحرة بعد التأجيل (Free Window)</span>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                {current.freeWindowMinutes} دقائق
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              المدة التي يختفي فيها الـ Overlay بعد إتمام الضغط المطول بنجاح قبل أن يعود تلقائياً.
            </p>
            <input
              type="range"
              min={3}
              max={5}
              step={1}
              value={current.freeWindowMinutes}
              onChange={(e) => setCurrent({ ...current, freeWindowMinutes: parseInt(e.target.value) })}
              className="w-full accent-[#6D28D9] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
              <span>3 دقائق</span>
              <span>4 دقائق (الافتراضي)</span>
              <span>5 دقائق</span>
            </div>
          </div>

          {/* Setting 2: Escalating friction holds */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-black block mb-1">سلم الاحتجاز التصاعدي (Escalating Friction)</span>
            <p className="text-[11px] text-slate-400 mb-3">
              مدة الضغط المطول الإلزامية التي تتصاعد لكل مهمة بشكل مستقل:
            </p>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                <span className="text-[10px] text-slate-500 block font-bold">أول 3 تأجيلات</span>
                <span className="text-xs font-black text-[#6D28D9] dark:text-purple-300">10 ثوانٍ</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                <span className="text-[10px] text-slate-500 block font-bold">التأجيلات 4-6</span>
                <span className="text-xs font-black text-[#6D28D9] dark:text-purple-300">20 ثانية</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                <span className="text-[10px] text-slate-500 block font-bold">الحد الأقصى</span>
                <span className="text-xs font-black text-rose-600 dark:text-rose-400">30 ثانية (سقف)</span>
              </div>
            </div>
          </div>

          {/* Setting 3: Emergency Exit */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-black block">مخرج الطوارئ المخفي (60 ثانية)</span>
              <p className="text-[11px] text-slate-400">إتاحة خيار الضغط المستمر لدقيقة كاملة لإلغاء الإنفاذ للمهمة</p>
            </div>
            <input
              type="checkbox"
              checked={current.allowEmergencyExit}
              onChange={(e) => setCurrent({ ...current, allowEmergencyExit: e.target.checked })}
              className="w-5 h-5 accent-[#6D28D9] cursor-pointer"
            />
          </div>

          {/* Setting: One-Shot Wake-Up Alarm (منبه الصحوة الحاسم) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-300 dark:border-amber-700/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black block text-slate-900 dark:text-white">
                      منبه الصحوة الحاسم (One-Shot)
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded">
                      بدون غفوة ⏰
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    يرن مرة واحدة فقط بالصباح، ويتطلب ضغطاً مستمراً لمدة 5 ثوانٍ لإيقافه لكسر كسل الدماغ
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={current.wakeUpEnabled !== false}
                onChange={(e) => setCurrent({ ...current, wakeUpEnabled: e.target.checked })}
                className="w-5 h-5 accent-amber-500 cursor-pointer shrink-0 mr-2"
              />
            </div>

            {current.wakeUpEnabled !== false && (
              <div className="flex items-center justify-between pt-2 border-t border-amber-200/50 dark:border-amber-900/40">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  ميعاد الاستيقاظ اليومي:
                </span>
                <input
                  type="time"
                  value={current.wakeUpTime || '06:30'}
                  onChange={(e) => setCurrent({ ...current, wakeUpTime: e.target.value })}
                  className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-xs font-black text-amber-900 dark:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          {/* Setting 4: Language (Arabic RTL vs English LTR) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#6D28D9] dark:text-purple-400" />
              <div>
                <span className="text-xs font-black block">لغة الواجهة وموضع زر FAB</span>
                <span className="text-[10px] text-slate-400">
                  {current.language === 'en' ? 'English (FAB on Left)' : 'العربية (الزرار على اليمين)'}
                </span>
              </div>
            </div>
            <div className="flex items-center bg-slate-200 dark:bg-slate-700 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setCurrent({ ...current, language: 'ar' })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  current.language !== 'en'
                    ? 'bg-[#6D28D9] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                }`}
              >
                العربية (يمين)
              </button>
              <button
                type="button"
                onClick={() => setCurrent({ ...current, language: 'en' })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  current.language === 'en'
                    ? 'bg-[#6D28D9] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                }`}
              >
                English (شمال)
              </button>
            </div>
          </div>

          {/* Setting 5: Hijri Calendar (التقويم الهجري) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black block">عرض التقويم الهجري</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                    <Moon className="w-2.5 h-2.5" />
                    <span>هجري</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  إظهار التاريخ بالتقويم الهجري بجانب الميلادي في واجهة وأيام التقويم
                </p>
                {current.showHijriCalendar !== false && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    معاينة: {getHijriDateString(new Date())}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCurrent({ ...current, showHijriCalendar: current.showHijriCalendar === false ? true : false })}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 mr-2 ${
                current.showHijriCalendar !== false
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {current.showHijriCalendar !== false ? 'مفعل' : 'معطل'}
            </button>
          </div>

          {/* Setting 6: Dark Mode */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {current.isDarkMode ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span className="text-xs font-black">الوضع الليلي (Dark Mode)</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrent({ ...current, isDarkMode: !current.isDarkMode })}
              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold transition cursor-pointer"
            >
              {current.isDarkMode ? 'مفعل' : 'الوضع الفاتح'}
            </button>
          </div>

          {/* Setting 7: Replay Splash Animation (أنيميشن حرف G وسلاسل كسر التشتت) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-purple-600/5 to-transparent border border-purple-200 dark:border-purple-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                G
              </div>
              <div>
                <span className="text-xs font-black block text-slate-800 dark:text-slate-100">
                  أنيميشن البداية (سلاسل وحرف G)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  إعادة تشغيل مشهد كسر السلسلة وقفل حرف G في أي وقت
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onReplaySplash) {
                  onClose();
                  onReplaySplash();
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition cursor-pointer active:scale-95 shadow-sm shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>مشاهدة</span>
            </button>
          </div>

          {/* Setting 5: Local Backup and Export/Import */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-black block mb-1">النسخ الاحتياطي المحلي (Local Backup)</span>
            <p className="text-[11px] text-slate-400 mb-3">
              جميع بياناتك مخزنة محلياً بالكامل. يمكنك تصدير نسخة كاملة بصيغة JSON أو استيرادها:
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex-1 py-2.5 rounded-xl bg-[#6D28D9] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#7C3AED] transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير نسخة (Export)</span>
              </button>

              <label className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-300 transition cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5" />
                <span>استيراد (Import)</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>

            {importStatus && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 text-center">
                {importStatus}
              </p>
            )}
          </div>

          {/* Setting 8: Download Full Project ZIP */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-200 dark:border-purple-800/60 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#6D28D9] text-white flex items-center justify-center font-black shadow-sm shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black block text-slate-800 dark:text-slate-100">
                  تحميل ملف المشروع بالكامل (ZIP)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  كافة ملفات التطبيق، كود أندرويد Kotlin، وملفات Gradle المجهزة للبناء
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer save */}
        <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs font-bold shadow-md cursor-pointer"
          >
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
};
