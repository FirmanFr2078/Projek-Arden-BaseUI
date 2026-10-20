"use client"

import {
  ChevronDown,
  ChevronUp,
  CircleUserRound,
  LogOut,
  ShieldCheck,
} from "lucide-react"

import { useLogout } from "@/hooks/auth/use-logout"
import type { AuthenticatedUser } from "@/types/auth"
import { DashboardUserAvatar } from "./user-avatar"
import {
  DASHBOARD_POPUP_CLASSNAME,
  DASHBOARD_POPUP_ITEM_CLASSNAME,
  DASHBOARD_POPUP_SIDE_OFFSET,
} from "@/config/dashboard/popup"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

type DashboardUserMenuProps = {
  user: AuthenticatedUser
}

/**
 * Footer identity untuk akun yang sedang login.
 *
 * Data user berasal dari server layout melalui requireUser(), bukan dari
 * localStorage atau dummy object.
 */
export function DashboardUserMenu({
  user,
}: DashboardUserMenuProps) {
  const { isMobile } = useSidebar()
  const { logout, isLoading } = useLogout()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="group/user-trigger sidebar-shine select-none bg-transparent transition-all duration-500 ease-(--transition-timing-function-smooth)"
              />
            }
          >
            <DashboardUserAvatar
              name={user.name}
              photoUrl={user.photoUrl}
              className="size-(--sidebar-icon-size)"
            />

            <div className="ml-1 grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-sidebar-foreground">
                {user.name}
              </span>

              <span className="truncate text-xs text-sidebar-foreground/55">
                @{user.username}
              </span>
            </div>

            <div className="ml-auto flex size-6 shrink-0 items-center justify-center group-data-[collapsible=icon]:hidden">
              <div className="flex flex-col items-center justify-center transition-transform duration-500 ease-(--transition-timing-function-snappy) group-data-popup-open/user-trigger:rotate-180">
                <ChevronUp className="size-3.5 -mb-0.75 text-sidebar-foreground/50 transition-transform duration-500 ease-(--transition-timing-function-snappy) group-data-popup-open/user-trigger:-rotate-180" />
                <ChevronDown className="size-3.5 -mt-0.75 text-sidebar-foreground/50 transition-transform duration-500 ease-(--transition-timing-function-snappy) group-data-popup-open/user-trigger:-rotate-180" />
              </div>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className={`${DASHBOARD_POPUP_CLASSNAME} w-(--anchor-width) min-w-60`}
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={isMobile ? 8 : DASHBOARD_POPUP_SIDE_OFFSET}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2.5 px-2.5 py-2.5 text-left text-sm">
                  <DashboardUserAvatar
                    name={user.name}
                    photoUrl={user.photoUrl}
                    className="size-9"
                  />

                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.name}
                    </span>

                    <span className="truncate text-xs text-sidebar-foreground/55">
                      @{user.username}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="mx-0 bg-sidebar-border/70" />

              <DropdownMenuItem
                disabled
                className="gap-2.5 rounded-lg px-2.5 py-2 text-sidebar-foreground/55"
              >
                <CircleUserRound className="size-4" />

                <span className="flex-1">Profile & Connections</span>

                <span className="text-2xs tracking-wider uppercase">
                  Soon
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem
                disabled
                className="gap-2.5 rounded-lg px-2.5 py-2 text-sidebar-foreground/55"
              >
                <ShieldCheck className="size-4" />
                Role: {user.role}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="mx-0 bg-sidebar-border/70" />

            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={isLoading}
                onClick={handleLogout}
                className={`${DASHBOARD_POPUP_ITEM_CLASSNAME} gap-2.5 py-2 text-destructive hover:text-destructive focus:text-destructive`}
              >
                <LogOut className="size-4" />
                {isLoading ? "Signing out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}