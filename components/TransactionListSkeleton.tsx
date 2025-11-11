export default function TransactionListSkeleton() {
  return (
    <ul className="space-y-3 md:space-y-4 min-h-0">
      {[1, 2, 3].map((i) => (
        <li key={i} className="card rounded-xl p-4 md:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0 w-full sm:w-auto space-y-2">
              <div className="h-3 w-20 bg-neutral-800 rounded animate-pulse" />
              <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse" />
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0 w-full sm:w-auto">
              <div className="h-5 w-24 bg-neutral-800 rounded animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-12 bg-neutral-800 rounded animate-pulse" />
                <div className="h-6 w-14 bg-neutral-800 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

