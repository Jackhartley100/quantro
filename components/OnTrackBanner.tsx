"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/currencyUtils";
import { calculateProjection } from "@/lib/projectionCalculator";

type Transaction = {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string | null;
  hours_spent: number | null;
  created_at: string;
  transaction_date: string | null;
};

type Props = {
  transactions: Transaction[];
  selectedMonth: string;
  selectedYear: string;
  currencySymbol: string;
  viewMode: "monthly" | "yearly";
  monthlyNetGoal?: number | null;
  netMTD?: number;
};

export default function OnTrackBanner({
  transactions,
  selectedMonth,
  selectedYear,
  currencySymbol,
  viewMode,
  monthlyNetGoal,
  netMTD = 0,
}: Props) {
  const projectionData = useMemo(() => {
    // Only show projections for monthly view
    if (viewMode !== "monthly") {
      return null;
    }
    return calculateProjection(transactions, selectedMonth);
  }, [transactions, selectedMonth, viewMode]);

  // Don't show if not monthly view, or if projection shouldn't be shown
  if (!projectionData || !projectionData.shouldShow) {
    if (projectionData && projectionData.daysElapsed < 3 && projectionData.daysElapsed > 0) {
      // Show "too early" message
      return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur px-5 py-4">
          <p className="text-base sm:text-lg font-medium text-neutral-100">
            Too early to project. Add more activity.
          </p>
        </div>
      );
    }
    return null;
  }
  
  if (projectionData.projection === null) {
    return null;
  }

  const { projection, dailyAverage, daysElapsed, isEarlyEstimate, periodType } = projectionData;
  const isNegative = projection < 0;
  const absProjection = Math.abs(projection);
  const formattedProjection = formatCurrency(absProjection, currencySymbol);
  const formattedDaily = formatCurrency(Math.abs(dailyAverage), currencySymbol);
  const periodLabel = periodType === "year" ? "year" : "month";

  // Calculate goal progress (only show if monthlyNetGoal > 0 and viewMode is monthly)
  const shouldShowGoalProgress = viewMode === "monthly" && monthlyNetGoal !== null && monthlyNetGoal > 0;
  const goalProgressPercentage = shouldShowGoalProgress && monthlyNetGoal && monthlyNetGoal > 0
    ? Math.max(0, Math.min(100, Math.round((netMTD / monthlyNetGoal) * 100)))
    : 0;
  
  const formattedNetMTD = formatCurrency(netMTD, currencySymbol, { maximumFractionDigits: 0 });
  const formattedGoal = shouldShowGoalProgress && monthlyNetGoal
    ? formatCurrency(monthlyNetGoal, currencySymbol, { maximumFractionDigits: 0 })
    : "";

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur px-5 py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1 flex-1">
          <p className="text-base sm:text-lg font-medium text-neutral-100">
            {isNegative
              ? `You're on track to lose ~${formattedProjection} this ${periodLabel}.`
              : `You're on track to earn ~${formattedProjection} this ${periodLabel}.`}
            {isEarlyEstimate && (
              <span className="text-sm text-neutral-400 font-normal"> (early estimate)</span>
            )}
          </p>
          <p className="text-xs sm:text-sm text-neutral-400">
            Based on {formattedDaily}/day across {daysElapsed} {daysElapsed === 1 ? "day" : "days"}.
          </p>
        </div>
        {shouldShowGoalProgress && (
          <div className="md:text-right space-y-1.5 mt-3 md:mt-0 md:ml-4 flex-shrink-0">
            <div className="flex items-center gap-2 md:justify-end">
              <span className="text-xs text-neutral-400">Goal</span>
              <div className="relative group">
                <svg
                  className="w-3.5 h-3.5 text-neutral-500 cursor-help"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Monthly net goal progress information"
                  role="img"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 text-xs text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-10 pointer-events-none">
                  Progress toward your monthly net profit goal.
                </div>
              </div>
            </div>
            <div className="text-xs text-neutral-400">
              {formattedNetMTD} / {formattedGoal} — {goalProgressPercentage}%
            </div>
            <div
              className="w-full md:w-48 h-1.5 bg-neutral-800 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={goalProgressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Monthly net goal progress"
            >
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(goalProgressPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

