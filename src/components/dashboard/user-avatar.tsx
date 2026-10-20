import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils"

type DashboardUserAvatarProps = {
  name: string
  photoUrl: string | null
  /**
   * Ukuran diatur pemanggil, misalnya `size-(--sidebar-icon-size)`
   * untuk trigger sidebar atau `size-9` untuk header menu.
   */
  className?: string
}

/**
 * Avatar user dashboard: foto bila ada, inisial bila tidak ada
 * atau foto gagal dimuat.
 */
export function DashboardUserAvatar({
  name,
  photoUrl,
  className,
}: DashboardUserAvatarProps) {
  return (
    <Avatar
      className={cn(
        "isolate shrink-0 overflow-hidden rounded-full border border-sidebar-border/70 bg-sidebar-accent/45",
        className
      )}
    >
      {photoUrl ? (
        <AvatarImage
          src={photoUrl}
          alt={name}
          className="block size-full object-cover"
        />
      ) : null}

      <AvatarFallback className="rounded-full bg-sidebar-accent/70 text-xs font-medium text-sidebar-foreground">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}