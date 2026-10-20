import {
  Eye,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react"

import type { AppRole } from "@/types/auth"

type DashboardRoleDisplay = {
  label: string
  description: string
  icon: LucideIcon
}

/**
 * Hanya metadata visual untuk role di dashboard.
 *
 * Aturan akses sebenarnya tetap berada di:
 * src/engine/access-engine.ts
 */
export const DASHBOARD_ROLE_DISPLAY: Record<AppRole, DashboardRoleDisplay> = {
  Admin: {
    label: "Admin",
    description: "Full access",
    icon: ShieldCheck,
  },
  Pemantau: {
    label: "Pemantau",
    description: "Monitoring access",
    icon: Eye,
  },
  Pelaksana: {
    label: "Pelaksana",
    description: "Mobile operation",
    icon: Smartphone,
  },
}