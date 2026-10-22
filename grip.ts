export type TaskCategory = 'study' | 'work' | 'sport' | 'sleep' | 'wake_up' | 'personal' | 'other';
export type TaskType = 'FIXED' | 'FLEXIBLE';
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'done_early' | 'missed';

export interface GripTask {
  id: string;
  title: string;
  category: TaskCategory;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  type: TaskType;
  status: TaskStatus;
  notes?: string;
  moduleId?: string;
  topicId?: string;
  postponeCount: number;
  completedAt?: string;
  isExtended?: boolean;
  isWakeUpAlarm?: boolean; // One-Shot Wake-Up Alarm (منبه الصحوة الحاسم)
}

export interface StudyTopic {
  id: string;
  lectureId: string;
  title: string;
  estimatedMinutes: number; // 20-40 minutes
  isCompleted: boolean;
  sequenceOrder: number;
  description?: string;
}

export interface StudyLecture {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  topics: StudyTopic[];
}

export interface StudyModule {
  id: string;
  title: string;
  category: string;
  color: string; // Pastel color
  lectures: StudyLecture[];
}

export interface GripSettings {
  freeWindowMinutes: number; // 3 - 5 min, default 4
  baseHoldSeconds: number;   // 10s
  midHoldSeconds: number;    // 20s
  maxHoldSeconds: number;    // 30s
  emergencyExitSeconds: number; // 60s
  allowEmergencyExit: boolean;
  isDarkMode: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  language?: 'ar' | 'en';
  showHijriCalendar?: boolean; // Display Hijri calendar alongside Gregorian
  wakeUpTime?: string; // e.g. "06:30"
  wakeUpEnabled?: boolean;
}

export interface DailyTrackerRecord {
  date: string; // YYYY-MM-DD
  completedTasks: number;
  postponesCount: number;
  totalScheduled: number;
}

export interface GripUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isDeveloper: boolean; // Unlocks developer options and android source views
  joinedAt: string;
  isGoogleUser?: boolean; // Signed in with Google / Gmail
  authProvider?: 'google' | 'email' | 'guest';
}

export interface BudgetModel {
  id: string;
  name: string;
  totalMinor: number;
  currency: string;
  startEpochDay: number;
  durationDays: number;
  archived: boolean;
  createdAt: number;
}

export interface CategoryModel {
  id: string;
  budgetId: string;
  name: string;
  colorIndex: number;
}

export interface ExpenseModel {
  id: string;
  budgetId: string;
  categoryId: string | null;
  amountMinor: number;
  note: string;
  createdAt: number;
}

export type IntentionTag = 'urgent' | 'today' | 'idea' | 'routine';

export interface GripIntention {
  id: string;
  text: string;
  createdAt: string; // ISO
  completed: boolean;
  completedAt?: string;
  tag?: IntentionTag;
  reminderNote?: string;
  convertedTaskId?: string;
}
