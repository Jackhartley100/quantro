type Transaction = {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string | null;
  hours_spent: number | null;
  created_at: string;
  transaction_date: string | null;
};

type ProjectionResult = {
  projection: number | null;
  dailyAverage: number;
  daysElapsed: number;
  totalDays: number;
  shouldShow: boolean;
  isEarlyEstimate: boolean;
  periodType: "month" | "year";
};

/**
 * Calculates month-to-date projection based on transactions
 */
export function calculateProjection(
  transactions: Transaction[],
  selectedMonth: string
): ProjectionResult {
  // Parse the selected month (YYYY-MM format)
  const [year, monthNum] = selectedMonth.split("-").map(Number);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  
  // If viewing a different month than current, don't show projection
  if (year !== currentYear || monthNum !== currentMonth) {
    return {
      projection: null,
      dailyAverage: 0,
      daysElapsed: 0,
      totalDays: 0,
      shouldShow: false,
      isEarlyEstimate: false,
      periodType: "month",
    };
  }
  
  // Calculate days in the month
  const totalDaysInMonth = new Date(year, monthNum, 0).getDate();
  const daysElapsed = currentDay; // Current day of month
  
  // Calculate month-to-date net (income - expenses)
  const mtdIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => {
      // Use transaction_date if available, otherwise use created_at
      let txDate: Date;
      if (tx.transaction_date) {
        const [txYear, txMonth, txDay] = tx.transaction_date.split("-").map(Number);
        txDate = new Date(txYear, txMonth - 1, txDay);
      } else {
        const createdDateStr = tx.created_at.split("T")[0];
        const [txYear, txMonth, txDay] = createdDateStr.split("-").map(Number);
        txDate = new Date(txYear, txMonth - 1, txDay);
      }
      
      // Only count transactions from current month
      if (
        txDate.getFullYear() === year &&
        txDate.getMonth() + 1 === monthNum &&
        txDate.getDate() <= daysElapsed
      ) {
        return sum + Number(tx.amount);
      }
      return sum;
    }, 0);
  
  const mtdExpenses = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => {
      let txDate: Date;
      if (tx.transaction_date) {
        const [txYear, txMonth, txDay] = tx.transaction_date.split("-").map(Number);
        txDate = new Date(txYear, txMonth - 1, txDay);
      } else {
        const createdDateStr = tx.created_at.split("T")[0];
        const [txYear, txMonth, txDay] = createdDateStr.split("-").map(Number);
        txDate = new Date(txYear, txMonth - 1, txDay);
      }
      
      if (
        txDate.getFullYear() === year &&
        txDate.getMonth() + 1 === monthNum &&
        txDate.getDate() <= daysElapsed
      ) {
        return sum + Number(tx.amount);
      }
      return sum;
    }, 0);
  
  const mtdNet = mtdIncome - mtdExpenses;
  const dailyAverage = daysElapsed > 0 ? mtdNet / daysElapsed : 0;
  
  // Too little data - don't show projection
  if (daysElapsed < 3 || transactions.length === 0) {
    return {
      projection: null,
      dailyAverage,
      daysElapsed,
      totalDays: totalDaysInMonth,
      shouldShow: false,
      isEarlyEstimate: false,
      periodType: "month",
    };
  }
  
  // Calculate projection
  const projection = (mtdNet / daysElapsed) * totalDaysInMonth;
  const isEarlyEstimate = daysElapsed <= 2;
  
  return {
    projection,
    dailyAverage,
    daysElapsed,
    totalDays: totalDaysInMonth,
    shouldShow: true,
    isEarlyEstimate,
    periodType: "month",
  };
}

/**
 * Calculates year-to-date projection based on transactions
 */
export function calculateYearlyProjection(
  transactions: Transaction[],
  selectedYear: string
): ProjectionResult {
  const year = Number(selectedYear);
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // If viewing a different year than current, don't show projection
  if (year !== currentYear) {
    return {
      projection: null,
      dailyAverage: 0,
      daysElapsed: 0,
      totalDays: 0,
      shouldShow: false,
      isEarlyEstimate: false,
      periodType: "year",
    };
  }
  
  // Calculate days in the year (handle leap years)
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const totalDaysInYear = isLeapYear ? 366 : 365;
  
  // Calculate days elapsed from Jan 1 to today
  const startOfYear = new Date(year, 0, 1);
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysElapsed = Math.floor((todayDateOnly.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Calculate year-to-date net (income - expenses)
  // Only count transactions up to today (not future-dated ones)
  // Use date-only comparison to match the transaction_date format
  
  const ytdIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => {
      let txDate: Date;
      if (tx.transaction_date) {
        const [txYear, txMonth, txDay] = tx.transaction_date.split("-").map(Number);
        txDate = new Date(txYear, txMonth - 1, txDay);
      } else {
        const createdDateStr = tx.created_at.split("T")[0];
        const [txYear, txMonth, txDay] = createdDateStr.split("-").map(Number);
        txDate = new Date(txYear, txMonth - 1, txDay);
      }
      
      // Normalize to date-only for comparison
      const txDateOnly = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
      
      // Only count transactions from current year up to today (inclusive)
      if (
        txDateOnly.getFullYear() === year &&
        txDateOnly <= todayDateOnly
      ) {
        return sum + Number(tx.amount);
      }
      return sum;
    }, 0);
  
  const ytdExpenses = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => {
      let txDate: Date;
      if (tx.transaction_date) {
        const [txYear, txMonth, txDay] = tx.transaction_date.split("-").map(Number);
        txDate = new Date(txYear, txMonth - 1, txDay);
      } else {
        const createdDateStr = tx.created_at.split("T")[0];
        const [txYear, txMonth, txDay] = createdDateStr.split("-").map(Number);
        txDate = new Date(txYear, txMonth - 1, txDay);
      }
      
      // Normalize to date-only for comparison
      const txDateOnly = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
      
      if (
        txDateOnly.getFullYear() === year &&
        txDateOnly <= todayDateOnly
      ) {
        return sum + Number(tx.amount);
      }
      return sum;
    }, 0);
  
  const ytdNet = ytdIncome - ytdExpenses;
  const dailyAverage = daysElapsed > 0 ? ytdNet / daysElapsed : 0;
  
  // Too little data - don't show projection (need at least 3 days)
  if (daysElapsed < 3 || transactions.length === 0) {
    return {
      projection: null,
      dailyAverage,
      daysElapsed,
      totalDays: totalDaysInYear,
      shouldShow: false,
      isEarlyEstimate: false,
      periodType: "year",
    };
  }
  
  // Calculate projection
  const projection = (ytdNet / daysElapsed) * totalDaysInYear;
  const isEarlyEstimate = daysElapsed <= 2;
  
  return {
    projection,
    dailyAverage,
    daysElapsed,
    totalDays: totalDaysInYear,
    shouldShow: true,
    isEarlyEstimate,
    periodType: "year",
  };
}

