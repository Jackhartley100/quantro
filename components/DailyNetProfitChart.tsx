"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type Tx = {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string | null;
  hours_spent: number | null;
  created_at: string;
  transaction_date: string | null;
};

type Props = {
  transactions: Tx[];
  currencySymbol: string;
  selectedMonth: string;
  viewMode?: "monthly" | "yearly";
  selectedYear?: string;
};

export default function DailyNetProfitChart({
  transactions,
  currencySymbol,
  selectedMonth,
  viewMode = "monthly",
  selectedYear,
}: Props) {
  const chartData = useMemo(() => {
    if (viewMode === "yearly" && selectedYear) {
      // Yearly view: show monthly breakdown
      const year = Number(selectedYear);
      const monthlyData: { [key: number]: { income: number; expense: number } } = {};
      
      // Initialize all months
      for (let month = 1; month <= 12; month++) {
        monthlyData[month] = { income: 0, expense: 0 };
      }

      // Calculate monthly totals
      transactions.forEach((tx) => {
        let date: Date;
        if (tx.transaction_date) {
          const [txYear, txMonth, txDay] = tx.transaction_date.split('-').map(Number);
          date = new Date(txYear, txMonth - 1, txDay);
        } else {
          const createdDateStr = tx.created_at.split('T')[0];
          const [txYear, txMonth, txDay] = createdDateStr.split('-').map(Number);
          date = new Date(txYear, txMonth - 1, txDay);
        }
        
        const month = date.getMonth() + 1;
        const txYear = date.getFullYear();
        
        if (txYear === year && month >= 1 && month <= 12) {
          if (tx.type === "income") {
            monthlyData[month].income += Number(tx.amount);
          } else {
            monthlyData[month].expense += Number(tx.amount);
          }
        }
      });

      // Calculate net profit for each month
      const labels: string[] = [];
      const netValues: number[] = [];
      const dates: Date[] = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      for (let month = 1; month <= 12; month++) {
        labels.push(monthNames[month - 1]);
        const net = monthlyData[month].income - monthlyData[month].expense;
        netValues.push(net);
        dates.push(new Date(year, month - 1, 1));
      }

      // Calculate average monthly net
      const totalNet = netValues.reduce((sum, val) => sum + val, 0);
      const averageMonthlyNet = totalNet / 12;
      
      const totalHours = transactions.reduce((sum, tx) => {
        return sum + (tx.hours_spent ? Number(tx.hours_spent) : 0);
      }, 0);
      const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const net = totalIncome - totalExpenses;
      const effectiveHourly = totalHours > 0 ? net / totalHours : 0;

      return { labels, netValues, dates, averageDailyNet: averageMonthlyNet, effectiveHourly, isYearly: true };
    } else {
      // Monthly view: show daily breakdown (existing logic)
      const [year, monthNum] = selectedMonth.split("-").map(Number);
      const daysInMonth = new Date(year, monthNum, 0).getDate();

      // Initialize daily totals
      const dailyData: { [key: number]: { income: number; expense: number } } =
        {};
      for (let day = 1; day <= daysInMonth; day++) {
        dailyData[day] = { income: 0, expense: 0 };
      }

      // Calculate daily totals
      transactions.forEach((tx) => {
        // Use transaction_date if available, otherwise use created_at
        // Parse date string to avoid timezone issues
        let date: Date;
        if (tx.transaction_date) {
          // Parse YYYY-MM-DD format and create date in local timezone
          const [txYear, txMonth, txDay] = tx.transaction_date.split('-').map(Number);
          date = new Date(txYear, txMonth - 1, txDay);
        } else {
          // Fall back to created_at, but extract just the date part to avoid timezone issues
          const createdDateStr = tx.created_at.split('T')[0];
          const [txYear, txMonth, txDay] = createdDateStr.split('-').map(Number);
          date = new Date(txYear, txMonth - 1, txDay);
        }
        
        const dayOfMonth = date.getDate();
        // Also verify the month matches (in case of edge cases)
        const monthMatch = date.getMonth() + 1 === monthNum && date.getFullYear() === year;
        
        if (dayOfMonth >= 1 && dayOfMonth <= daysInMonth && monthMatch) {
          if (tx.type === "income") {
            dailyData[dayOfMonth].income += Number(tx.amount);
          } else {
            dailyData[dayOfMonth].expense += Number(tx.amount);
          }
        }
      });

      // Calculate net profit for each day
      const labels: number[] = [];
      const netValues: number[] = [];
      const dates: Date[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        labels.push(day);
        const net = dailyData[day].income - dailyData[day].expense;
        netValues.push(net);
        dates.push(new Date(year, monthNum - 1, day));
      }

      // Calculate average daily net and effective hourly rate
      const totalNet = netValues.reduce((sum, val) => sum + val, 0);
      
      // For current month, divide by days elapsed. For past months, divide by total days.
      const now = new Date();
      const isCurrentMonth = year === now.getFullYear() && monthNum === now.getMonth() + 1;
      const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth;
      const averageDailyNet = daysElapsed > 0 ? totalNet / daysElapsed : 0;
    
    const totalHours = transactions.reduce((sum, tx) => {
      return sum + (tx.hours_spent ? Number(tx.hours_spent) : 0);
    }, 0);
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const net = totalIncome - totalExpenses;
    const effectiveHourly = totalHours > 0 ? net / totalHours : 0;

      return { labels, netValues, dates, averageDailyNet, effectiveHourly, isYearly: false };
    }
  }, [transactions, selectedMonth, viewMode, selectedYear]);

  const data = useMemo(() => ({
    labels: chartData.labels,
    datasets: [
      {
        label: chartData.isYearly ? "Monthly Net Profit" : "Net Profit",
        data: chartData.netValues,
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  }), [chartData]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(23, 23, 23, 0.95)",
        titleColor: "rgba(237, 237, 237, 1)",
        bodyColor: "rgba(237, 237, 237, 1)",
        borderColor: "rgba(64, 64, 64, 1)",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: function (context: any) {
            const dayIndex = context[0].dataIndex;
            const date = chartData.dates[dayIndex];
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          },
          label: function (context: any) {
            const value = context.parsed.y;
            return `${currencySymbol}${value.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: chartData.isYearly ? "Month" : "Day",
          color: "rgba(163, 163, 163, 1)",
          font: {
            size: 11,
            weight: 500,
          },
        },
        grid: {
          color: "rgba(64, 64, 64, 0.08)",
        },
        ticks: {
          color: "rgba(163, 163, 163, 1)",
          font: {
            size: 10,
            weight: 400,
          },
        },
      },
      y: {
        title: {
          display: true,
          text: "Net Profit",
          color: "rgba(163, 163, 163, 1)",
          font: {
            size: 11,
            weight: 500,
          },
        },
        grid: {
          color: "rgba(64, 64, 64, 0.08)",
        },
        ticks: {
          color: "rgba(163, 163, 163, 1)",
          font: {
            size: 10,
            weight: 400,
          },
          callback: function (value: any) {
            return `${currencySymbol}${value}`;
          },
        },
      },
    },
  }), [chartData, currencySymbol]);

  // Check if there are any transactions
  const hasTransactions = transactions.length > 0;
  const hasNetData = chartData.netValues.some(val => val !== 0);

  if (!hasTransactions || !hasNetData) {
    return (
      <div className="card w-full min-w-0">
        <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
          {chartData.isYearly ? "Monthly Net Profit" : "Daily Net Profit"}
        </h2>
        <div className="w-full h-[220px] md:h-[280px] lg:h-[320px] flex flex-col items-center justify-center text-center px-4 min-w-0">
          <p className="text-neutral-500 text-sm mb-2">
            {hasTransactions 
              ? "No net profit data to display"
              : "No transactions yet"}
          </p>
          <p className="text-neutral-600 text-xs">
            {hasTransactions
              ? "Add income and expense transactions to see your net profit chart"
              : "Start by adding your first transaction above"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full min-w-0">
      <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
        {chartData.isYearly ? "Monthly Net Profit" : "Daily Net Profit"}
      </h2>
      <div className="w-full h-[220px] md:h-[280px] lg:h-[320px] min-w-0">
        <Bar data={data} options={options} />
      </div>
      <div className="mt-3 sm:mt-4 space-y-1">
        <div className="text-xs sm:text-sm text-gray-400">
          {chartData.isYearly 
            ? `Average monthly net this year: ${currencySymbol}${chartData.averageDailyNet.toFixed(2)}`
            : `Average daily net this month: ${currencySymbol}${chartData.averageDailyNet.toFixed(2)}`}
        </div>
        <div className="text-xs sm:text-sm text-gray-400">
          {chartData.isYearly 
            ? `Real hourly rate this year: ${currencySymbol}${chartData.effectiveHourly.toFixed(2)}`
            : `Real hourly rate this month: ${currencySymbol}${chartData.effectiveHourly.toFixed(2)}`}
        </div>
      </div>
    </div>
  );
}
