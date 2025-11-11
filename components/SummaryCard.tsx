"use client";

type Props = { 
  label: string; 
  value: string; 
  subtitle?: string;
  caption?: string;
  percentageChange?: number | null;
  topCategoryPercentage?: number | null;
};

export default function SummaryCard({ label, value, subtitle, caption, percentageChange, topCategoryPercentage }: Props) {
  const hasChange = percentageChange !== null && percentageChange !== undefined && !isNaN(percentageChange);
  const isPositive = hasChange && percentageChange > 0;
  const isNegative = hasChange && percentageChange < 0;
  const hasTopCategory = topCategoryPercentage !== null && topCategoryPercentage !== undefined && !isNaN(topCategoryPercentage);
  
  return (
    <div className="card min-w-0 relative h-full flex flex-col">
      <div className="grid min-w-0 pr-16 sm:pr-24 gap-1 flex-1">
        <div className="text-xs sm:text-sm text-neutral-400 min-w-0">{label}</div>
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight min-w-0 break-words">{value}</div>
        {subtitle ? (
          <div className="text-xs text-neutral-500 break-words min-w-0">{subtitle}</div>
        ) : null}
        {caption ? (
          <p
            className="text-xs text-neutral-500/85 leading-snug min-w-0 whitespace-normal break-words overflow-hidden"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
          >
            {String(caption)}
          </p>
        ) : null}
      </div>
      {(hasChange || hasTopCategory) && (
        <div className="absolute right-2 sm:right-3 top-2 sm:top-3 flex flex-col gap-1 items-end">
          {hasChange && (
            <span
              className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                isPositive
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : isNegative
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-neutral-800 text-neutral-400 border border-neutral-700"
              }`}
            >
              {isPositive ? "↑" : isNegative ? "↓" : ""} {Math.abs(percentageChange).toFixed(1)}%
            </span>
          )}
          {hasTopCategory && (
            <span
              className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                topCategoryPercentage > 0
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : topCategoryPercentage < 0
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-neutral-800 text-neutral-400 border border-neutral-700"
              }`}
            >
              {topCategoryPercentage > 0 ? "↑" : topCategoryPercentage < 0 ? "↓" : ""} {Math.abs(topCategoryPercentage).toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

