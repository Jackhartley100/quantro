"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SummaryCard from "@/components/SummaryCard";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import TransactionListSkeleton from "@/components/TransactionListSkeleton";
import SettingsDrawer, { useSettings } from "@/components/SettingsDrawer";
import DailyNetProfitChart from "@/components/DailyNetProfitChart";
import ExpenseCategoryChart from "@/components/ExpenseCategoryChart";
import OnTrackBanner from "@/components/OnTrackBanner";
import UserBlock from "@/components/UserBlock";
import LedgerTourModal from "@/components/LedgerTourModal";
import { getDashboardCaptions } from "@/lib/dashboardCaptions";
import { getProfile } from "@/app/actions/profile";
import { shouldShowTour, getLocalStorageTourState, setLocalStorageTourSeen, type TourVisibility } from "@/lib/tourVisibility";

type Tx = { id: string; amount: number; type: "income"|"expense"; category: string|null; hours_spent: number|null; created_at: string; transaction_date: string|null };

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [previousMonthTransactions, setPreviousMonthTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletedTransactionIds, setDeletedTransactionIds] = useState<Set<string>>(new Set());
  const deletedIdsRef = useRef<Set<string>>(new Set());
  const { settings: initialSettings, updateSettings } = useSettings();
  const [settings, setSettings] = useState(initialSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "profile">("general");
  const [tourOpen, setTourOpen] = useState(false);
  const [tourVisibility, setTourVisibility] = useState<TourVisibility>("UNKNOWN");
  const [monthlyNetGoal, setMonthlyNetGoal] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  // Reload monthly net goal when settings drawer closes (in case it was updated)
  useEffect(() => {
    if (!settingsOpen) {
      getProfile().then((result) => {
        if (result.ok && result.data) {
          setMonthlyNetGoal(result.data.monthly_net_goal);
        }
      });
    }
  }, [settingsOpen]);

  const handleSettingsChange = (newSettings: typeof initialSettings) => {
    setSettings(newSettings);
    updateSettings(newSettings);
  };
  
  // View mode: 'monthly' or 'yearly'
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">(() => {
    const modeParam = searchParams.get('view');
    return (modeParam === 'yearly' ? 'yearly' : 'monthly') as "monthly" | "yearly";
  });
  
  // Get current month in YYYY-MM format, or from URL
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  
  // Get current year in YYYY format
  const getCurrentYear = () => {
    return String(new Date().getFullYear());
  };
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const monthParam = searchParams.get('m');
    return monthParam || getCurrentMonth();
  });
  
  const [selectedYear, setSelectedYear] = useState(() => {
    const yearParam = searchParams.get('y');
    return yearParam || getCurrentYear();
  });

  const load = useCallback(async (monthOrYear: string, mode: "monthly" | "yearly") => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) { window.location.href = "/login"; return; }
    
    let startDate: string;
    let endDate: string;
    let prevStartDate: string;
    let prevEndDate: string;
    
    if (mode === "yearly") {
      // Yearly view: load entire year
      const year = Number(monthOrYear);
      startDate = new Date(year, 0, 1).toISOString();
      endDate = new Date(year + 1, 0, 1).toISOString();
      
      // Previous year for comparison
      prevStartDate = new Date(year - 1, 0, 1).toISOString();
      prevEndDate = new Date(year, 0, 1).toISOString();
    } else {
      // Monthly view: load specific month
      const [year, monthNum] = monthOrYear.split('-').map(Number);
      startDate = new Date(year, monthNum - 1, 1).toISOString();
      endDate = new Date(year, monthNum, 1).toISOString();
      
      // Previous month for comparison
      const prevMonthDate = new Date(year, monthNum - 2, 1);
      prevStartDate = prevMonthDate.toISOString();
      prevEndDate = new Date(year, monthNum - 1, 1).toISOString();
    }
    
    // Load transactions - we need to load a wider range and filter by transaction_date client-side
    // Load transactions from a wider range to ensure we capture all relevant ones
    const wideStartDate = mode === "yearly" 
      ? new Date(Number(monthOrYear) - 1, 0, 1).toISOString()
      : (() => {
          const [year, monthNum] = monthOrYear.split('-').map(Number);
          return new Date(year, monthNum - 2, 1).toISOString();
        })();
    const wideEndDate = mode === "yearly"
      ? new Date(Number(monthOrYear) + 2, 0, 1).toISOString()
      : (() => {
          const [year, monthNum] = monthOrYear.split('-').map(Number);
          return new Date(year, monthNum + 1, 1).toISOString();
        })();
    
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", wideStartDate)
      .lt("created_at", wideEndDate)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      // Use ref to get current deleted IDs for filtering (always up-to-date)
      const currentDeletedIds = deletedIdsRef.current;
      
      // Filter transactions based on transaction_date (if available) or created_at
      const filterByDate = (tx: Tx, periodStart: string, periodEnd: string) => {
        let txDate: string;
        
        if (tx.transaction_date) {
          // Use transaction_date - parse YYYY-MM-DD and convert to ISO for comparison
          const [year, month, day] = tx.transaction_date.split('-').map(Number);
          txDate = new Date(year, month - 1, day).toISOString();
        } else {
          // Fall back to created_at
          txDate = tx.created_at;
        }
        
        return txDate >= periodStart && txDate < periodEnd;
      };
      
      // Filter current period transactions
      const filtered = data
        .filter(tx => !currentDeletedIds.has(tx.id))
        .filter(tx => filterByDate(tx, startDate, endDate)) as Tx[];
      setTransactions(filtered);
      
      // Filter previous period transactions for comparison
      const prevFiltered = data
        .filter(tx => !currentDeletedIds.has(tx.id))
        .filter(tx => filterByDate(tx, prevStartDate, prevEndDate)) as Tx[];
      setPreviousMonthTransactions(prevFiltered);
      
      // Update deleted IDs - only clean up ones that are confirmed gone from database
      setDeletedTransactionIds(prev => {
        const next = new Set(prev);
        let changed = false;
        prev.forEach(id => {
          const stillInDatabase = data.find(tx => tx.id === id);
          if (!stillInDatabase) {
            // Transaction is confirmed gone from database, safe to remove from tracking
            console.log(`Transaction ${id} confirmed deleted from database`);
            next.delete(id);
            deletedIdsRef.current.delete(id);
            changed = true;
          } else {
            // Transaction still exists in database but was deleted - keep it hidden
            console.log(`Transaction ${id} still in database but marked as deleted - keeping hidden`);
          }
        });
        return changed ? next : prev;
      });
    } else if (error) {
      console.error("Error loading transactions:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => { 
    const period = viewMode === "yearly" ? selectedYear : selectedMonth;
    load(period, viewMode);
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    
    if (viewMode === "yearly") {
      params.set('view', 'yearly');
      const currentYear = getCurrentYear();
      if (selectedYear === currentYear) {
        params.delete('y');
      } else {
        params.set('y', selectedYear);
      }
      params.delete('m'); // Remove month param when in yearly view
    } else {
      params.set('view', 'monthly');
      const currentMonth = getCurrentMonth();
      if (selectedMonth === currentMonth) {
        params.delete('m');
      } else {
        params.set('m', selectedMonth);
      }
      params.delete('y'); // Remove year param when in monthly view
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [selectedMonth, selectedYear, viewMode, load, router, searchParams]);

  // Check if user should see the tour (with no flicker)
  useEffect(() => {
    const checkTourStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setTourVisibility("HIDE");
          return;
        }

        setUserId(user.id);

        // Check localStorage first (fast, but not authoritative)
        const localStorageSeen = getLocalStorageTourState(user.id);

        // Check database (authoritative source)
        const profileResult = await getProfile();
        if (profileResult.ok && profileResult.data) {
          const hasSeenTour = profileResult.data.has_seen_tour;
          const tourDismissedAt = profileResult.data.tour_dismissed_at;
          const goal = profileResult.data.monthly_net_goal;
          
          // Store monthly net goal
          setMonthlyNetGoal(goal);
          
          // Determine visibility using resolver
          const visibility = shouldShowTour({
            dbHasSeenTour: hasSeenTour,
            dbTourDismissedAt: tourDismissedAt,
            localStorageHasSeenTour: localStorageSeen,
          });

          setTourVisibility(visibility);

          // Race condition guard: if localStorage says seen but DB doesn't, update DB in background
          if (localStorageSeen === true && !hasSeenTour && tourDismissedAt === null) {
            // Queue background update (don't await, don't block)
            import("@/app/actions/profile").then(({ markTourAsSeen }) => {
              markTourAsSeen().catch((err) => {
                console.error("Background tour sync failed:", err);
              });
            });
          }

          // Sync localStorage with DB (if DB says seen, update localStorage)
          if (hasSeenTour && localStorageSeen !== true) {
            setLocalStorageTourSeen(user.id);
          }

          // Show tour only if resolver says SHOW
          if (visibility === "SHOW") {
            setTourOpen(true);
          }
        } else {
          // On error, default to HIDE (don't show tour)
          setTourVisibility("HIDE");
        }
      } catch (error) {
        console.error("Error checking tour status:", error);
        // On error, don't block - just don't show tour
        setTourVisibility("HIDE");
      }
    };

    checkTourStatus();
  }, []);

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  };
  
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedYear(e.target.value);
  };
  
  const handleViewModeChange = (mode: "monthly" | "yearly") => {
    setViewMode(mode);
  };

  // For yearly view of current year, only count transactions up to today (YTD)
  // For monthly view or past years, show all transactions in the period
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const todayDateOnly = new Date(currentYear, currentMonth - 1, now.getDate());
  
  const filterToYTD = viewMode === "yearly" && Number(selectedYear) === currentYear;
  
  const getTransactionDate = (tx: Tx): Date => {
    if (tx.transaction_date) {
      const [year, month, day] = tx.transaction_date.split("-").map(Number);
      return new Date(year, month - 1, day);
    } else {
      const createdDateStr = tx.created_at.split("T")[0];
      const [year, month, day] = createdDateStr.split("-").map(Number);
      return new Date(year, month - 1, day);
    }
  };
  
  const transactionsToUse = filterToYTD
    ? transactions.filter(tx => {
        const txDate = getTransactionDate(tx);
        const txDateOnly = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
        return txDateOnly <= todayDateOnly;
      })
    : transactions;
  
  const totalIncome = transactionsToUse.filter(t=>t.type==="income").reduce((a,t)=>a+Number(t.amount),0);
  const totalExpenses = transactionsToUse.filter(t=>t.type==="expense").reduce((a,t)=>a+Number(t.amount),0);
  const net = totalIncome - totalExpenses;
  const totalHours = transactionsToUse.reduce((a,t)=>a+(t.hours_spent ? Number(t.hours_spent) : 0),0);
  const effectiveHourly = totalHours > 0 ? (net / totalHours) : 0;

  // Calculate monthly net goal progress (only for monthly view)
  const netMTD = net; // For monthly view, net is already MTD

  // Calculate previous month values
  const prevTotalIncome = previousMonthTransactions.filter(t=>t.type==="income").reduce((a,t)=>a+Number(t.amount),0);
  const prevTotalExpenses = previousMonthTransactions.filter(t=>t.type==="expense").reduce((a,t)=>a+Number(t.amount),0);
  const prevNet = prevTotalIncome - prevTotalExpenses;
  const prevTotalHours = previousMonthTransactions.reduce((a,t)=>a+(t.hours_spent ? Number(t.hours_spent) : 0),0);
  const prevEffectiveHourly = prevTotalHours > 0 ? (prevNet / prevTotalHours) : 0;

  // Calculate percentage changes
  const calculatePercentageChange = (current: number, previous: number): number | null => {
    // If both are 0, no change
    if (previous === 0 && current === 0) {
      return null;
    }
    // If previous is 0 but current has value, don't show percentage (it's meaningless)
    if (previous === 0 && current !== 0) {
      return null; // Don't show percentage when going from 0 to something
    }
    // If current is 0 but previous had value, show -100%
    if (current === 0 && previous !== 0) {
      return -100;
    }
    // Normal percentage calculation
    return ((current - previous) / previous) * 100;
  };

  const incomeChange = calculatePercentageChange(totalIncome, prevTotalIncome);
  const expensesChange = calculatePercentageChange(totalExpenses, prevTotalExpenses);
  const netChange = calculatePercentageChange(net, prevNet);
  const hourlyChange = calculatePercentageChange(effectiveHourly, prevEffectiveHourly);

  // Calculate rolling 30-day average income (using previous month as proxy)
  // For a true rolling average, we'd need to load transactions from the last 30 days
  const rollingIncomeAverage = prevTotalIncome;

  // Compute captions
  const captions = getDashboardCaptions({
    income: totalIncome,
    expenses: totalExpenses,
    net,
    effectiveHourly,
    transactions: transactionsToUse,
    rollingIncomeAverage,
    benchmarkHourly: 28,
  });

  // Calculate top expense category percentage change for the pill
  const expenseTransactions = transactionsToUse.filter(tx => tx.type === 'expense');
  const prevExpenseTransactions = previousMonthTransactions.filter(tx => tx.type === 'expense');
  
  let topCategoryPercentageChange: number | null = null;
  
  if (expenseTransactions.length > 0 && totalExpenses > 0) {
    // Calculate current period top category
    const categoryTotals: { [key: string]: number } = {};
    expenseTransactions.forEach(tx => {
      const category = tx.category || "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] || 0) + Number(tx.amount);
    });
    
    const topCategory = Object.entries(categoryTotals).reduce((max, [cat, amt]) => 
      amt > max.amount ? { category: cat, amount: amt } : max,
      { category: "", amount: 0 }
    );
    
    if (topCategory.category && topCategory.amount > 0) {
      const currentPercentage = (topCategory.amount / totalExpenses) * 100;
      
      // Calculate previous period top category percentage
      const prevCategoryTotals: { [key: string]: number } = {};
      prevExpenseTransactions.forEach(tx => {
        const category = tx.category || "Uncategorized";
        prevCategoryTotals[category] = (prevCategoryTotals[category] || 0) + Number(tx.amount);
      });
      
      const prevTopCategory = Object.entries(prevCategoryTotals).reduce((max, [cat, amt]) => 
        amt > max.amount ? { category: cat, amount: amt } : max,
        { category: "", amount: 0 }
      );
      
      if (prevTopCategory.category && prevTotalExpenses > 0) {
        // Calculate previous period top category percentage
        const prevPercentage = (prevTopCategory.amount / prevTotalExpenses) * 100;
        
        if (prevTopCategory.category === topCategory.category) {
          // Same category in both periods - compare percentages
          if (prevPercentage > 0) {
            topCategoryPercentageChange = ((currentPercentage - prevPercentage) / prevPercentage) * 100;
          }
        } else {
          // Different top category - compare current top category's percentage to previous top category's percentage
          if (prevPercentage > 0) {
            topCategoryPercentageChange = ((currentPercentage - prevPercentage) / prevPercentage) * 100;
          }
        }
      }
      // If no previous data, don't show the badge (topCategoryPercentageChange remains null)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="space-y-4 sm:space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => {
              setSettingsTab("general");
              setSettingsOpen(true);
            }}
            className="text-xs sm:text-sm text-neutral-400 hover:text-neutral-200 whitespace-nowrap flex-shrink-0"
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="text-xs sm:text-sm text-neutral-400 hover:text-neutral-200 whitespace-nowrap flex-shrink-0"
          >
            Logout
          </button>
          <div className="h-4 w-px bg-neutral-800" />
          <UserBlock onProfileClick={() => {
            setSettingsTab("profile");
            setSettingsOpen(true);
          }} />
        </div>
      </header>

      {/* View Mode Toggle and Date Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewModeChange("monthly")}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-all ${
              viewMode === "monthly"
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-medium"
                : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => handleViewModeChange("yearly")}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-all ${
              viewMode === "yearly"
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-medium"
                : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300"
            }`}
          >
            Yearly
          </button>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-neutral-400 whitespace-nowrap">Viewing:</label>
          {viewMode === "yearly" ? (
            <input
              type="number"
              min="2000"
              max="2099"
              value={selectedYear}
              onChange={handleYearChange}
              className="input w-auto cursor-pointer text-sm sm:text-base"
              placeholder="YYYY"
            />
          ) : (
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              onClick={(e) => {
                const input = e.currentTarget;
                if (typeof input.showPicker === 'function') {
                  input.showPicker();
                }
              }}
              className="input w-auto cursor-pointer text-sm sm:text-base"
            />
          )}
        </div>
      </div>

      {/* Projection Banner */}
      <OnTrackBanner
        transactions={transactions}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        currencySymbol={settings.currencySymbol}
        viewMode={viewMode}
        monthlyNetGoal={monthlyNetGoal}
        netMTD={netMTD}
      />

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 min-w-0 items-stretch">
        <div className="min-w-0 h-full">
          <SummaryCard 
            label="Total Income" 
            value={`${settings.currencySymbol}${totalIncome.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            percentageChange={incomeChange}
            caption={captions.income}
          />
        </div>
        <div className="min-w-0 h-full">
          <SummaryCard 
            label="Total Expenses" 
            value={`${settings.currencySymbol}${totalExpenses.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            percentageChange={expensesChange}
            caption={captions.expenses}
            topCategoryPercentage={topCategoryPercentageChange}
          />
        </div>
        <div className="min-w-0 h-full">
          <SummaryCard 
            label="Net" 
            value={`${settings.currencySymbol}${net.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            percentageChange={netChange}
            caption={captions.net}
          />
        </div>
        <div className="min-w-0 h-full">
          <SummaryCard 
            label="Effective Hourly" 
            value={`${settings.currencySymbol}${effectiveHourly.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            subtitle={effectiveHourly === 0 ? "Add hours to transactions to see your rate." : undefined}
            percentageChange={hourlyChange}
            caption={captions.hourly}
          />
        </div>
      </section>

      {/* Charts Row - Side by Side */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <DailyNetProfitChart
          transactions={transactions}
          currencySymbol={settings.currencySymbol}
          selectedMonth={viewMode === "yearly" ? `${selectedYear}-01` : selectedMonth}
          viewMode={viewMode}
          selectedYear={viewMode === "yearly" ? selectedYear : undefined}
        />
        <ExpenseCategoryChart
          transactions={transactions}
          currencySymbol={settings.currencySymbol}
        />
      </section>

      {/* Form and Transactions Row - Side by Side */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card space-y-4 sm:space-y-6 self-start w-full min-w-0" data-transaction-form>
          <h2 className="text-base sm:text-lg font-semibold text-neutral-100">Add Transaction</h2>
          <TransactionForm onCreated={() => {
            const period = viewMode === "yearly" ? selectedYear : selectedMonth;
            load(period, viewMode);
          }} currencySymbol={settings.currencySymbol} />
        </div>
        <div className="space-y-3 md:space-y-4 min-h-0 w-full min-w-0">
          <h2 className="text-base sm:text-lg font-medium">Recent Transactions</h2>
          {loading ? (
            <TransactionListSkeleton />
          ) : (
            <TransactionList
              items={transactions}
              onReload={() => {
                const period = viewMode === "yearly" ? selectedYear : selectedMonth;
                load(period, viewMode);
              }}
              onDeleted={(id) => {
                // Immediately remove from transactions to fix calculations
                setTransactions(prev => prev.filter(tx => tx.id !== id));
                // Track this as deleted so it doesn't come back on reload
                setDeletedTransactionIds(prev => {
                  const next = new Set(prev).add(id);
                  deletedIdsRef.current = next; // Keep ref in sync
                  return next;
                });
              }}
              currencySymbol={settings.currencySymbol}
            />
          )}
        </div>
      </section>

      <SettingsDrawer 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        initialTab={settingsTab}
      />
      
      {/* Only render modal when visibility is determined (not UNKNOWN) */}
      {tourVisibility !== "UNKNOWN" && (
        <LedgerTourModal 
          isOpen={tourOpen} 
          onClose={() => setTourOpen(false)}
          currencySymbol={settings.currencySymbol}
        />
      )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-neutral-400">Loading...</div>
        </div>
      </div>
    }>
      <DashboardPageContent />
    </Suspense>
  );
}
