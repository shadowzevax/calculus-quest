export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse bg-ink/[0.06] rounded ${className}`} />
}

export function MissionCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-ink/10 p-5">
      <div className="flex items-start justify-between mb-4">
        <SkeletonBlock className="w-11 h-11 rounded-lg" />
        <SkeletonBlock className="w-16 h-7" />
      </div>
      <SkeletonBlock className="h-3 w-16 mb-2" />
      <SkeletonBlock className="h-5 w-3/4 mb-2" />
      <SkeletonBlock className="h-4 w-full mb-1" />
      <SkeletonBlock className="h-4 w-2/3 mb-4" />
      <SkeletonBlock className="h-9 w-full rounded-lg" />
    </div>
  )
}

export function MissionsGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => <MissionCardSkeleton key={i} />)}
    </div>
  )
}
