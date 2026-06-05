// ── Skeleton Loading Components ──

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton-pulse ${className}`} />;
}

/** Full card skeleton for main sections */
export function CardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-3xl p-8 soft-shadow space-y-6">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-48 w-48 rounded-full mx-auto" />
      <div className="flex gap-3 justify-center">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

/** Row of skeleton items for record lists */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 flex items-center gap-4 soft-shadow">
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Two-column stat card skeleton */
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-surface-container-lowest rounded-2xl p-6 soft-shadow">
          <Skeleton className="h-4 w-16 mb-3" />
          <Skeleton className="h-10 w-20" />
        </div>
      ))}
    </div>
  );
}
