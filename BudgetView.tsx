import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BudgetModel, CategoryModel, ExpenseModel } from '../types/grip';
import { storage } from '../services/storage';
import {
  Wallet,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  AlertCircle,
  TrendingDown,
  Sparkles,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  RotateCcw,
  Tag,
  DollarSign,
  ChevronLeft,
  X,
  Download,
} from 'lucide-react';

interface BudgetViewProps {
  isDarkMode?: boolean;
  onTriggerConfetti?: () => void;
  openAddExpenseModal?: boolean;
  onCloseAddExpenseModal?: () => void;
}

const CATEGORY_COLORS = [
  '#8B5CF6', '#14B8A6', '#EC4899', '#3B82F6',
  '#F59E0B', '#22C55E', '#64748B', '#F43F5E',
];

function colorFor(index: number) {
  if (index < 0) return '#94A3B8';
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

type PaceType = 'ON_TRACK' | 'A_BIT_FAST' | 'SLOW_DOWN' | 'OVER_BUDGET' | 'ENDED';

function parseMinor(input: string): number | null {
  const normalized = input
    .trim()
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[،٫]/g, '.')
    .replace(/\s+/g, '');
  if (!normalized) return null;
  const num = parseFloat(normalized);
  if (isNaN(num) || num <= 0) return null;
  return Math.round(num * 100);
}

function minorToInput(minor: number): string {
  const val = minor / 100;
  return Number.isInteger(val) ? val.toString() : val.toFixed(2);
}

