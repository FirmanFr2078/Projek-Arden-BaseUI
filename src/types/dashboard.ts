import type { LucideIcon } from "lucide-react"

import type { AppRole } from "@/types/auth"
import type { AppCapability } from "@/types/access"

/**
 * Satu item navigasi dashboard sebelum diproses oleh hook.
 *
 * Konfigurasi ini mengatur tampilan menu, bukan keamanan route/API.
 * Security sebenarnya tetap berada di access-engine dan authorization-engine.
 */
export type DashboardMenuItem = {
  title: string
  href: string
  icon: LucideIcon
  capability: AppCapability
  previewRoles?: readonly AppRole[]
  children?: readonly DashboardMenuItem[]
}

/**
 * Kelompok besar navigasi pada sidebar.
 *
 * Contoh:
 * - Workspace
 * - Structure
 * - Support & Resources
 */
export type DashboardNavigationGroup = {
  label: string
  items: readonly DashboardMenuItem[]
}

/**
 * Item navigasi setelah diproses oleh useDashboardNavigation().
 *
 * `Omit<..., "children">` penting agar children tidak lagi memakai
 * DashboardMenuItem biasa, tetapi memakai ResolvedDashboardMenuItem.
 *
 * Dengan demikian setiap child juga memiliki:
 * - isActive
 * - isOpenByRoute
 * - children resolved berikutnya
 */
export type ResolvedDashboardMenuItem = Omit<
  DashboardMenuItem,
  "children"
> & {
  isActive: boolean
  isOpenByRoute: boolean
  children?: ResolvedDashboardMenuItem[]
}

export type ResolvedDashboardNavigationGroup = {
  label: string
  items: ResolvedDashboardMenuItem[]
}

/**
 * Data kecil yang sudah siap dipakai oleh breadcrumb header.
 */
export type DashboardBreadcrumbItem = {
  label: string
  href?: string
}