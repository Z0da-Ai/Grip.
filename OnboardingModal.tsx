import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  Bell,
  BatteryCharging,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface OnboardingProps {
  isOpen: boolean;
  onFinish: () => void;
  isDarkMode: boolean;
}

export const OnboardingModal: React.FC<OnboardingProps> = ({ isOpen, onFinish, isDarkMode }) => {
  if (!isOpen) return null;

  const [permissions, setPermissions] = useState({
    overlay: true,
    exactAlarm: true,
    notifications: true,
    battery: true,
    phoneState: true,
  });

  const togglePerm = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allGranted = Object.values(permissions).every(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
      <div
        className={`w-full max-w-lg rounded-3xl border p-6 sm:p-7 transition-all shadow-2xl relative ${
          isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#6D28D9]/15 text-[#6D28D9] flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black">أذونات الصمود والإنفاذ في Grip</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            لكي يجعل Grip التسويف أصعب بكثير من أداء المهمة، يحتاج النظام إلى 5 أذونات نظام أندرويد حاسمة:
          </p>
        </div>

        {/* Permissions Checklist with Arabic rationale */}
        <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-1">
          {/* Permission 1: Overlay */}
          <div
            onClick={() => togglePerm('overlay')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
              permissions.overlay
                ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
            }`}
          >
            <div className="mt-0.5">
              <CheckCircle2
                className={`w-5 h-5 ${permissions.overlay ? 'text-[#6D28D9]' : 'text-slate-400'}`}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  الظهور فوق التطبيقات (SYSTEM_ALERT_WINDOW)
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-100 dark:bg-purple-900 text-[#6D28D9] dark:text-purple-300">
                  إلزامي
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                لعرض شاشة الإنفاذ فوق أي تطبيق عند حلول وقت المهمة ومنع تشتتك في التطبيقات الأخرى.
              </p>
            </div>
          </div>

          {/* Permission 2: Exact Alarm */}
          <div
            onClick={() => togglePerm('exactAlarm')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
              permissions.exactAlarm
                ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
            }`}
          >
            <div className="mt-0.5">
              <CheckCircle2
                className={`w-5 h-5 ${permissions.exactAlarm ? 'text-[#6D28D9]' : 'text-slate-400'}`}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  المنبهات الدقيقة (SCHEDULE_EXACT_ALARM)
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-100 dark:bg-purple-900 text-[#6D28D9] dark:text-purple-300">
                  إلزامي
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                لإطلاق الإنفاذ بالثانية المحددة دون أي تأخير تفرضه أنظمة توفير الطاقة في أندرويد.
              </p>
            </div>
          </div>

          {/* Permission 3: Notifications */}
          <div
            onClick={() => togglePerm('notifications')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
              permissions.notifications
                ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
            }`}
          >
            <div className="mt-0.5">
              <CheckCircle2
                className={`w-5 h-5 ${permissions.notifications ? 'text-[#6D28D9]' : 'text-slate-400'}`}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  إشعارات النظام الدائمة (POST_NOTIFICATIONS)
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-100 dark:bg-purple-900 text-[#6D28D9] dark:text-purple-300">
                  مطلوب للخدمة
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                لتشغيل الـ Foreground Service بإشعار دائم يمنع نظام أندرويد من قتل التطبيق في الخلفية.
              </p>
            </div>
          </div>

          {/* Permission 4: Battery Optimization Exemption */}
          <div
            onClick={() => togglePerm('battery')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
              permissions.battery
                ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
            }`}
          >
            <div className="mt-0.5">
              <CheckCircle2
                className={`w-5 h-5 ${permissions.battery ? 'text-[#6D28D9]' : 'text-slate-400'}`}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  استثناء تحسين البطارية (IGNORE_BATTERY_OPTIMIZATION)
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                  للاستمرارية
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                لضمان عمل Grip حتى في وضع السكون العميق (Doze Mode) وإعادة الجدولة بعد Reboot.
              </p>
            </div>
          </div>

          {/* Permission 5: Phone State */}
          <div
            onClick={() => togglePerm('phoneState')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
              permissions.phoneState
                ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
            }`}
          >
            <div className="mt-0.5">
              <CheckCircle2
                className={`w-5 h-5 ${permissions.phoneState ? 'text-[#6D28D9]' : 'text-slate-400'}`}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  مراقبة حالة المكالمات (READ_PHONE_STATE)
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                  للطوارئ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                لتعليق شاشة الإنفاذ تلقائياً أثناء المكالمات الهاتفية ومكالمات الطوارئ وعدم مقاطعتك.
              </p>
            </div>
          </div>
        </div>

        {/* Complete Button */}
        <button
          onClick={onFinish}
          className="w-full py-3.5 rounded-2xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white font-extrabold text-xs shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
        >
          <span>تفعيل جميع الأذونات وبدء الانضباط</span>
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </div>
  );
};