function formatMoney(minor: number, currency: string = 'ج.م'): string {
  const val = Math.abs(minor) / 100;
  const formatted = new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: 2,
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(val);
  return `${formatted} ${currency}`;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  isDarkMode = false,
  onTriggerConfetti,
  openAddExpenseModal,
  onCloseAddExpenseModal,
}) => {
  const [budgets, setBudgets] = useState<BudgetModel[]>(() => storage.getBudgets());
  const [categories, setCategories] = useState<CategoryModel[]>(() => storage.getCategories());
  const [expenses, setExpenses] = useState<ExpenseModel[]>(() => storage.getExpenses());

  // Active budget is the latest non-archived budget
  const currentBudget = useMemo(() => {
    return budgets.filter((b) => !b.archived).sort((a, b) => b.createdAt - a.createdAt)[0] || null;
  }, [budgets]);

  // Modals & Sheets
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState<string | null>(null);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Watch for external trigger to open Add Expense
  useEffect(() => {
    if (openAddExpenseModal) {
      if (!currentBudget) {
        setIsEditingBudget(false);
        setFormTotal('');
        setFormDays('14');
        setFormName('مصاريف الشهر');
        setFormCurrency('ج.م');
        setShowBudgetModal(true);
      } else {
        setExpenseCategory(null);
        setShowAddExpense(true);
      }
      onCloseAddExpenseModal?.();
    }
  }, [openAddExpenseModal, currentBudget, onCloseAddExpenseModal]);

  // Undo delete expense state
  const [lastDeletedExpense, setLastDeletedExpense] = useState<ExpenseModel | null>(null);
  const [undoToastVisible, setUndoToastVisible] = useState(false);

  // Live Sync with storage & voice assistant events
  useEffect(() => {
    const handleSync = () => {
      setExpenses(storage.getExpenses());
      setBudgets(storage.getBudgets());
      setCategories(storage.getCategories());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('grip_expenses_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('grip_expenses_updated', handleSync);
    };
  }, []);

  // Sync with storage
  useEffect(() => {
    storage.saveBudgets(budgets);
  }, [budgets]);

  useEffect(() => {
    storage.saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    storage.saveExpenses(expenses);
  }, [expenses]);

  // Compute stats according to BudgetMath.kt
  const stats = useMemo(() => {
    if (!currentBudget) return null;

    const b = currentBudget;
    const bExpenses = expenses.filter((e) => e.budgetId === b.id);
    const spentMinor = bExpenses.reduce((sum, e) => sum + e.amountMinor, 0);
    const remainingMinor = b.totalMinor - spentMinor;

    const todayEpochDay = Math.floor(Date.now() / (86400 * 1000));
    const passedDays = Math.max(0, todayEpochDay - b.startEpochDay);
    const ended = passedDays >= b.durationDays;
    const dayNumber = Math.min(b.durationDays, Math.max(1, passedDays + 1));
    const daysLeft = ended ? 0 : Math.max(0, b.durationDays - passedDays);

    const allowedSoFar = Math.round((b.totalMinor * dayNumber) / b.durationDays);

    let pace: PaceType = 'ON_TRACK';
    if (remainingMinor < 0) {
      pace = 'OVER_BUDGET';
    } else if (ended) {
      pace = 'ENDED';
    } else if (spentMinor <= allowedSoFar) {
      pace = 'ON_TRACK';
    } else if (spentMinor <= allowedSoFar + allowedSoFar / 4) {
      pace = 'A_BIT_FAST';
    } else {
      pace = 'SLOW_DOWN';
    }

    const perDayMinor = daysLeft > 0 && remainingMinor > 0 ? Math.round(remainingMinor / daysLeft) : 0;

    // Spent today
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const spentTodayMinor = bExpenses
      .filter((e) => e.createdAt >= todayStart)
      .reduce((sum, e) => sum + e.amountMinor, 0);

    // Predict days until budget runs out
    let runsOutInDays: number | null = null;
    if (!ended && remainingMinor > 0 && spentMinor > 0 && dayNumber >= 3) {
      const dailyBurn = spentMinor / dayNumber;
      const d = Math.round(remainingMinor / dailyBurn);
      if (d < daysLeft) {
        runsOutInDays = d;
      }
    }

    const total = Math.max(1, b.totalMinor);
    const spendFraction = Math.min(1, Math.max(0, spentMinor / total));
    const allowedFraction = Math.min(1, Math.max(0, allowedSoFar / total));

    // Category totals
    const catTotals = categories.map((c) => {
      const catSpent = bExpenses
        .filter((e) => e.categoryId === c.id)
        .reduce((sum, e) => sum + e.amountMinor, 0);
      return {
        id: c.id,
        name: c.name,
        colorIndex: c.colorIndex,
        spentMinor: catSpent,
      };
    });

    // Other / unassigned
    const otherSpent = bExpenses
      .filter((e) => !e.categoryId)
      .reduce((sum, e) => sum + e.amountMinor, 0);
    if (otherSpent > 0) {
      catTotals.push({
        id: 'other',
        name: 'أخرى',
        colorIndex: -1,
        spentMinor: otherSpent,
      });
    }

    return {
      spentMinor,
      remainingMinor,
      dayNumber,
      durationDays: b.durationDays,
      daysLeft,
      perDayMinor,
      spentTodayMinor,
      spendFraction,
      allowedFraction,
      pace,
      runsOutInDays,
      catTotals,
      bExpenses,
    };
  }, [currentBudget, expenses, categories]);

  // Actions
  const handleStartBudget = (totalMinor: number, days: number, name: string, currency: string) => {
    const todayEpochDay = Math.floor(Date.now() / (86400 * 1000));
    // Archive existing active budgets
    const updated = budgets.map((b) => ({ ...b, archived: true }));
    const newBudget: BudgetModel = {
      id: 'budget_' + Date.now(),
      name: name.trim() || 'ميزانية جديدة',
      totalMinor,
      currency: currency || 'ج.م',
      startEpochDay: todayEpochDay,
      durationDays: Math.min(366, Math.max(1, days)),
      archived: false,
      createdAt: Date.now(),
    };
    setBudgets([newBudget, ...updated]);
    setShowBudgetModal(false);
    if (onTriggerConfetti) onTriggerConfetti();
  };

  const handleEditBudget = (totalMinor: number, days: number, name: string, currency: string) => {
    if (!currentBudget) return;
    const updated = budgets.map((b) => {
      if (b.id === currentBudget.id) {
        return {
          ...b,
          totalMinor,
          durationDays: Math.min(366, Math.max(1, days)),
          name: name.trim() || b.name,
          currency: currency || b.currency,
        };
      }
      return b;
    });
    setBudgets(updated);
    setShowBudgetModal(false);
  };

  const handleAddExpense = (amountMinor: number, categoryId: string | null, note: string) => {
    if (!currentBudget) return;
    const newExpense: ExpenseModel = {
      id: 'exp_' + Date.now(),
      budgetId: currentBudget.id,
      categoryId: categoryId === 'other' ? null : categoryId,
      amountMinor,
      note: note.trim(),
      createdAt: Date.now(),
    };
    setExpenses([newExpense, ...expenses]);
    setShowAddExpense(false);
  };

  const handleDeleteExpense = (expense: ExpenseModel) => {
    setLastDeletedExpense(expense);
    setExpenses(expenses.filter((e) => e.id !== expense.id));
    setUndoToastVisible(true);
    setTimeout(() => {
      setUndoToastVisible(false);
    }, 4500);
  };

  const handleUndoDelete = () => {
    if (lastDeletedExpense) {
      setExpenses([lastDeletedExpense, ...expenses]);
      setLastDeletedExpense(null);
      setUndoToastVisible(false);
    }
  };

  const handleAddCategory = (name: string) => {
    const clean = name.trim().slice(0, 24);
    if (!clean) return;
    // Check if exists
    const existing = categories.find((c) => c.name.toLowerCase() === clean.toLowerCase());
    if (existing) {
      setSelectedCategoryForAdd(existing.id);
      setShowNewCategoryModal(false);
      return;
    }
    const newCat: CategoryModel = {
      id: 'cat_' + Date.now(),
      budgetId: currentBudget?.id || 'default',
      name: clean,
      colorIndex: categories.length % CATEGORY_COLORS.length,
    };
    setCategories([...categories, newCat]);
    setSelectedCategoryForAdd(newCat.id);
    setShowNewCategoryModal(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter((c) => c.id !== categoryId));
  };

  // Pace styling and text
  const paceConfig = useMemo(() => {
    if (!stats) return { text: '', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    switch (stats.pace) {
      case 'ON_TRACK':
        return { text: 'ضمن المعدل الطبيعي', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/15' };
      case 'A_BIT_FAST':
        return { text: 'استهلاك مرتفع نسبياً', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15' };
      case 'SLOW_DOWN':
        return { text: 'تجاوز حد الإنفاق اليومي', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/15' };
      case 'OVER_BUDGET':
        return { text: 'تجاوزت الميزانية المحددة', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/15' };
      case 'ENDED':
        return { text: 'انتهت الفترة المحددة', color: 'text-slate-500', bg: 'bg-slate-200 dark:bg-slate-800' };
    }
  }, [stats]);

  // Form states for New / Edit Budget
  const [formTotal, setFormTotal] = useState('');
  const [formDays, setFormDays] = useState('14');
  const [formName, setFormName] = useState('');
  const [formCurrency, setFormCurrency] = useState('ج.م');
  const [formError, setFormError] = useState(false);

  // Form states for Quick Add Expense
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<string | null>(null);
  const [expenseNote, setExpenseNote] = useState('');
  const [expenseError, setExpenseError] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddExpense) {
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [showAddExpense]);

  return (
    <div className="w-full flex flex-col gap-5 select-none relative pb-10">
      {/* Undo Toast Notification */}
      {undoToastVisible && lastDeletedExpense && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border border-purple-500/30 animate-bounce">
          <span>اتمسح المصروف ({formatMoney(lastDeletedExpense.amountMinor, currentBudget?.currency)})</span>
          <button
            onClick={handleUndoDelete}
            className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تراجع</span>
          </button>
        </div>
      )}

      {/* CASE 1: EMPTY STATE — NO ACTIVE BUDGET */}
      {!currentBudget ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto my-12">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mb-6 shadow-xl shadow-emerald-900/30">
            <Wallet className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">فلوسك بطريقتك</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed font-medium">
            حدد المبلغ والمدة اللي هيكفيها. وضيف الفئات وانت ماشي بدون حسابات معقدة ولا توتر.
          </p>
          <button
            onClick={() => {
              setIsEditingBudget(false);
              setFormTotal('');
              setFormDays('14');
              setFormName('مصاريف الشهر');
              setFormCurrency('ج.م');
              setShowBudgetModal(true);
            }}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>ابدأ ميزانية جديدة</span>
          </button>
        </div>
      ) : (
        /* CASE 2: ACTIVE BUDGET VIEW */
        stats && (
          <>
            {/* 1. Header with Budget Name and Dropdown Actions */}
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{currentBudget.name}</span>
                  <span className="text-xs font-bold text-slate-400">
                    (اليوم {stats.dayNumber} من {stats.durationDays})
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  من إجمالي {formatMoney(currentBudget.totalMinor, currentBudget.currency)}
                </p>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="خيارات"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {showMenu && (
                  <div className="absolute left-0 top-10 z-30 w-44 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs font-bold animate-fadeIn">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsEditingBudget(true);
                        setFormTotal(minorToInput(currentBudget.totalMinor));
                        setFormDays(currentBudget.durationDays.toString());
                        setFormName(currentBudget.name);
                        setFormCurrency(currentBudget.currency);
                        setShowBudgetModal(true);
                      }}
                      className="w-full px-4 py-2.5 text-right hover:bg-purple-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <Edit3 className="w-4 h-4 text-purple-600" />
                      <span>تعديل الميزانية</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsEditingBudget(false);
                        setFormTotal('');
                        setFormDays('14');
                        setFormName('');
                        setFormCurrency(currentBudget.currency);
                        setShowBudgetModal(true);
                      }}
                      className="w-full px-4 py-2.5 text-right hover:bg-purple-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <Plus className="w-4 h-4 text-purple-600" />
                       <span>ميزانية جديدة</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        // Export expenses to CSV
                        const categoryMap = new Map(categories.map(c => [c.id, c.name]));
                        let csvContent = '\uFEFF'; // BOM for Excel UTF-8 arabic support
                        csvContent += 'التاريخ,المبلغ,العملة,الفئة,الملاحظات\n';
                        stats.bExpenses.forEach(exp => {
                          const dateStr = new Date(exp.createdAt).toLocaleDateString('ar-EG');
                          const amount = (exp.amountMinor / 100).toFixed(2);
                          const catName = exp.categoryId ? (categoryMap.get(exp.categoryId) || 'فئة') : 'أخرى';
                          const note = `"${(exp.note || '').replace(/"/g, '""')}"`;
                          csvContent += `${dateStr},${amount},${currentBudget.currency},${catName},${note}\n`;
                        });
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `grip-expenses-${currentBudget.name}-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full px-4 py-2.5 text-right hover:bg-purple-50 dark:hover:bg-slate-700 flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
                    >
                      <Download className="w-4 h-4 text-emerald-500" />
                      <span>تصدير إكسيل (CSV)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Main Summary Card (ADHD Trajectory & SpendBar) */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">المبلغ المتبقي</span>
                <span className={`text-xs font-black px-3 py-1 rounded-full ${paceConfig.bg} ${paceConfig.color}`}>
                  {paceConfig.text}
                </span>
              </div>

              <div>
                <h1
                  className={`text-4xl sm:text-5xl font-black tracking-tight ${
                    stats.remainingMinor < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatMoney(stats.remainingMinor, currentBudget.currency)}
                </h1>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  {stats.remainingMinor < 0
                    ? 'زيادة عن الميزانية المحددة'
                    : `متبقي من ${formatMoney(currentBudget.totalMinor, currentBudget.currency)}`}
                </p>
              </div>

              {/* Dual-marker Spend Bar */}
              <div className="relative w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1">
                {/* User spend progress fill */}
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.spendFraction * 100}%`,
                    backgroundColor:
                      stats.pace === 'ON_TRACK'
                        ? '#10B981'
                        : stats.pace === 'A_BIT_FAST'
                        ? '#F59E0B'
                        : stats.pace === 'SLOW_DOWN'
                        ? '#EA580C'
                        : '#DC2626',
                  }}
                />
                {/* Thin marker indicating expected timeline release */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-slate-900 dark:bg-white z-10"
                  style={{ left: `${stats.allowedFraction * 100}%` }}
                  title="المعدل الطبيعي المفترض لليوم"
                />
              </div>

              {/* Bottom Insights */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
                {stats.daysLeft > 0 && stats.remainingMinor > 0 && (
                  <p className="text-slate-700 dark:text-slate-200">
                    <span className="font-bold text-[#6D28D9] dark:text-purple-400">
                      {formatMoney(stats.perDayMinor, currentBudget.currency)}
                    </span>{' '}
                    في اليوم · باقي {stats.daysLeft} يوم
                  </p>
                )}

                {stats.runsOutInDays !== null && (
                  <p className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>بالمعدل ده الفلوس بتكفي {stats.runsOutInDays} أيام تقريباً</span>
                  </p>
                )}

                {stats.spentTodayMinor > 0 && (
                  <p className="text-slate-400">
                    صرفت النهاردة: {formatMoney(stats.spentTodayMinor, currentBudget.currency)}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Categories Chips Horizontal Row */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400">الأقسام والتصنيفات</span>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                  اضغط على أي فئة لإضافة مصروف
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {stats.catTotals.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategoryForAdd(c.id === 'other' ? null : c.id);
                      setExpenseCategory(c.id === 'other' ? null : c.id);
                      setShowAddExpense(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 shadow-2xs transition active:scale-95 shrink-0 cursor-pointer text-right"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: colorFor(c.colorIndex) }}
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {c.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatMoney(c.spentMinor, currentBudget.currency)}
                      </span>
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => setShowNewCategoryModal(true)}
                  className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>جديدة</span>
                </button>
              </div>
            </div>

            {/* 4. Recent Expenses List */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400">آخر المصروفات</span>
                  <span className="text-xs font-bold text-slate-400">({stats.bExpenses.length})</span>
                </div>
                <button
                  onClick={() => {
                    setExpenseCategory(null);
                    setShowAddExpense(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تسجيل مصروف</span>
                </button>
              </div>

              {stats.bExpenses.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-3">
                  <p className="text-xs text-slate-400 font-medium">لسه ماصرفتش حاجة. اضغط على الزر لما تصرف.</p>
                  <button
                    onClick={() => {
                      setExpenseCategory(null);
                      setShowAddExpense(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>تسجيل مصروف جديد</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {stats.bExpenses.map((expense) => {
                    const cat = categories.find((c) => c.id === expense.categoryId);
                    const catName = cat?.name || 'أخرى';
                    const color = colorFor(cat?.colorIndex ?? -1);
                    const timeStr = new Date(expense.createdAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs group hover:border-slate-300 transition-all duration-200 hover:scale-[1.005]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {expense.note || catName}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {expense.note ? `${catName} · ` : ''}
                              {timeStr}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {formatMoney(expense.amountMinor, currentBudget.currency)}
                          </span>
                          <button
                            onClick={() => handleDeleteExpense(expense)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="حذف المصروف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )
      )}

      {/* MODAL 1: START OR EDIT BUDGET */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isEditingBudget ? 'تعديل الميزانية' : 'ميزانية جديدة'}
              </h3>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">المبلغ الكلي</label>
              <div className="relative">
                <input
                  type="text"
                  value={formTotal}
                  onChange={(e) => {
                    setFormTotal(e.target.value);
                    setFormError(false);
                  }}
                  placeholder="مثال: 5000"
                  className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border ${
                    formError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  } text-xl font-black text-slate-900 dark:text-white outline-hidden focus:border-[#6D28D9]`}
                />
                <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-400">
                  {formCurrency}
                </span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">لمدة كام يوم؟</label>
              <div className="flex items-center gap-2">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFormDays(d.toString())}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      formDays === d.toString()
                        ? 'bg-[#6D28D9] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {d} أيام
                  </button>
                ))}
                <input
                  type="number"
                  value={formDays}
                  onChange={(e) => setFormDays(e.target.value)}
                  className="w-20 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-center text-slate-900 dark:text-white outline-hidden"
                  placeholder="أيام"
                />
              </div>
            </div>

            {/* Name & Currency */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">الاسم (اختياري)</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مصاريف الشهر"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-hidden"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">العملة</label>
                <input
                  type="text"
                  value={formCurrency}
                  onChange={(e) => setFormCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-hidden"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const minor = parseMinor(formTotal);
                const d = parseInt(formDays, 10);
                if (!minor || isNaN(d) || d < 1) {
                  setFormError(true);
                  return;
                }
                if (isEditingBudget) {
                  handleEditBudget(minor, d, formName, formCurrency);
                } else {
                  handleStartBudget(minor, d, formName, formCurrency);
                }
              }}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer mt-2"
            >
              {isEditingBudget ? 'حفظ التعديلات' : 'ابدأ الميزانية'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK ADD EXPENSE */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col gap-4 animate-slideUp sm:animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>تسجيل مصروف جديد</span>
              </h3>
              <button
                onClick={() => setShowAddExpense(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">المبلغ</label>
              <div className="relative">
                <input
                  ref={amountInputRef}
                  type="text"
                  value={expenseAmount}
                  onChange={(e) => {
                    setExpenseAmount(e.target.value);
                    setExpenseError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const minor = parseMinor(expenseAmount);
                      if (minor) handleAddExpense(minor, expenseCategory, expenseNote);
                      else setExpenseError(true);
                    }
                  }}
                  placeholder="0.00"
                  className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border ${
                    expenseError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  } text-2xl font-black text-slate-900 dark:text-white outline-hidden focus:border-emerald-500`}
                />
                <span className="absolute left-4 top-4 text-xs font-bold text-slate-400">
                  {currentBudget?.currency}
                </span>
              </div>
              {expenseError && (
                <p className="text-[11px] text-rose-500 font-bold mt-1">اكتب مبلغ صالح</p>
              )}
            </div>

            {/* Category Select Chips */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">الفئة</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setExpenseCategory(expenseCategory === c.id ? null : c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      expenseCategory === c.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: colorFor(c.colorIndex) }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(true)}
                  className="px-2.5 py-1.5 rounded-xl border border-dashed border-emerald-400 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-50 cursor-pointer"
                >
                  + جديدة
                </button>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">ملاحظة (اختياري)</label>
              <input
                type="text"
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                placeholder="مثال: قهوة وساندوتش"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-hidden focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => {
                const minor = parseMinor(expenseAmount);
                if (!minor) {
                  setExpenseError(true);
                  return;
                }
                handleAddExpense(minor, expenseCategory, expenseNote);
              }}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer mt-1"
            >
              إضافة المصروف
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW CATEGORY */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl flex flex-col gap-3">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">فئة جديدة</h4>
            <input
              type="text"
              id="newCatInput"
              autoFocus
              placeholder="اسم الفئة (مثلاً: كتب)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget.value;
                  handleAddCategory(input);
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-hidden"
            />
            <div className="flex gap-2 justify-end mt-1">
              <button
                onClick={() => setShowNewCategoryModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('newCatInput') as HTMLInputElement;
                  if (el) handleAddCategory(el.value);
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
