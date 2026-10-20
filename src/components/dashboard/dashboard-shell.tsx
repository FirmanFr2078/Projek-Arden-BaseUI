"use client"

import type { ReactNode } from "react"

import { DashboardPreviewProvider } from "@/contexts/dashboard-preview-context"
import type { AuthenticatedUser } from "@/types/auth"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { AppSidebar } from "./app-sidebar"
import { DashboardHeader } from "./header"

type DashboardShellProps = {
  user: AuthenticatedUser
  defaultSidebarOpen: boolean
  children: ReactNode
}

/**
 * Shell tunggal untuk seluruh route desktop.
 *
 * Alur data:
 *
 * Desktop layout server
 *   -> requireUser() + cookie sidebar_state
 *   -> DashboardShell(user asli, defaultSidebarOpen)
 *   -> DashboardPreviewProvider(role asli)
 *   -> sidebar/header/UI preview
 *
 * Dengan ini, seluruh desktop dashboard memakai identitas asli yang sama
 * tanpa membebani setiap halaman untuk membaca session lagi di client.
 */
export function DashboardShell({
  user,
  defaultSidebarOpen,
  children,
}: DashboardShellProps) {
  return (
    <DashboardPreviewProvider realRole={user.role}>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <AppSidebar user={user} />

        <SidebarInset>
          <DashboardHeader />

          <div className="flex flex-1 flex-col p-4 pt-0 sm:p-6 sm:pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardPreviewProvider>
  )
}