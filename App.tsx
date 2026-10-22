import React, { useState, useEffect, useRef } from 'react';
import { GripTask, StudyModule, GripSettings, DailyTrackerRecord, StudyTopic, StudyLecture, GripUser, GripIntention, IntentionTag } from './types/grip';
import { storage } from './services/storage';
import { autoRescheduleFlexibleTask } from './services/rescheduleEngine';
import { SplashChainLock } from './components/SplashChainLock';
import { EnforcementOverlay } from './components/EnforcementOverlay';
import { CalendarView } from './components/CalendarView';
import { StudyHierarchyView } from './components/StudyHierarchyView';
import { TrackersView } from './components/TrackersView';
import { SmartAiModal } from './components/SmartAiModal';
import { TaskModal } from './components/TaskModal';
import { SessionEndModal } from './components/SessionEndModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SettingsModal } from './components/SettingsModal';
import { CelebrationConfetti } from './components/CelebrationConfetti';
import { StreakBadge } from './components/StreakBadge';
import { StreakModal } from './components/StreakModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { DeveloperWorkspaceView } from './components/DeveloperWorkspaceView';
import { WalkthroughAndAuthModal } from './components/WalkthroughAndAuthModal';
import { GripOnboardingEmbed } from './components/GripOnboardingEmbed';
import { BudgetView } from './components/BudgetView';
import { IntentionPanel } from './components/IntentionPanel';
import { WakeUpAlarmModal } from './components/WakeUpAlarmModal';
import { MorningFocusModal } from './components/MorningFocusModal';
import { UniversalVoiceAssistantModal } from './components/UniversalVoiceAssistantModal';
import { calculateStreakStats } from './services/streakService';
import { hapticFeedback } from './services/haptics';
import { updateOngoingAlaBalakNotification } from './services/systemNotification';

import {
  Calendar as CalendarIcon,
  Wallet,
  GraduationCap,
  TrendingUp,
  Sparkles,
  ShieldAlert,
  Settings as SettingsIcon,
  Plus,
  RefreshCw,
  Clock,
  Play,
  RotateCcw,
  Zap,
  Smartphone,
  Download,
  Cpu,
  Mic,
  User as UserIcon,
  Code2,
  Lightbulb,
  CheckSquare,
  Sun,
  Moon,
} from 'lucide-react';

