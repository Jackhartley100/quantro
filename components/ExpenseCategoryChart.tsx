"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

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
};

export default function ExpenseCategoryChart({
  transactions,
  currencySymbol,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const chartData = useMemo(() => {
    // Filter expenses and group by category
    const expenses = transactions.filter((tx) => tx.type === "expense");
    
    if (expenses.length === 0) {
      return null;
    }

    const categoryTotals: { [key: string]: number } = {};
    
    expenses.forEach((tx) => {
      const category = tx.category || "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] || 0) + Number(tx.amount);
    });

    const categories = Object.keys(categoryTotals).sort();
    const amounts = categories.map((cat) => categoryTotals[cat]);

    // Generate colors - use emerald shades and other colors
    const colors = [
      "rgba(16, 185, 129, 0.8)", // emerald-500
      "rgba(5, 150, 105, 0.8)", // emerald-600
      "rgba(34, 197, 94, 0.8)", // green-500
      "rgba(22, 163, 74, 0.8)", // green-600
      "rgba(59, 130, 246, 0.8)", // blue-500
      "rgba(37, 99, 235, 0.8)", // blue-600
      "rgba(168, 85, 247, 0.8)", // purple-500
      "rgba(147, 51, 234, 0.8)", // purple-600
      "rgba(236, 72, 153, 0.8)", // pink-500
      "rgba(219, 39, 119, 0.8)", // pink-600
    ];

    return {
      labels: categories,
      datasets: [
        {
          label: "Expenses",
          data: amounts,
          backgroundColor: colors.slice(0, categories.length),
          borderColor: "rgba(23, 23, 23, 0.8)",
          borderWidth: 2,
        },
      ],
    };
  }, [transactions]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: (isMobile ? "bottom" : "right") as const,
          labels: {
            color: "rgba(237, 237, 237, 1)",
            font: {
              size: isMobile ? 10 : 12,
            },
            padding: isMobile ? 8 : 12,
            generateLabels: (chart: any) => {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label: string, i: number) => {
                  const value = data.datasets[0].data[i];
                  const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return {
                    text: isMobile 
                      ? `${label}: ${currencySymbol}${value.toFixed(2)}`
                      : `${label}: ${currencySymbol}${value.toFixed(2)} (${percentage}%)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: data.datasets[0].borderColor,
                    lineWidth: data.datasets[0].borderWidth,
                    fontColor: "rgba(237, 237, 237, 1)",
                    hidden: false,
                    index: i,
                  };
                });
              }
              return [];
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(23, 23, 23, 0.95)",
          titleColor: "rgba(237, 237, 237, 1)",
          bodyColor: "rgba(237, 237, 237, 1)",
          borderColor: "rgba(64, 64, 64, 1)",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function (context: any) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${currencySymbol}${value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} (${percentage}%)`;
            },
          },
        },
      },
    }),
    [currencySymbol, isMobile]
  );

  const hasExpenses = transactions.some(tx => tx.type === "expense");

  if (!chartData) {
    return (
      <div className="card w-full min-w-0">
        <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Expenses by Category</h2>
        <div className="w-full h-[220px] md:h-[280px] lg:h-[320px] flex flex-col items-center justify-center text-center px-4 min-w-0">
          <p className="text-neutral-500 text-sm mb-2">
            {hasExpenses 
              ? "No expenses to display"
              : "No transactions yet"}
          </p>
          <p className="text-neutral-600 text-xs">
            {hasExpenses
              ? "Add expense transactions with categories to see the breakdown"
              : "Start by adding your first expense transaction above"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full min-w-0">
      <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Expenses by Category</h2>
      <div className="w-full h-[220px] md:h-[280px] lg:h-[320px] min-w-0">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}

