type Transaction = {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string | null;
  hours_spent: number | null;
  created_at: string;
  transaction_date: string | null;
};

export type Captions = {
  income: string;
  expenses: string;
  net: string;
  hourly: string;
};

type GetDashboardCaptionsParams = {
  income: number;
  expenses: number;
  net: number;
  effectiveHourly: number;
  transactions: Transaction[];
  rollingIncomeAverage?: number;
  benchmarkHourly?: number;
  currencySymbol?: string;
};

export function getDashboardCaptions({
  income,
  expenses,
  net,
  effectiveHourly,
  transactions,
  rollingIncomeAverage = 0,
  benchmarkHourly = 28,
  currencySymbol = '£',
}: GetDashboardCaptionsParams): Captions {
  // Net caption
  const savingsRate = income > 0 ? net / income : 0;
  let netCaption: string;
  
  if (net < 0) {
    netCaption = "You're negative this month. A small cut to top costs would help.";
  } else if (savingsRate >= 0.6) {
    const pct = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 0 }).format(savingsRate);
    netCaption = `Excellent. You're keeping ${pct} of every ${currencySymbol}1 earned.`;
  } else if (savingsRate >= 0.3) {
    const pct = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 0 }).format(savingsRate);
    netCaption = `Solid. You're keeping ${pct} of every ${currencySymbol}1 earned.`;
  } else if (savingsRate >= 0.1) {
    const pct = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 0 }).format(savingsRate);
    netCaption = `Tight month. Keeping ${pct} per ${currencySymbol}1.`;
  } else {
    netCaption = "Margins are thin. Consider trimming a top expense.";
  }

  // Expenses caption
  let expensesCaption: string;
  const expenseTransactions = transactions.filter(tx => tx.type === 'expense');
  
  if (expenseTransactions.length === 0 || expenses === 0) {
    expensesCaption = `You've kept costs at ${currencySymbol}0 so far.`;
  } else {
    // Find top expense category
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
      const share = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 0 }).format(
        topCategory.amount / expenses
      );
      expensesCaption = `Biggest drain is ${topCategory.category} (${share}). Worth a review?`;
    } else {
      expensesCaption = `You've kept costs at ${currencySymbol}0 so far.`;
    }
  }

  // Income caption
  let incomeCaption: string;
  if (rollingIncomeAverage === 0 || rollingIncomeAverage === undefined) {
    // No historical data, use neutral message
    incomeCaption = "Tracking your income this month.";
  } else {
    const change = (income - rollingIncomeAverage) / rollingIncomeAverage;
    if (change >= 0.2) {
      incomeCaption = "Pacing above your recent average. Keep it up.";
    } else if (change <= -0.2) {
      incomeCaption = "Below your recent pace. Any invoices pending?";
    } else {
      incomeCaption = "Tracking close to your usual.";
    }
  }

  // Effective Hourly caption
  let hourlyCaption: string;
  if (effectiveHourly === 0) {
    hourlyCaption = ""; // Don't show caption if no hourly data
  } else if (effectiveHourly >= benchmarkHourly * 2) {
    hourlyCaption = "Elite pace. Well above average.";
  } else if (effectiveHourly >= benchmarkHourly) {
    hourlyCaption = "You're outperforming the average freelancer.";
  } else {
    hourlyCaption = `Below the ${currencySymbol}${benchmarkHourly}/hr benchmark. Higher-value work or pricing may help.`;
  }

  return {
    income: incomeCaption,
    expenses: expensesCaption,
    net: netCaption,
    hourly: hourlyCaption,
  };
}

