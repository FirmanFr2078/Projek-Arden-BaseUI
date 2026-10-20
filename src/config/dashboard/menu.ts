import {
  BookOpen,
  BookOpenText,
  BookUser,
  FileText,
  GanttChart,
  GraduationCap,
  Hexagon,
  Inbox,
  LayoutDashboard,
  Library,
  Satellite,
  Terminal,
  UserCog,
  Waves,
  Waypoints,
} from "lucide-react"

import type { DashboardNavigationGroup } from "@/types/dashboard"

/**
 * Konfigurasi navigasi desktop ARDEN.
 *
 * Penting:
 * - File ini mengatur apa yang terlihat pada sidebar.
 * - File ini BUKAN pengaman route atau API.
 * - Setiap halaman baru tetap harus ditambahkan ke access-engine dan,
 *   bila memiliki API, API tersebut harus memakai requireCapability().
 *
 * Untuk tahap dashboard awal, beberapa halaman masih belum dibuat.
 * Link-nya sudah dipersiapkan agar struktur navigasi stabil sejak awal.
 */
export const DASHBOARD_MENU_GROUPS: readonly DashboardNavigationGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        title: "Home",
        href: "/dashboard",
        icon: LayoutDashboard,
        capability: "dashboard.view",
      },
      {
        title: "Academic",
        href: "/dashboard/academic",
        icon: GraduationCap,
        capability: "student.view",
        previewRoles: ["Admin"],
      },
      {
        title: "Directory",
        href: "/dashboard/directory",
        icon: BookUser,
        capability: "user.view",
        previewRoles: ["Admin"],
        children: [
          {
            title: "Students",
            href: "/dashboard/directory/students",
            icon: BookOpenText,
            capability: "student.view",
            previewRoles: ["Admin"],
          },
          {
            title: "Classes",
            href: "/dashboard/directory/classes",
            icon: BookOpen,
            capability: "student.view",
            previewRoles: ["Admin"],
          },
          {
            title: "Users",
            href: "/dashboard/directory/users",
            icon: UserCog,
            capability: "user.view",
            previewRoles: ["Admin"],
          },
        ],
      },
      {
        title: "Gatekeeper",
        href: "/dashboard/gatekeeper",
        icon: Inbox,
        capability: "attendance.view",
        previewRoles: ["Admin"],
      },
      {
        title: "Recapitulation",
        href: "/dashboard/recapitulation",
        icon: FileText,
        capability: "report.view",
      },
    ],
  },
  {
    label: "Structure",
    items: [
      {
        title: "Planning",
        href: "/dashboard/planning",
        icon: GanttChart,
        capability: "dashboard.view",
        previewRoles: ["Admin"],
      },
      {
        title: "Phases",
        href: "/dashboard/phases",
        icon: Waves,
        capability: "dashboard.view",
        previewRoles: ["Admin"],
      },
      {
        title: "Dispatch",
        href: "/dashboard/dispatch",
        icon: Satellite,
        capability: "dashboard.view",
        previewRoles: ["Admin"],
      },
      {
        title: "Bridges",
        href: "/dashboard/bridges",
        icon: Waypoints,
        capability: "dashboard.view",
        previewRoles: ["Admin"],
      },
      {
        title: "Globals",
        href: "/dashboard/globals",
        icon: Hexagon,
        capability: "globals.view",
        previewRoles: ["Admin"],
      },
    ],
  },
  {
    label: "Support & Resources",
    items: [
      {
        title: "Documentation",
        href: "/dashboard/documentation",
        icon: Library,
        capability: "dashboard.view",
        previewRoles: ["Admin"],
      },
      {
        title: "System Activity",
        href: "/dashboard/activity",
        icon: Terminal,
        capability: "activity.view",
        previewRoles: ["Admin"],
      },
    ],
  },
]