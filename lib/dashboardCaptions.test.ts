import { getDashboardCaptions } from './dashboardCaptions';

type Transaction = {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string | null;
  hours_spent: number | null;
  created_at: string;
  transaction_date: string | null;
};

// Simple test runner
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error);
    process.exit(1);
  }
}

function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toContain: (substring: string) => {
      if (typeof actual !== 'string' || !actual.includes(substring)) {
        throw new Error(`Expected "${actual}" to contain "${substring}"`);
      }
    },
    toMatch: (pattern: RegExp) => {
      if (!pattern.test(actual)) {
        throw new Error(`Expected "${actual}" to match ${pattern}`);
      }
    },
  };
}

// Test cases
test('Zero income - net caption should handle zero income', () => {
  const captions = getDashboardCaptions({
    income: 0,
    expenses: 0,
    net: 0,
    effectiveHourly: 0,
    transactions: [],
    rollingIncomeAverage: 0,
    benchmarkHourly: 28,
  });
  
  expect(captions.net).toContain("Margins are thin");
  expect(captions.income).toContain("Tracking your income");
  expect(captions.expenses).toContain("£0 so far");
});

test('Negative net - should show negative message', () => {
  const captions = getDashboardCaptions({
    income: 1000,
    expenses: 1500,
    net: -500,
    effectiveHourly: 0,
    transactions: [
      { id: '1', amount: 1000, type: 'income', category: 'Sales', hours_spent: null, created_at: '2024-01-01', transaction_date: null },
      { id: '2', amount: 1500, type: 'expense', category: 'Supplies', hours_spent: null, created_at: '2024-01-02', transaction_date: null },
    ],
    rollingIncomeAverage: 0,
    benchmarkHourly: 28,
  });
  
  expect(captions.net).toContain("You're negative this month");
});

test('High savings rate - should show excellent message', () => {
  const captions = getDashboardCaptions({
    income: 1000,
    expenses: 300,
    net: 700, // 70% savings rate
    effectiveHourly: 0,
    transactions: [],
    rollingIncomeAverage: 0,
    benchmarkHourly: 28,
  });
  
  expect(captions.net).toContain("Excellent");
  expect(captions.net).toContain("70%");
});

test('Medium savings rate - should show solid message', () => {
  const captions = getDashboardCaptions({
    income: 1000,
    expenses: 600,
    net: 400, // 40% savings rate
    effectiveHourly: 0,
    transactions: [],
    rollingIncomeAverage: 0,
    benchmarkHourly: 28,
  });
  
  expect(captions.net).toContain("Solid");
  expect(captions.net).toContain("40%");
});

test('Low savings rate - should show tight month message', () => {
  const captions = getDashboardCaptions({
    income: 1000,
    expenses: 850,
    net: 150, // 15% savings rate
    effectiveHourly: 0,
    transactions: [],
    rollingIncomeAverage: 0,
    benchmarkHourly: 28,
  });
  
  expect(captions.net).toContain("Tight month");
  expect(captions.net).toContain("15%");
});

test('No expenses - should show zero costs message', () => {
  const captions = getDashboardCaptions({
    income: 1000,
    expenses: 0,
    net: 1000,
    effectiveHourly: 0,
    transactions: [],
    rollingIncomeAverage: 0,
    benchmarkHourly: 28,
  });
  
  expect(captions.expenses).toContain("£0 so far");
});

test('Top expense category - should identify biggest drain', () => {
  const captions = getDashboardCaptions({
    income: 1000,
    expenses: 500,
    net: 500,
    effectiveHourly: 0,
    transactions: [
      { id: '1', amount: 300, type: 'expense', category: 'Supplies', hours_spent: null, created_at: '2024-01-01', transaction_date: null },
      { id: '2', amount: 200, type: 'expense', category: 'Fuel', hours_spent: null, created_at: '2024-01-02', transaction_date: null },
    ],
    rollingIncomeAverage: 0,
    benchmarkHourly: 28,
  });
  
  expect(captions.expenses).toContain("Supplies");
  expect(captions.expenses).toContain("60%"); // 300/500 = 60%
});

test('Income above average - should show pacing above message', () => {
  const captions = getDashboardCaptions({
    income: 1200,
    expenses: 500,
    net: 700,
    effectiveHourly: 0,
    transactions: [],
    rollingIncomeAverage: 1000, // 20% above
    benchmarkHourly: 28,
  });
  
  expect(captions.income).toContain("Pacing above");
});

test('Income below average - should show below pace message', () => {
  const captions = getDashboardCaptions({
    income: 800,
    expenses: 500,
    net: 300,
    effectiveHourly: 0,
    transactions: [],
    rollingIncomeAverage: 1000, // 20% below
    benchmarkHourly: 28,
  });
  
  expect(captions.income).toContain("Below your recent pace");
});

test('Income close to average - should show tracking close message', () => {
  const captions = getDashboardCaptions({
    income: 1050,
    expenses: 500,
    net: 550,
    effectiveHourly: 0,
    transactions: [],
    rollingIncomeAverage: 1000, // Within ±20%
    benchmarkHourly: 28,
  });
  
  expect(captions.income).toContain("Tracking close");
});

test('Elite hourly rate - should show elite message', () => {
  const captions = getDashboardCaptions({
    income: 1000,
    expenses: 200,
    net: 800,
    effectiveHourly: 60, // 2x benchmark of 28
    transactions: [],
    rollingIncomeAverage: 0,
    benchmarkHourly: 28,
  });
  
  expect(captions.hourly).toContain("Elite pace");
});

test('Above average hourly - should show outperforming message', () => {
  const captions = getDashboardCaptions({
    income: 1000,
    expenses: 200,
    net: 800,
    effectiveHourly: 35, // Between 1-2x benchmark
    transactions: [],
    rollingIncomeAverage: 0,
    benchmarkHourly: 28,
  });
  
  expect(captions.hourly).toContain("outperforming the average freelancer");
});

test('Below benchmark hourly - should show below benchmark message', () => {
  const captions = getDashboardCaptions({
    income: 1000,
    expenses: 200,
    net: 800,
    effectiveHourly: 20, // Below benchmark
    transactions: [],
    rollingIncomeAverage: 0,
    benchmarkHourly: 28,
  });
  
  expect(captions.hourly).toContain("Below the £28/hr benchmark");
});

test('Zero hourly - should return empty string', () => {
  const captions = getDashboardCaptions({
    income: 1000,
    expenses: 200,
    net: 800,
    effectiveHourly: 0,
    transactions: [],
    rollingIncomeAverage: 0,
    benchmarkHourly: 28,
  });
  
  expect(captions.hourly).toBe("");
});

test('Uncategorized expenses - should handle null category', () => {
  const captions = getDashboardCaptions({
    income: 1000,
    expenses: 500,
    net: 500,
    effectiveHourly: 0,
    transactions: [
      { id: '1', amount: 500, type: 'expense', category: null, hours_spent: null, created_at: '2024-01-01', transaction_date: null },
    ],
    rollingIncomeAverage: 0,
    benchmarkHourly: 28,
  });
  
  expect(captions.expenses).toContain("Uncategorized");
});

console.log('\n✓ All tests passed!\n');

