import { GripTask, StudyModule, GripSettings, DailyTrackerRecord, GripUser, BudgetModel, CategoryModel, ExpenseModel } from '../types/grip';
import { INITIAL_TASKS, INITIAL_MODULES, DEFAULT_SETTINGS, INITIAL_TRACKER_HISTORY } from '../data/initialData';

const TASKS_KEY = 'grip_tasks_v1';
const MODULES_KEY = 'grip_modules_v1';
const SETTINGS_KEY = 'grip_settings_v1';
const TRACKERS_KEY = 'grip_trackers_v1';
const USER_KEY = 'grip_user_v1';

export const storage = {
  getUser(): GripUser | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveUser(user: GripUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearUser(): void {
    localStorage.removeItem(USER_KEY);
  },
  getTasks(): GripTask[] {
    try {
      const data = localStorage.getItem(TASKS_KEY);
      return data ? JSON.parse(data) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  },

  saveTasks(tasks: GripTask[]): void {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },

  getModules(): StudyModule[] {
    try {
      const data = localStorage.getItem(MODULES_KEY);
      return data ? JSON.parse(data) : INITIAL_MODULES;
    } catch {
      return INITIAL_MODULES;
    }
  },

  saveModules(modules: StudyModule[]): void {
    localStorage.setItem(MODULES_KEY, JSON.stringify(modules));
  },

  getSettings(): GripSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: GripSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  getTrackerHistory(): DailyTrackerRecord[] {
    try {
      const data = localStorage.getItem(TRACKERS_KEY);
      return data ? JSON.parse(data) : INITIAL_TRACKER_HISTORY;
    } catch {
      return INITIAL_TRACKER_HISTORY;
    }
  },

  saveTrackerHistory(records: DailyTrackerRecord[]): void {
    localStorage.setItem(TRACKERS_KEY, JSON.stringify(records));
  },

  exportFullBackup(): string {
    const backup = {
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      tasks: this.getTasks(),
      modules: this.getModules(),
      settings: this.getSettings(),
      trackerHistory: this.getTrackerHistory(),
      budgets: this.getBudgets(),
      categories: this.getCategories(),
      expenses: this.getExpenses(),
      intentions: this.getIntentions(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.tasks) this.saveTasks(parsed.tasks);
      if (parsed.modules) this.saveModules(parsed.modules);
      if (parsed.settings) this.saveSettings(parsed.settings);
      if (parsed.trackerHistory) this.saveTrackerHistory(parsed.trackerHistory);
      if (parsed.budgets) this.saveBudgets(parsed.budgets);
      if (parsed.categories) this.saveCategories(parsed.categories);
      if (parsed.expenses) this.saveExpenses(parsed.expenses);
      if (parsed.intentions) this.saveIntentions(parsed.intentions);
      return true;
    } catch (e) {
      console.error('Failed to import backup', e);
      return false;
    }
  },

  resetToDefaults(): void {
    localStorage.removeItem(TASKS_KEY);
    localStorage.removeItem(MODULES_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(TRACKERS_KEY);
  },

  getBudgets(): BudgetModel[] {
    try {
      const data = localStorage.getItem('grip_budgets_v1');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveBudgets(budgets: BudgetModel[]): void {
    localStorage.setItem('grip_budgets_v1', JSON.stringify(budgets));
  },

  getCategories(): CategoryModel[] {
    try {
      const data = localStorage.getItem('grip_categories_v1');
      return data ? JSON.parse(data) : [
        { id: 'cat_1', budgetId: 'default', name: 'أكل ومشاريب', colorIndex: 0 },
        { id: 'cat_2', budgetId: 'default', name: 'مواصلات', colorIndex: 1 },
        { id: 'cat_3', budgetId: 'default', name: 'مذاكرة وكورسات', colorIndex: 2 },
        { id: 'cat_4', budgetId: 'default', name: 'خروجات وترفيه', colorIndex: 3 },
      ];
    } catch {
      return [];
    }
  },

  saveCategories(categories: CategoryModel[]): void {
    localStorage.setItem('grip_categories_v1', JSON.stringify(categories));
  },

  getExpenses(): ExpenseModel[] {
    try {
      const data = localStorage.getItem('grip_expenses_v1');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveExpenses(expenses: ExpenseModel[]): void {
    localStorage.setItem('grip_expenses_v1', JSON.stringify(expenses));
  },

  getIntentions(): import('../types/grip').GripIntention[] {
    try {
      const data = localStorage.getItem('grip_intentions_v1');
      if (data) return JSON.parse(data);
      // Helpful default starter intentions for ADHD
      return [
        {
          id: 'intent_1',
          text: 'شرب كوب ماء كبير وترطيب الجسم',
          createdAt: new Date().toISOString(),
          completed: false,
          tag: 'routine',
        },
        {
          id: 'intent_2',
          text: 'مراجعة أول 3 صفحات من المحاضرة بهدوء',
          createdAt: new Date().toISOString(),
          completed: false,
          tag: 'today',
        },
        {
          id: 'intent_3',
          text: 'ترتيب سطح المكتب لمدة دقيقتين',
          createdAt: new Date().toISOString(),
          completed: false,
          tag: 'idea',
        },
      ];
    } catch {
      return [];
    }
  },

  saveIntentions(intentions: import('../types/grip').GripIntention[]): void {
    localStorage.setItem('grip_intentions_v1', JSON.stringify(intentions));
  }
};
