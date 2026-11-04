import { formatRelativeTime } from "@/lib/directory/format-time"
import { cn } from "@/lib/utils"

type PresenceIndicatorProps = {
  isOnline: boolean
  isActive: boolean
  /** Detak terakhir (ISO), atau null bila belum pernah terlihat. */
  lastSeenAt: string | null
  /** Waktu sekarang (ms), dari useNow, agar label bergerak. */
  now: number
}

/**
 * Status kehadiran satu akun: "Online" (titik hijau berdenyut),
 * "Terakhir aktif 5 menit lalu", "Belum pernah masuk", atau "Dinonaktifkan".
 */
export function PresenceIndicator({
  isOnline,
  isActive,
  lastSeenAt,
  now,
}: PresenceIndicatorProps) {
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-2 rounded-full bg-muted-foreground/40" />
        Dinonaktifkan
      </span>
    )
  }

  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        Online
      </span>
    )
  }

  const relative = formatRelativeTime(lastSeenAt, now, "")

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs text-muted-foreground",
      )}
    >
      <span className="size-2 rounded-full bg-muted-foreground/40" />
      {relative === ""
        ? "Belum pernah masuk"
        : `Terakhir aktif ${relative === "Baru saja" ? "baru saja" : relative}`}
    </span>
  )
}