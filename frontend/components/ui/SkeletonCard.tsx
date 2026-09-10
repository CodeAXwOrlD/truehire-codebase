"use client";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Single animated shimmer bar */
function Shimmer({ className = "", style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={`relative overflow-hidden rounded bg-zinc-800/60 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-zinc-700/40 before:to-transparent ${className}`}
    />
  );
}

/** Skeleton for a job card (matches JobCard layout) */
export function JobCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 animate-in fade-in duration-300">
      {/* Header: logo + company */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Shimmer className="h-9 w-9 rounded-lg shrink-0" />
          <div className="flex flex-col gap-1.5">
            <Shimmer className="h-3.5 w-28" />
            <Shimmer className="h-2.5 w-20" />
          </div>
        </div>
        <Shimmer className="h-5 w-16 rounded-control" />
      </div>

      {/* Job title */}
      <Shimmer className="h-4 w-3/4" />

      {/* Location + tags */}
      <div className="flex items-center gap-2">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-3 w-16" />
      </div>

      {/* Tag pills */}
      <div className="flex flex-wrap gap-1.5">
        {[60, 50, 45, 55].map((w, i) => (
          <Shimmer key={i} className={`h-5 rounded-control`} style={{ width: w }} />
        ))}
      </div>

      {/* Footer: salary + actions */}
      <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-1">
        <Shimmer className="h-4 w-28" />
        <Shimmer className="h-7 w-20 rounded-control" />
      </div>
    </div>
  );
}

/** Skeleton for a stat/KPI card */
export function StatCardSkeleton() {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <Shimmer className="h-3 w-28" />
        <Shimmer className="h-4 w-4 rounded" />
      </div>
      <Shimmer className="mt-3 h-7 w-20" />
      <Shimmer className="mt-1.5 h-2.5 w-32" />
    </div>
  );
}

/** Skeleton for a chart area */
export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-card border border-border bg-surface"
      style={{ height }}
    >
      <Shimmer className="h-4 w-36" />
      <Shimmer className="mt-2 h-3 w-48" />
      <Shimmer className="mt-4 h-full w-full mx-6" style={{ maxHeight: height - 80 }} />
    </div>
  );
}

/** Grid of job card skeletons */
export function JobGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}
