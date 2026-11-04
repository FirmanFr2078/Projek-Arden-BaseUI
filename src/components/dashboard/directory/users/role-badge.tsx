import {
  ClipboardCheckIcon,
  EyeIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AppRole } from "@/types/auth"

const ROLE_STYLES: Record<AppRole, { icon: LucideIcon; className: string }> = {
  Admin: {
    icon: ShieldCheckIcon,
    className: "border-indigo-500/25 bg-indigo-500/10 text-indigo-300",
  },
  Pemantau: {
    icon: EyeIcon,
    className: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  },
  Pelaksana: {
    icon: ClipboardCheckIcon,
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  },
}

/** Lencana role berwarna: Admin (indigo), Pemantau (biru), Pelaksana (hijau). */
export function RoleBadge({ role }: { role: AppRole }) {
  const { icon: Icon, className } = ROLE_STYLES[role]

  return (
    <Badge variant="outline" className={cn("gap-1.5", className)}>
      <Icon className="size-3" />
      {role}
    </Badge>
  )
}