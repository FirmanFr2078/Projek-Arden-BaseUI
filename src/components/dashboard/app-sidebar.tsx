"use client"

import type { AuthenticatedUser } from "@/types/auth"
import { useDashboardNavigation } from "@/hooks/desktop/use-dashboard-navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

import { DashboardNavGroup } from "./nav-group"
import { DashboardRoleSwitcher } from "./nav-role"
import { DashboardUserMenu } from "./nav-user"

type AppSidebarProps = {
  user: AuthenticatedUser
}

/**
 * Sidebar utama surface desktop ARDEN.
 *
 * Sidebar tidak menerima role dari localStorage.
 * Seluruh data user berasal dari DashboardShell yang menerima hasil
 * requireUser() di server layout.
 */
export function AppSidebar({
  user,
}: AppSidebarProps) {
  const { navigation } = useDashboardNavigation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <DashboardRoleSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <DashboardNavGroup key={group.label} group={group} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <DashboardUserMenu user={user} />
      </SidebarFooter>

    </Sidebar>
  )
}