export default function App() {
  // Database States (mirrors local Room persistence)
  const [tasks, setTasks] = useState<GripTask[]>(() => storage.getTasks());
  const [modules, setModules] = useState<StudyModule[]>(() => storage.getModules());
  const [settings, setSettings] = useState<GripSettings>(() => storage.getSettings());
  const [trackerHistory, setTrackerHistory] = useState<DailyTrackerRecord[]>(() => storage.getTrackerHistory());
  const [intentions, setIntentions] = useState<GripIntention[]>(() => storage.getIntentions());

  // Auto-sync intentions with Room-mirrored local storage and ongoing Android notification shade
  useEffect(() => {
    storage.saveIntentions(intentions);
    updateOngoingAlaBalakNotification(intentions);
  }, [intentions]);

  // User Profile & Developer Mode State
  const [currentUser, setCurrentUser] = useState<GripUser | null>(() => storage.getUser());

  // Active Tab State (Calendar, Study, Trackers, Budget, Intentions, Android Dev)
  const [activeTab, setActiveTab] = useState<
    'calendar' | 'study' | 'trackers' | 'budget' | 'intentions' | 'android_native'
  >('calendar');

  // Material 3 FAB Speed Dial State
  const [fabOpen, setFabOpen] = useState(false);
  const fabTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-collapse FAB Speed Dial if no action is chosen (auto return after 4.5s of inactivity or ESC key)
  useEffect(() => {
    if (fabOpen) {
      if (fabTimeoutRef.current) clearTimeout(fabTimeoutRef.current);
      // Automatically close after 4.5 seconds if untouched
      fabTimeoutRef.current = setTimeout(() => {
        setFabOpen(false);
      }, 4500);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setFabOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        if (fabTimeoutRef.current) clearTimeout(fabTimeoutRef.current);
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      if (fabTimeoutRef.current) {
        clearTimeout(fabTimeoutRef.current);
        fabTimeoutRef.current = null;
      }
    }
  }, [fabOpen]);

  // Modal & Overlay States
  // Splash Screen (Chains physics & G snapping lock animation)
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    // Show splash whenever launched or refreshed unless dismissed in quick nav
    return sessionStorage.getItem('grip_splash_seen_session') !== '1';
  });

  const [showGripOnboarding, setShowGripOnboarding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('grip_onboarding_seen') !== '1';
  });
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughInitialStep, setWalkthroughInitialStep] = useState<'walkthrough' | 'auth'>('walkthrough');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSmartAiModal, setShowSmartAiModal] = useState(false);
  const [smartAiInitialTab, setSmartAiInitialTab] = useState<'photo' | 'lecture_pdf' | 'text' | 'voice'>('photo');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAndroidInstallModal, setShowAndroidInstallModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<GripTask | null>(null);
  const [openAddExpenseModal, setOpenAddExpenseModal] = useState(false);
  const [showIntentionPanel, setShowIntentionPanel] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [activeWakeUpAlarmTask, setActiveWakeUpAlarmTask] = useState<GripTask | null>(null);
  const [showMorningBriefing, setShowMorningBriefing] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' | 'warn' = 'info') => {
    setToastNotification({ message, type });
    setTimeout(() => setToastNotification(null), 4000);
  };

  // Helper: Quickly set or update One-Shot Wake-Up alarm in calendar for today/tomorrow
  const handleSetWakeUpAlarm = (timeStr: string = '06:30') => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const targetDate = new Date();
    targetDate.setHours(hours, minutes, 0, 0);

    const startTimeISO = targetDate.toISOString();
    const endDate = new Date(targetDate.getTime() + 30 * 60000);
    const endTimeISO = endDate.toISOString();

    // Check if an alarm already exists for this day
    const existingIndex = tasks.findIndex(
      (t) => (t.isWakeUpAlarm || t.category === 'wake_up') &&
        new Date(t.startTime).toDateString() === targetDate.toDateString()
    );

    if (existingIndex > -1) {
      const updated = [...tasks];
      updated[existingIndex] = {
        ...updated[existingIndex],
        startTime: startTimeISO,
        endTime: endTimeISO,
        status: 'pending',
      };
      setTasks(updated);
    } else {
      const newAlarmTask: GripTask = {
        id: `wake-alarm-${Date.now()}`,
        title: 'منبه الصحوة الحاسم ⏰ (One-Shot)',
        category: 'wake_up',
        type: 'FIXED',
        startTime: startTimeISO,
        endTime: endTimeISO,
        status: 'pending',
        postponeCount: 0,
        isWakeUpAlarm: true,
        notes: 'منبه صحوة يطلق مرة واحدة فقط بدون غفوة لبدء اليوم بنشاط.',
      };
      setTasks([newAlarmTask, ...tasks]);
    }
  };

  // Safeguard: normal users cannot remain on android_native tab
  useEffect(() => {
    if (activeTab === 'android_native' && !currentUser?.isDeveloper) {
      setActiveTab('calendar');
    }
  }, [currentUser, activeTab]);

  // PWA / Android Install Deferred Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);

  useEffect(() => {
    // Detect if already installed as standalone Android app
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true)
    ) {
      setIsStandaloneApp(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Real-time Streak Statistics
  const streakStats = calculateStreakStats(trackerHistory, tasks);

  // Direction (Arabic RTL vs English LTR)
  const isRtl = (settings.language || 'ar') !== 'en';

  // Enforcement Overlay Active State
  const [activeOverlayTask, setActiveOverlayTask] = useState<GripTask | null>(null);
  const [sessionEndTask, setSessionEndTask] = useState<GripTask | null>(null);

  // Free Window Countdown State (after a successful continuous hold)
  const [freeWindowSeconds, setFreeWindowSeconds] = useState<number | null>(null);
  const [freeWindowTask, setFreeWindowTask] = useState<GripTask | null>(null);

  // Positive Celebration Confetti
  const [celebrationActive, setCelebrationActive] = useState(false);

  // Sync to storage whenever tasks change
  useEffect(() => {
    storage.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    storage.saveModules(modules);
  }, [modules]);

  useEffect(() => {
    storage.saveSettings(settings);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', !!settings.isDarkMode);
      document.documentElement.setAttribute('data-theme', settings.isDarkMode ? 'dark' : 'light');
    }
  }, [settings]);

  useEffect(() => {
    storage.saveTrackerHistory(trackerHistory);
  }, [trackerHistory]);

  // Free Window Countdown timer
  useEffect(() => {
    if (freeWindowSeconds === null || freeWindowSeconds <= 0) return;

    const timer = setInterval(() => {
      setFreeWindowSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Free window expired! Overlay returns automatically!
          if (freeWindowTask) {
            setActiveOverlayTask(freeWindowTask);
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [freeWindowSeconds, freeWindowTask]);

  // Background check for starting tasks (simulating exact alarms in web)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      // Check if One-Shot Wake-Up Alarm is due
      if (!activeWakeUpAlarmTask && !activeOverlayTask) {
        const dueWakeUp = tasks.find((t) => {
          if (t.status === 'done' || t.status === 'done_early') return false;
          if (!t.isWakeUpAlarm && t.category !== 'wake_up') return false;
          const start = new Date(t.startTime).getTime();
          // Trigger within 5 minutes of start time
          return now >= start && now <= start + 300000;
        });

        if (dueWakeUp) {
          setActiveWakeUpAlarmTask(dueWakeUp);
          return;
        }
      }

      // Check if any pending task's start time arrived and no overlay is currently displayed
      if (!activeOverlayTask && freeWindowSeconds === null) {
        const dueTask = tasks.find((t) => {
          if (t.status === 'done' || t.status === 'done_early') return false;
          if (t.isWakeUpAlarm || t.category === 'wake_up') return false;
          const start = new Date(t.startTime).getTime();
          const end = new Date(t.endTime).getTime();
          return now >= start && now <= end && t.status === 'in_progress';
        });

        if (dueTask) {
          setActiveOverlayTask(dueTask);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [tasks, activeOverlayTask, activeWakeUpAlarmTask, freeWindowSeconds]);

  // Handle successful postpone after continuous hold
  const handlePostponeSuccess = (task: GripTask, freeWindowMinutes: number) => {
    // 1. Increment postpone count for this task
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, postponeCount: t.postponeCount + 1 } : t
    );
    setTasks(updatedTasks);

    // 2. Hide overlay and grant free window
    setActiveOverlayTask(null);
    setFreeWindowTask(task);
    setFreeWindowSeconds(freeWindowMinutes * 60);

    // 3. Update tracker history silently (without negative framing)
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedHistory = trackerHistory.map((rec) =>
      rec.date === todayStr ? { ...rec, postponesCount: rec.postponesCount + 1 } : rec
    );
    setTrackerHistory(updatedHistory);
  };

  // Handle Done Early
  const handleDoneEarly = (task: GripTask) => {
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, status: 'done_early' as const, completedAt: new Date().toISOString() } : t
    );
    setTasks(updatedTasks);

    // Check if linked to study topic, mark topic complete too
    if (task.moduleId && task.topicId) {
      setModules((prev) =>
        prev.map((m) =>
          m.id === task.moduleId
            ? {
                ...m,
                lectures: m.lectures.map((l) => ({
                  ...l,
                  topics: l.topics.map((top) =>
                    top.id === task.topicId ? { ...top, isCompleted: true } : top
                  ),
                })),
              }
            : m
        )
      );
    }

    setActiveOverlayTask(null);
    setFreeWindowSeconds(null);
    setFreeWindowTask(null);

    // Update today's completed count in tracker
    const todayStr = new Date().toISOString().split('T')[0];
    setTrackerHistory((prev) =>
      prev.map((rec) =>
        rec.date === todayStr ? { ...rec, completedTasks: rec.completedTasks + 1 } : rec
      )
    );

    // Trigger celebration confetti!
    setCelebrationActive(true);
  };

  // Handle Session End: Done
  const handleSessionDone = (task: GripTask) => {
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, status: 'done' as const, completedAt: new Date().toISOString() } : t
    );
    setTasks(updatedTasks);
    setSessionEndTask(null);
    setActiveOverlayTask(null);

    // Trigger celebration!
    setCelebrationActive(true);
  };

  // Handle Session End: Extend
  const handleSessionExtend = (task: GripTask, addHours: number, addMinutes: number) => {
    const currentEnd = new Date(task.endTime).getTime();
    const additionalMs = (addHours * 60 + addMinutes) * 60 * 1000;
    const newEnd = new Date(currentEnd + additionalMs).toISOString();

    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, endTime: newEnd, isExtended: true } : t
    );
    setTasks(updatedTasks);
    setSessionEndTask(null);
  };

  // Handle Emergency Exit (60s hold)
  const handleEmergencyExit = (task: GripTask) => {
    setActiveOverlayTask(null);
    setFreeWindowSeconds(null);
    setFreeWindowTask(null);
  };

  // Handle Toggle Task Status (complete or re-open directly with 1-tap)
  const handleToggleTaskStatus = (taskId: string, targetStatus?: GripTask['status']) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = targetStatus || (t.status === 'done' || t.status === 'done_early' ? 'pending' : 'done');
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'done' || nextStatus === 'done_early' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  // Auto-reschedule Flexible Tasks when missed without overlapping fixed tasks
  const handleRunAutoReschedule = () => {
    let rescheduledCount = 0;
    const now = Date.now();

    const updated = tasks.map((t) => {
      if (t.type === 'FLEXIBLE' && t.status === 'pending' && new Date(t.endTime).getTime() < now) {
        rescheduledCount++;
        return autoRescheduleFlexibleTask(t, tasks);
      }
      return t;
    });

    if (rescheduledCount > 0) {
      setTasks(updated);
      triggerToast(`تمت إعادة جدولة ${rescheduledCount} من المهام المرنة بنجاح دون أي تعارض مع المواعيد الثابتة.`, 'success');
    } else {
      triggerToast('جميع المهام المرنة مجدولة بشكل مثالي ولا توجد مهام فائتة تحتاج لإعادة الجدولة.', 'info');
    }
  };

  // Reschedule task via drag and drop
  const handleRescheduleTask = (taskId: string, newStartTime: string, newEndTime: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, startTime: newStartTime, endTime: newEndTime } : t))
    );
  };

  // Save new or edited task
  const handleSaveTask = (task: GripTask) => {
    const exists = tasks.some((t) => t.id === task.id);
    if (exists) {
      setTasks(tasks.map((t) => (t.id === task.id ? task : t)));
    } else {
      setTasks([...tasks, task]);
    }
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  // Save tasks extracted from AI (lectures & companion study sessions)
  const handleSaveAiTasks = (extracted: GripTask[]) => {
    setTasks((prev) => [...prev, ...extracted]);
    const lectureCount = extracted.filter((t) => t.type === 'FIXED' && t.category === 'study').length;
    const studyCount = extracted.filter((t) => t.type === 'FLEXIBLE' && t.category === 'study').length;
    if (lectureCount > 0 && studyCount > 0) {
      triggerToast(
        `تمت جدولة ${lectureCount} محاضرات حضور بالمنبه + ${studyCount} جلسات مذاكرة (ساعتان لكل منها) في التقويم بنجاح.`,
        'success'
      );
    } else {
      triggerToast(`تمت إضافة ${extracted.length} مهام بنجاح إلى التقويم.`, 'success');
    }
  };

  // Save lecture topics from AI PDF splitter
  const handleSaveLectureTopics = (moduleId: string, lecTitle: string, topics: StudyTopic[]) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const newLecture: StudyLecture = {
          id: `lec-${Date.now()}`,
          moduleId: m.id,
          title: lecTitle,
          order: m.lectures.length + 1,
          topics,
        };
        return {
          ...m,
          lectures: [...m.lectures, newLecture],
        };
      })
    );
  };

  // Schedule topic into calendar
  const handleScheduleTopic = (topic: StudyTopic, mod: StudyModule, lec: StudyLecture) => {
    const startTime = new Date(Date.now() + 1800000).toISOString();
    const endTime = new Date(Date.now() + 1800000 + topic.estimatedMinutes * 60000).toISOString();

    const newTask: GripTask = {
      id: `task-topic-${Date.now()}`,
      title: `${mod.title}: ${topic.title}`,
      category: 'study',
      startTime,
      endTime,
      type: 'FLEXIBLE',
      status: 'pending',
      moduleId: mod.id,
      topicId: topic.id,
      postponeCount: 0,
      notes: `جلسة مذاكرة من هرمية المذاكرة (${topic.estimatedMinutes} دقيقة) - ${lec.title}`,
    };

    setTasks([...tasks, newTask]);
    setActiveTab('calendar');
  };

  // Intention Handlers (صندوق النوايا وتفريغ الأفكار لـ ADHD)
  const handleAddIntention = (text: string, tag?: IntentionTag, reminderNote?: string) => {
    const newIntention: GripIntention = {
      id: `intent-${Date.now()}`,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      completed: false,
      tag: tag || 'today',
      reminderNote: reminderNote,
    };
    setIntentions((prev) => [newIntention, ...prev]);
  };

  const handleToggleCompleteIntention = (id: string) => {
    setIntentions((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const nextCompleted = !i.completed;
          if (nextCompleted) {
            setCelebrationActive(true);
          }
          return {
            ...i,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return i;
      })
    );
  };

  const handleDeleteIntention = (id: string) => {
    setIntentions((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCompletedIntentions = () => {
    setIntentions((prev) => prev.filter((i) => !i.completed));
  };

  const handleConvertIntentionToTask = (intention: GripIntention) => {
    // Round to next 15-minute slot from now
    const now = new Date();
    const minutes = Math.ceil((now.getMinutes() + 15) / 15) * 15;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), minutes, 0);
    const end = new Date(start.getTime() + 45 * 60000);

    const newTask: GripTask = {
      id: `task-intent-${Date.now()}`,
      title: intention.text,
      category: intention.tag === 'routine' ? 'sport' : intention.tag === 'idea' ? 'other' : 'personal',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      type: 'FLEXIBLE',
      status: 'pending',
      postponeCount: 0,
      notes: 'تمت جدولتها من صندوق النوايا وتفريغ الذهن',
    };

    setTasks((prev) => [...prev, newTask]);
    setIntentions((prev) =>
      prev.map((i) =>
        i.id === intention.id
          ? { ...i, completed: true, convertedTaskId: newTask.id, completedAt: new Date().toISOString() }
          : i
      )
    );
    setCelebrationActive(true);
    setActiveTab('calendar');
    setShowIntentionPanel(false);
  };

  // Format Free Window remaining mm:ss
  const formatFreeWindowCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-['Cairo',sans-serif] selection:bg-[#7C3AED]/20 selection:text-[#6D28D9] transition-colors duration-200 ${
        settings.isDarkMode ? 'dark bg-[#090D16] text-slate-100' : 'bg-[#F8F9FA] text-[#1E293B]'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Confetti Celebration Particle System */}
      <CelebrationConfetti active={celebrationActive} onComplete={() => setCelebrationActive(false)} />

      {/* FULL-SCREEN SPLASH SCREEN (Metal chains & G snap lock animation) */}
      {showSplash && (
        <div className="fixed inset-0 z-[2147483010]">
          <SplashChainLock
            onFinish={() => {
              setShowSplash(false);
              try {
                sessionStorage.setItem('grip_splash_seen_session', '1');
              } catch (_) {}
            }}
          />
        </div>
      )}

      {/* FULL-SCREEN READY-MADE GRIP ONBOARDING (grip-onboarding.html) */}
      {showGripOnboarding && !showSplash && (
        <GripOnboardingEmbed
          isDarkMode={settings.isDarkMode}
          onComplete={(user) => {
            if (user) {
              setCurrentUser(user);
              storage.saveUser(user);
            }
            setShowGripOnboarding(false);
          }}
        />
      )}

      {/* FULL-SCREEN ONE-SHOT WAKE-UP ALARM MODAL (منبه الصحوة الحاسم) */}
      {activeWakeUpAlarmTask && (
        <WakeUpAlarmModal
          task={activeWakeUpAlarmTask}
          nextTask={
            tasks
              .filter(
                (t) =>
                  t.id !== activeWakeUpAlarmTask.id &&
                  t.status !== 'done' &&
                  t.status !== 'done_early' &&
                  new Date(t.startTime).getTime() > new Date(activeWakeUpAlarmTask.startTime).getTime()
              )
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0] || null
          }
          intentions={intentions}
          isDarkMode={settings.isDarkMode}
          onDismiss={() => {
            // Mark alarm done and celebrate morning victory!
            setTasks((prev) =>
              prev.map((t) =>
                t.id === activeWakeUpAlarmTask.id
                  ? { ...t, status: 'done', completedAt: new Date().toISOString() }
                  : t
              )
            );
            setActiveWakeUpAlarmTask(null);
            setCelebrationActive(true);
            hapticFeedback.success();
            // Trigger Morning Focus Briefing
            setShowMorningBriefing(true);
          }}
        />
      )}

      {/* MORNING FOCUS BRIEFING MODAL */}
      <MorningFocusModal
        isOpen={showMorningBriefing}
        onClose={() => setShowMorningBriefing(false)}
        isDarkMode={settings.isDarkMode}
        tasks={tasks}
        intentions={intentions}
        budget={storage.getBudgets().filter(b => !b.archived)[0] || null}
        onSelectTask={(task) => {
          setTaskToEdit(task);
          setShowTaskModal(true);
        }}
      />

      {/* FULL-SCREEN ENFORCEMENT OVERLAY (SYSTEM_ALERT_WINDOW Simulator) */}
      {activeOverlayTask && (
        <EnforcementOverlay
          task={activeOverlayTask}
          settings={settings}
          onPostponeSuccess={handlePostponeSuccess}
          onDoneEarly={handleDoneEarly}
          onEmergencyExit={handleEmergencyExit}
          onClosePreview={() => setActiveOverlayTask(null)}
        />
      )}

      {/* SESSION END MODAL ("Done" or "Extend") */}
      {sessionEndTask && (
        <SessionEndModal
          task={sessionEndTask}
          onDone={handleSessionDone}
          onExtend={handleSessionExtend}
        />
      )}

      {/* FREE WINDOW COUNTDOWN BANNER (Active after successful hold) */}
      {freeWindowSeconds !== null && freeWindowTask && (
        <div className="sticky top-0 z-40 bg-gradient-to-r from-[#6D28D9] via-[#7C3AED] to-purple-800 text-white px-4 py-2.5 shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-mono font-bold text-xs animate-pulse">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black">نافذة حرة نشطة (Free Window)</span>
                <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-white text-[#6D28D9]">
                  {formatFreeWindowCountdown(freeWindowSeconds)}
                </span>
              </div>
              <p className="text-[11px] text-purple-200 font-medium">
                استخدم هاتفك بحرية. ستعود شاشة الإنفاذ لمهمة "{freeWindowTask.title}" تلقائياً فور انتهاء العداد.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setFreeWindowSeconds(null);
              setActiveOverlayTask(freeWindowTask);
            }}
            className="px-3 py-1.5 rounded-xl bg-white text-[#6D28D9] hover:bg-purple-50 text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
          >
            العودة للإنفاذ الآن
          </button>
        </div>
      )}

      {/* 1. TOP HEADER BAR & DESKTOP NAVIGATION */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0E131F]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 transition-colors shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-black/25 shrink-0 border border-slate-700/20 bg-[#2A2D34] flex items-center justify-center">
              <img
                src="/icon.svg"
                alt="Grip Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/favicon.png';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-wider text-slate-900 dark:text-white">
                  GRIP
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#6D28D9] dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Android Native
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                امسك يومك، لا تدع الوقت يفلت
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Streak Badge */}
            <StreakBadge stats={streakStats} onClick={() => setShowStreakModal(true)} />

            {/* Smart Voice Assistant Button */}
            <button
              type="button"
              onClick={() => setShowVoiceAssistant(true)}
              className="p-2 rounded-xl text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
              title="المساعد الصوتي الذكي"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Smart AI Schedule Button */}
            <button
              type="button"
              onClick={() => {
                setSmartAiInitialTab('photo');
                setShowSmartAiModal(true);
              }}
              className="p-2 rounded-xl text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
              title="الجدولة الذكية بـ AI"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Intentions / Brain Dump Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowIntentionPanel(true)}
              className="p-2 rounded-xl text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors cursor-pointer relative"
              title="تفريغ الذهن وبنك النوايا"
            >
              <Lightbulb className="w-4 h-4" />
              {intentions.filter((i) => !i.completed).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {intentions.filter((i) => !i.completed).length}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, isDarkMode: !s.isDarkMode }))}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title={settings.isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {settings.isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Download Complete Project ZIP Button */}

            {/* Android APK install trigger if available */}
            {!isStandaloneApp && (
              <button
                type="button"
                onClick={() => setShowAndroidInstallModal(true)}
                className="hidden xs:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                title="تثبيت التطبيق على جهاز أندرويد"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">تثبيت التطبيق</span>
                <span className="md:hidden">تثبيت</span>
              </button>
            )}

            {/* Settings Modal Button */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="الإعدادات والنسخ الاحتياطي"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* User Profile / Login */}
            <button
              type="button"
              onClick={() => {
                setWalkthroughInitialStep(currentUser ? 'walkthrough' : 'auth');
                setShowWalkthrough(true);
              }}
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              title={currentUser ? currentUser.name : 'تسجيل الدخول'}
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
              <span className="hidden md:inline max-w-[90px] truncate">
                {currentUser ? currentUser.name : 'دخول'}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Navigation (Desktop & Tablet) */}
        <div className="max-w-6xl mx-auto mt-3 hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-200/60 dark:border-slate-800/60 pt-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-[#6D28D9] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>التقويم والجدول</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('study')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'study'
                ? 'bg-[#6D28D9] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>الهرم الدراسي</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trackers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'trackers'
                ? 'bg-[#6D28D9] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>المتتبعات والعادات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'budget'
                ? 'bg-[#6D28D9] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>الميزانية والمصاريف</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('intentions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'intentions'
                ? 'bg-[#6D28D9] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>النوايا وبنك الأفكار</span>
          </button>

          {currentUser?.isDeveloper && (
            <button
              type="button"
              onClick={() => setActiveTab('android_native')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-indigo-600 dark:text-indigo-400 ${
                activeTab === 'android_native'
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500 shadow-sm'
                  : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>مستودع كود Android APK</span>
            </button>
          )}
        </div>
      </header>

      {/* Global Toast Notification */}
      {toastNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/90 text-white text-xs font-bold shadow-xl backdrop-blur-md border border-slate-700/50 flex items-center gap-2 animate-fadeIn pointer-events-none">
          <span>{toastNotification.message}</span>
        </div>
      )}

      {/* 2. MAIN VIEWPORT CONTENT */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6 pb-24">
        {/* VIEW: CALENDAR & TIMELINE */}
        {activeTab === 'calendar' && (
          <CalendarView
            tasks={tasks}
            onAddTask={() => {
              setTaskToEdit(null);
              setShowTaskModal(true);
            }}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setShowTaskModal(true);
            }}
            onDeleteTask={handleDeleteTask}
            onMarkDoneEarly={handleDoneEarly}
            onTriggerOverlay={(task) => setActiveOverlayTask(task)}
            onRescheduleTask={handleRescheduleTask}
            isDarkMode={settings.isDarkMode}
            streakStats={streakStats}
            onOpenStreak={() => setShowStreakModal(true)}
            showHijriCalendar={settings.showHijriCalendar !== false}
            onSetWakeUpAlarm={(wakeTime) => handleSetWakeUpAlarm(wakeTime)}
            onTriggerWakeUpModal={(task) => setActiveWakeUpAlarmTask(task)}
            onOpenVoiceAssistant={() => setShowVoiceAssistant(true)}
            onToggleTaskStatus={handleToggleTaskStatus}
          />
        )}

        {/* VIEW: STUDY WIKI */}
        {activeTab === 'study' && (
          <StudyHierarchyView
            modules={modules}
            onUpdateModules={(newMods) => setModules(newMods)}
            onScheduleTopic={handleScheduleTopic}
            isDarkMode={settings.isDarkMode}
          />
        )}

        {/* VIEW: TRACKERS & HABITS */}
        {activeTab === 'trackers' && (
          <TrackersView
            trackerHistory={trackerHistory}
            tasks={tasks}
            onTriggerConfetti={() => setCelebrationActive(true)}
            isDarkMode={settings.isDarkMode}
            onOpenStreak={() => setShowStreakModal(true)}
          />
        )}

        {/* VIEW: BUDGET & FINANCE */}
        {activeTab === 'budget' && (
          <BudgetView
            isDarkMode={settings.isDarkMode}
            onTriggerConfetti={() => setCelebrationActive(true)}
            openAddExpenseModal={openAddExpenseModal}
            onCloseAddExpenseModal={() => setOpenAddExpenseModal(false)}
          />
        )}

        {/* VIEW: INTENTIONS & BRAIN DUMP */}
        {activeTab === 'intentions' && (
          <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">💡</span>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    النوايا وبنك الأفكار (Intentions & Second Brain)
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    فرّغ ذهنك من الأفكار والمهام العابرة وحوّلها لمهام مجدولة بضغطة زر.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIntentionPanel(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
              >
                لوحة النوايا السريعة
              </button>
            </div>

            {/* Add intention inline */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151C2C] border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <input
                type="text"
                placeholder="اكتب نية أو فكرة جديدة تلمع في ذهنك... (اضغط Enter للحفظ)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleAddIntention(e.currentTarget.value.trim(), 'today');
                    e.currentTarget.value = '';
                  }
                }}
                className="flex-1 bg-transparent text-sm outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
              <span className="text-[11px] text-slate-400 font-mono">Enter ↵</span>
            </div>

            {/* Intentions List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                النوايا الحالية ({intentions.filter((i) => !i.completed).length})
              </div>
              {intentions.filter((i) => !i.completed).length > 0 ? (
                intentions.filter((i) => !i.completed).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#1E2538] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleCompleteIntention(item.id)}
                        className="w-4 h-4 rounded text-[#6D28D9] border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleConvertIntentionToTask(item)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-purple-400 hover:bg-purple-100 transition-colors cursor-pointer"
                      >
                        جدولة كمهمة 📅
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteIntention(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                        title="حذف"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  ذهنك صافٍ تماماً! لا توجد نوايا غير منجزة.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: ANDROID NATIVE / DEVELOPER */}
        {activeTab === 'android_native' && currentUser?.isDeveloper && (
          <DeveloperWorkspaceView isDarkMode={settings.isDarkMode} />
        )}
      </main>

      {/* 3. ANDROID MATERIAL 3 MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#0E131F]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 pt-1.5 pb-2.5 flex items-center justify-around shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className="flex flex-col items-center gap-0.5 cursor-pointer transition active:scale-95"
        >
          <div
            className={`px-3.5 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
              activeTab === 'calendar'
                ? 'bg-purple-100 dark:bg-purple-950/80 text-[#6D28D9] dark:text-purple-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] tracking-tight ${
              activeTab === 'calendar'
                ? 'text-[#6D28D9] dark:text-purple-300 font-black'
                : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            التقويم
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('study')}
          className="flex flex-col items-center gap-0.5 cursor-pointer transition active:scale-95"
        >
          <div
            className={`px-3.5 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
              activeTab === 'study'
                ? 'bg-purple-100 dark:bg-purple-950/80 text-[#6D28D9] dark:text-purple-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] tracking-tight ${
              activeTab === 'study'
                ? 'text-[#6D28D9] dark:text-purple-300 font-black'
                : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            الدراسة
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trackers')}
          className="flex flex-col items-center gap-0.5 cursor-pointer transition active:scale-95"
        >
          <div
            className={`px-3.5 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
              activeTab === 'trackers'
                ? 'bg-purple-100 dark:bg-purple-950/80 text-[#6D28D9] dark:text-purple-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] tracking-tight ${
              activeTab === 'trackers'
                ? 'text-[#6D28D9] dark:text-purple-300 font-black'
                : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            العادات
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('budget')}
          className="flex flex-col items-center gap-0.5 cursor-pointer transition active:scale-95"
        >
          <div
            className={`px-3.5 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
              activeTab === 'budget'
                ? 'bg-purple-100 dark:bg-purple-950/80 text-[#6D28D9] dark:text-purple-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Wallet className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] tracking-tight ${
              activeTab === 'budget'
                ? 'text-[#6D28D9] dark:text-purple-300 font-black'
                : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            الميزانية
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('intentions')}
          className="flex flex-col items-center gap-0.5 cursor-pointer transition active:scale-95"
        >
          <div
            className={`px-3.5 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
              activeTab === 'intentions'
                ? 'bg-purple-100 dark:bg-purple-950/80 text-[#6D28D9] dark:text-purple-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Lightbulb className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] tracking-tight ${
              activeTab === 'intentions'
                ? 'text-[#6D28D9] dark:text-purple-300 font-black'
                : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            النوايا
          </span>
        </button>
      </nav>

      {/* 4. MATERIAL 3 FAB SPEED DIAL */}
      {fabOpen && (
        <div
          onClick={() => setFabOpen(false)}
          className="fixed inset-0 z-35 bg-black/20 dark:bg-black/40 backdrop-blur-[1px] transition-opacity duration-200"
        />
      )}

      <div
        className={`fixed bottom-20 md:bottom-8 z-40 flex flex-col gap-2 select-none ${
          isRtl ? 'right-6 left-auto items-end' : 'left-6 right-auto items-start'
        }`}
      >
        {fabOpen && (
          <div className={`flex flex-col gap-2.5 mb-2 animate-fadeIn ${isRtl ? 'items-end' : 'items-start'}`}>
            <button
              onClick={() => {
                setFabOpen(false);
                setTaskToEdit(null);
                setShowTaskModal(true);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckSquare className="w-3.5 h-3.5" />
              </div>
              <span>مهمة جديدة</span>
            </button>

            <button
              onClick={() => {
                setFabOpen(false);
                setShowVoiceAssistant(true);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer text-[#6D28D9] dark:text-purple-300"
            >
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-[#6D28D9] dark:text-purple-400 flex items-center justify-center">
                <Mic className="w-3.5 h-3.5" />
              </div>
              <span>المساعد الصوتي</span>
            </button>

            <button
              onClick={() => {
                setFabOpen(false);
                setSmartAiInitialTab('photo');
                setShowSmartAiModal(true);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>الجدولة الذكية بـ AI</span>
            </button>

            <button
              onClick={() => {
                setFabOpen(false);
                setShowIntentionPanel(true);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <span>تفريغ الذهن والنوايا</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setFabOpen((prev) => !prev)}
          className={`w-13 h-13 rounded-2xl text-white shadow-xl flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 bg-gradient-to-tr from-[#6D28D9] to-indigo-600 hover:from-[#5B21B6] hover:to-indigo-700 shadow-[#6D28D9]/30 ${
            fabOpen ? 'rotate-45' : ''
          }`}
          title="إجراء سريع"
        >
          <Plus className="w-6 h-6 transition-transform" />
        </button>
      </div>

      {/* MODALS */}
      {/* Interactive Horizontal Onboarding Carousel & Gmail Login */}
      <WalkthroughAndAuthModal
        isOpen={showWalkthrough}
        initialStep={walkthroughInitialStep}
        onComplete={(user) => {
          setCurrentUser(user);
          storage.saveUser(user);
          setShowWalkthrough(false);
        }}
        isDarkMode={settings.isDarkMode}
        onClose={() => setShowWalkthrough(false)}
      />

      {/* Android Native Install & APK Modal */}
      <AndroidInstallModal
        isOpen={showAndroidInstallModal}
        onClose={() => setShowAndroidInstallModal(false)}
        isDarkMode={settings.isDarkMode}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => setIsStandaloneApp(true)}
        onOpenAndroidCode={() => setActiveTab('android_native')}
      />

      {/* Task Modal (Add/Edit) */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialTask={taskToEdit}
        modules={modules}
        isDarkMode={settings.isDarkMode}
      />

      {/* Smart AI Modal */}
      <SmartAiModal
        isOpen={showSmartAiModal}
        onClose={() => setShowSmartAiModal(false)}
        initialTab={smartAiInitialTab}
        onSaveTasks={handleSaveAiTasks}
        onSaveLectureTopics={handleSaveLectureTopics}
        modules={modules}
        isDarkMode={settings.isDarkMode}
      />

      {/* Onboarding & Permissions Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onFinish={() => setShowOnboarding(false)}
        isDarkMode={settings.isDarkMode}
      />

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings(newSettings)}
        onDataImported={() => {
          setTasks(storage.getTasks());
          setModules(storage.getModules());
          setSettings(storage.getSettings());
          setTrackerHistory(storage.getTrackerHistory());
          setCurrentUser(storage.getUser());
        }}
        currentUser={currentUser}
        onOpenAndroidInstall={() => {
          setShowSettingsModal(false);
          setShowAndroidInstallModal(true);
        }}
        onOpenAuth={() => {
          setShowSettingsModal(false);
          setShowGripOnboarding(true);
        }}
        onLogout={() => {
          storage.clearUser();
          setCurrentUser(null);
          try {
            localStorage.removeItem('grip_onboarding_seen');
          } catch (_) {}
          setShowSettingsModal(false);
          setShowGripOnboarding(true);
        }}
        onReplaySplash={() => setShowSplash(true)}
      />

      {/* Streak Details & Milestone Modal */}
      <StreakModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        stats={streakStats}
        onTriggerConfetti={() => setCelebrationActive(true)}
        isDarkMode={settings.isDarkMode}
      />

      {/* ADHD Brain Dump & Intentions Drawer Panel */}
      <IntentionPanel
        isOpen={showIntentionPanel}
        onClose={() => setShowIntentionPanel(false)}
        intentions={intentions}
        onAddIntention={handleAddIntention}
        onToggleComplete={handleToggleCompleteIntention}
        onDeleteIntention={handleDeleteIntention}
        onClearCompleted={handleClearCompletedIntentions}
        onConvertToTask={handleConvertIntentionToTask}
        isDarkMode={settings.isDarkMode}
      />

      {/* Universal Smart Voice Assistant (يفهم الجداول والمصروف والنوايا والمنبه) */}
      <UniversalVoiceAssistantModal
        isOpen={showVoiceAssistant}
        onClose={() => setShowVoiceAssistant(false)}
        onAddTask={(task) => {
          setTasks((prev) => [task, ...prev]);
          storage.saveTasks([task, ...tasks]);
          setCelebrationActive(true);
        }}
        onSetWakeUpAlarm={(timeStr) => {
          handleSetWakeUpAlarm(timeStr);
          setCelebrationActive(true);
        }}
        onAddIntention={(text, tag) => {
          handleAddIntention(text, tag);
          setCelebrationActive(true);
        }}
        onLogTracker={(_trackerType, value) => {
          const todayStr = new Date().toISOString().split('T')[0];
          setTrackerHistory((prev) => {
            const existing = prev.find((r) => r.date === todayStr);
            if (existing) {
              return prev.map((r) =>
                r.date === todayStr ? { ...r, completedTasks: r.completedTasks + (value || 1) } : r
              );
            }
            return [
              ...prev,
              {
                date: todayStr,
                completedTasks: value || 1,
                postponesCount: 0,
                totalScheduled: 1,
              },
            ];
          });
          setCelebrationActive(true);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
        }}
        isDarkMode={settings.isDarkMode}
      />
    </div>
  );
}
