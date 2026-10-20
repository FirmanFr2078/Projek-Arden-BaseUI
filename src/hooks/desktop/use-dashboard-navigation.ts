"use client"

import { usePathname } from "next/navigation"

import { DASHBOARD_MENU_GROUPS } from "@/config/dashboard/menu"
import { hasCapability } from "@/engine/access-engine"
import { useDashboardPreview } from "@/hooks/desktop/use-dashboard-preview"
import type {
  DashboardBreadcrumbItem,
  DashboardMenuItem,
  ResolvedDashboardMenuItem,
  ResolvedDashboardNavigationGroup,
} from "@/types/dashboard"

/**
 * `/dashboard` hanya aktif ketika path-nya benar-benar `/dashboard`.
 *
 * Tanpa aturan khusus ini, menu Home akan ikut aktif di:
 * - /dashboard/globals
 * - /dashboard/activity
 * - /dashboard/directory/students
 * - dan semua route dashboard lain.
 */
function isRouteActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Mengubah item konfigurasi menjadi item yang siap dirender UI.
 *
 * Proses ini menentukan:
 * - apakah item boleh terlihat untuk preview role saat ini,
 * - apakah capability role tersebut memadai,
 * - apakah item sedang aktif,
 * - apakah parent submenu perlu terbuka.
 *
 * Ini hanya untuk UI navigation. Halaman dan API tetap wajib memiliki
 * otorisasi server sendiri.
 */
function resolveItem(
  item: DashboardMenuItem,
  pathname: string,
  previewRole: ReturnType<typeof useDashboardPreview>["previewRole"],
): ResolvedDashboardMenuItem | null {
  const canShowForPreviewRole =
    !item.previewRoles || item.previewRoles.includes(previewRole)

  const canUseCapability = hasCapability(
    {
      role: previewRole,
      isActive: true,
    },
    item.capability,
  )

  if (!canShowForPreviewRole || !canUseCapability) {
    return null
  }

  const children = item.children
    ?.map((child) => resolveItem(child, pathname, previewRole))
    .filter(
      (child): child is ResolvedDashboardMenuItem => child !== null,
    )

  /**
   * Jangan tampilkan parent submenu yang tidak mempunyai child visible.
   */
  if (item.children && (!children || children.length === 0)) {
    return null
  }

  const isChildActive = Boolean(
    children?.some((child) => child.isActive),
  )

  return {
    ...item,
    isActive: isRouteActive(pathname, item.href) || isChildActive,
    isOpenByRoute: isChildActive,
    children,
  }
}

/**
 * Mencari lintasan menu dari parent menuju leaf yang aktif.
 *
 * Contoh hasil untuk:
 * /dashboard/directory/students
 *
 * Directory -> Students
 */
function findBreadcrumbTrail(
  items: readonly ResolvedDashboardMenuItem[],
  pathname: string,
): ResolvedDashboardMenuItem[] | null {
  for (const item of items) {
    if (item.children) {
      const childTrail = findBreadcrumbTrail(item.children, pathname)

      if (childTrail) {
        return [item, ...childTrail]
      }
    }

    if (isRouteActive(pathname, item.href)) {
      return [item]
    }
  }

  return null
}

/**
 * Menyusun breadcrumb berdasarkan navigation yang sudah difilter.
 *
 * Contoh:
 * Workspace / Directory / Students
 */
function buildBreadcrumbs(
  navigation: ResolvedDashboardNavigationGroup[],
  pathname: string,
): DashboardBreadcrumbItem[] {
  for (const group of navigation) {
    const trail = findBreadcrumbTrail(group.items, pathname)

    if (!trail) {
      continue
    }

    return [
      {
        label: group.label,
      },
      ...trail.map((item, index) => ({
        label: item.title,
        href: index === trail.length - 1 ? undefined : item.href,
      })),
    ]
  }

  /**
   * Fallback aman ketika halaman desktop baru belum dimasukkan
   * ke konfigurasi sidebar.
   */
  return [
    {
      label: "System",
    },
    {
      label: "Overview",
    },
  ]
}

/**
 * Adapter React untuk semua kebutuhan navigasi dashboard.
 *
 * Komponen UI menerima hasil yang sudah bersih:
 * - navigation terfilter,
 * - active state,
 * - submenu state,
 * - breadcrumb.
 *
 * Tidak menggunakan useMemo manual supaya tidak berbenturan dengan
 * React Compiler yang aktif di V.4.
 */
export function useDashboardNavigation() {
  const pathname = usePathname() ?? "/dashboard"
  const { previewRole } = useDashboardPreview()

  const navigation: ResolvedDashboardNavigationGroup[] =
    DASHBOARD_MENU_GROUPS.map((group) => ({
      label: group.label,
      items: group.items
        .map((item) => resolveItem(item, pathname, previewRole))
        .filter(
          (item): item is ResolvedDashboardMenuItem => item !== null,
        ),
    })).filter((group) => group.items.length > 0)

  const breadcrumbs = buildBreadcrumbs(navigation, pathname)

  return {
    navigation,
    breadcrumbs,
    pathname,
  }
}