function Skeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
    />
  )
}

/**
 * Loading UI route dashboard.
 *
 * Tidak mengambil data, tidak memakai session, dan tidak memakai useEffect.
 * Semua hanya presentational agar loading state tetap ringan.
 */
export default function DashboardLoading() {
  return (
    <section className="flex flex-1 flex-col gap-6 py-6">
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-8 w-80 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
        <Skeleton className="mt-2 h-4 w-4/5 max-w-xl" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border bg-card p-5"
          >
            <Skeleton className="size-10" />
            <Skeleton className="mt-5 h-5 w-28" />
            <Skeleton className="mt-2 h-4 w-full" />
          </div>
        ))}
      </div>

      <div className="min-h-72 rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
        <Skeleton className="mt-2 h-4 w-4/5 max-w-lg" />
      </div>
    </section>
  )
}