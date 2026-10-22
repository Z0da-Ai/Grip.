import React, { useState } from 'react';
import { ANDROID_SOURCE_FILES, AndroidFile } from '../data/androidSourceFiles';
import {
  Cpu,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  Radio,
  Shield,
  Smartphone,
  Copy,
  Check,
  Download,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Sliders,
  ExternalLink,
  Users,
  FileCode,
  CheckCheck,
} from 'lucide-react';

interface DeveloperWorkspaceViewProps {
  isDarkMode: boolean;
}

export const DeveloperWorkspaceView: React.FC<DeveloperWorkspaceViewProps> = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'code'>('dashboard');

  // Simulated Debug Flags
  const [debugFlags, setDebugFlags] = useState({
    strictMedicalProctoring: true,
    exactAlarmWakeLock: true,
    verboseRoomSqlLogging: false,
    offlineGeminiParserMock: true,
    simulatedKillRecovery: true,
    hapticFeedbackSim: true,
  });

  const toggleFlag = (key: keyof typeof debugFlags) => {
    setDebugFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Code viewer state
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

  // Mock Management Tables Data
  const mockUsers = [
    { id: 'USR-8901', name: 'سارة محمود', domain: 'إدارة مشاريع وأعمال', compliance: '98%', sessions: 42, lastHold: '10s' },
    { id: 'USR-8902', name: 'عمر القحطاني', domain: 'هندسة وتطوير برمجيات', compliance: '94%', sessions: 38, lastHold: '20s' },
    { id: 'USR-8903', name: 'ليلى الدوسري', domain: 'تصميم وبحث أكاديمي', compliance: '100%', sessions: 56, lastHold: '10s' },
    { id: 'USR-8904', name: 'كريم الزهراني', domain: 'كتابة وإنتاج محتوى', compliance: '89%', sessions: 29, lastHold: '30s (Cap)' },
  ];

  const mockAuditLogs = [
    { id: 'LOG-771', timestamp: '10:14:02', event: 'SYSTEM_ALERT_WINDOW Triggered', module: 'Cardiovascular Anatomy', status: 'Enforced' },
    { id: 'LOG-772', timestamp: '09:45:18', event: 'Escalating Hold Completed (20s)', module: 'Clinical Pharmacology', status: 'Free Window Granted' },
    { id: 'LOG-773', timestamp: '08:30:00', event: 'Exact Alarm Scheduled', module: 'Hospital Ward Round', status: 'AlarmManager Active' },
    { id: 'LOG-774', timestamp: '07:15:40', event: 'Room DB Sync Encrypted', module: 'SQLiteCipher Room', status: 'Committed' },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Header Banner for Developer Mode */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900 text-white shadow-xl border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30 shrink-0">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight">مساحة المطور والتحكم الهندسي</h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-black uppercase tracking-wider">
                DEV ACCESS
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-0.5">
              مرحباً بك، المطور الرئيسي. تتيح لك هذه اللوحة مراقبة سلامة واجهات البرمجة (APIs)، الأعلام الاختبارية، وأكواد Kotlin الأصلية.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-black/40 p-1 rounded-xl text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            فحص النظام والإدارة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'code'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            أكواد Kotlin Compose ({ANDROID_SOURCE_FILES.length})
          </button>
        </div>
      </div>

      {/* ================= TAB 1: SYSTEM HEALTH & MANAGEMENT TABLES ================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Section 1: API & Architecture Health Checks */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">
                  فحص سلامة الخدمات والواجهات (API & System Health Checks)
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                جميع الأنظمة تعمل بكفاءة 100%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* API 1 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">Gemini Clinical API</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">200 OK • 38ms</div>
                <span className="text-[10px] text-slate-400 block mt-1">معالجة الحالات السريرية وتفكيك المهام</span>
              </div>

              {/* API 2 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">SQLiteCipher Room DB</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">AES-256 Encrypted</div>
                <span className="text-[10px] text-slate-400 block mt-1">تخزين محلي معزول مطابق لمعايير HIPAA</span>
              </div>

              {/* API 3 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">AlarmManager Exact</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">0ms Drift • Active</div>
                <span className="text-[10px] text-slate-400 block mt-1">تنبيهات دقيقة تصمد أمام وضع Doze</span>
              </div>

              {/* API 4 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">SYSTEM_ALERT_WINDOW</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">Permission Granted</div>
                <span className="text-[10px] text-slate-400 block mt-1">حظر شاشة الهاتف بالكامل وقت المهمة</span>
              </div>
            </div>
          </div>

          {/* Section 2: Simulated Debug Flags */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-4 h-4 text-[#7C3AED]" />
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">
                أعلام التشغيل والتنقيح البرمجي (Simulated Debug Flags)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(debugFlags).map(([key, value]) => (
                <div
                  key={key}
                  onClick={() => toggleFlag(key as any)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-purple-300 transition"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-mono">
                      {key}
                    </span>
                    <span className="text-[10px] text-slate-400">انقر لتبديل حالة العلم البرمجي</span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
                      value ? 'bg-purple-100 dark:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {value ? 'TRUE' : 'FALSE'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Mock Management Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Table 1: Users Adherence & Compliance */}
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">
                  سجل التزام المستخدمين والمهام (Active Users & Adherence)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[11px]">
                      <th className="pb-2 font-bold">المعرف</th>
                      <th className="pb-2 font-bold">اسم المستخدم</th>
                      <th className="pb-2 font-bold">المسار / المجال</th>
                      <th className="pb-2 font-bold">نسبة الانضباط</th>
                      <th className="pb-2 font-bold">الاحتكاك</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mockUsers.map((st) => (
                      <tr key={st.id} className="text-slate-700 dark:text-slate-300">
                        <td className="py-2.5 font-mono text-[10px] text-purple-600 dark:text-purple-400">{st.id}</td>
                        <td className="py-2.5 font-bold">{st.name}</td>
                        <td className="py-2.5 text-[11px] text-slate-400">{st.domain}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            {st.compliance}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-[10px]">{st.lastHold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Clinical Audit Logs */}
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">
                  سجل أحداث الإنفاذ السريري (Clinical Audit Logs)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[11px]">
                      <th className="pb-2 font-bold">الوقت</th>
                      <th className="pb-2 font-bold">الحدث</th>
                      <th className="pb-2 font-bold">المقرر المرتبط</th>
                      <th className="pb-2 font-bold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mockAuditLogs.map((log) => (
                      <tr key={log.id} className="text-slate-700 dark:text-slate-300">
                        <td className="py-2.5 font-mono text-[10px] text-slate-400">{log.timestamp}</td>
                        <td className="py-2.5 font-bold">{log.event}</td>
                        <td className="py-2.5 text-[11px] text-slate-400">{log.module}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: KOTLIN COMPOSE CODE REPOSITORY ================= */}
      {activeTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-fadeIn">
          {/* Left / File list */}
          <div className={`lg:col-span-4 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-xs font-black mb-3 text-slate-800 dark:text-slate-200">
              ملفات مشروع Kotlin Compose الأصلي
            </h3>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredFiles.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full p-2.5 rounded-xl text-right transition cursor-pointer flex items-center justify-between text-xs ${
                    selectedFile.path === file.path
                      ? 'bg-[#7C3AED] text-white shadow-sm font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="w-4 h-4 shrink-0" />
                    <span className="truncate">{file.title}</span>
                  </div>
                  <span className="text-[10px] opacity-75 font-mono shrink-0 mr-2">{file.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right / Code viewer */}
          <div className={`lg:col-span-8 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono" dir="ltr">
                  {selectedFile.path}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
                </button>
                <button
                  onClick={handleDownloadFile}
                  className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل</span>
                </button>
              </div>
            </div>

            <pre
              className="flex-1 p-3.5 rounded-xl bg-[#0B0F19] text-purple-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[460px] overflow-y-auto select-text"
              dir="ltr"
            >
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
