"use client";

import { useState } from "react";

import { Check, ChevronDown, ChevronUp, Eye, ShieldCheck } from "lucide-react";

import { DASHBOARD_ROLE_DISPLAY } from "@/config/dashboard/role-display";
import { useDashboardPreview } from "@/hooks/desktop/use-dashboard-preview";
import {
  DASHBOARD_POPUP_CLASSNAME,
  DASHBOARD_POPUP_ITEM_CLASSNAME,
  DASHBOARD_POPUP_LABEL_CLASSNAME,
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
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * Role switcher khusus preview UI desktop.
 *
 * Admin dapat melihat tampilan Pemantau tanpa akun kedua.
 * Ini tidak mengubah JWT, cookie, capability server, atau role database.
 */
export function DashboardRoleSwitcher() {
  const { isMobile } = useSidebar();

  const {
    realRole,
    previewRole,
    previewableRoles,
    isPreviewing,
    setPreviewRole,
    resetPreview,
  } = useDashboardPreview();

  const currentRole = DASHBOARD_ROLE_DISPLAY[previewRole];
  const CurrentIcon = currentRole.icon;
  const canSwitchView = previewableRoles.length > 1;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger
            disabled={!canSwitchView}
            render={
              <SidebarMenuButton
                size="lg"
                data-menu-open={isMenuOpen ? "" : undefined}
                tooltip={
                  isMenuOpen
                    ? { children: "Switch dashboard view", hidden: true }
                    : "Switch dashboard view"
                }
                className="group/role-trigger sidebar-shine select-none bg-transparent transition-all duration-500 ease-(--transition-timing-function-smooth)"
              />
            }
          >
            <div
              key={`role-icon-${previewRole}`}
              className="flex size-(--sidebar-icon-size) shrink-0 items-center justify-center rounded-lg border border-sidebar-border/70 bg-background/55 text-sidebar-foreground shadow-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-500"
            >
              <CurrentIcon className="size-4" />
            </div>

            <div
              key={`role-text-${previewRole}`}
              className="ml-1 grid min-w-0 flex-1 text-left text-sm leading-tight motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-500 group-data-[collapsible=icon]:hidden"
            >
              <span className="truncate font-bold tracking-tight text-sidebar-foreground">
                {currentRole.label}
              </span>

              <span className="truncate text-2xs tracking-widest text-sidebar-foreground/50 uppercase">
                {isPreviewing
                  ? `Preview · ${realRole}`
                  : currentRole.description}
              </span>
            </div>

            {canSwitchView ? (
              <div className="ml-auto flex size-6 shrink-0 items-center justify-center group-data-[collapsible=icon]:hidden">
                <div className="flex flex-col items-center justify-center transition-transform duration-500 ease-(--transition-timing-function-snappy) group-data-menu-open/role-trigger:rotate-180">
                  <ChevronUp className="size-3.5 -mb-0.75 text-sidebar-foreground/50 transition-transform duration-500 ease-(--transition-timing-function-snappy) group-data-menu-open/role-trigger:-rotate-180" />
                  <ChevronDown className="size-3.5 -mt-0.75 text-sidebar-foreground/50 transition-transform duration-500 ease-(--transition-timing-function-snappy) group-data-menu-open/role-trigger:-rotate-180" />
                </div>
              </div>
            ) : null}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className={`${DASHBOARD_POPUP_CLASSNAME} w-(--anchor-width) min-w-64`}
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={isMobile ? 8 : DASHBOARD_POPUP_SIDE_OFFSET}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className={DASHBOARD_POPUP_LABEL_CLASSNAME}>
                Switch view as
              </DropdownMenuLabel>

              {previewableRoles.map((role) => {
                const roleDisplay = DASHBOARD_ROLE_DISPLAY[role];
                const RoleIcon = roleDisplay.icon;
                const isCurrentPreview = previewRole === role;

                return (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => setPreviewRole(role)}
                    data-active={isCurrentPreview ? "true" : undefined}
                    className={`${DASHBOARD_POPUP_ITEM_CLASSNAME} mt-0.5 min-h-11 gap-3 py-2`}
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-sidebar-border/70 bg-background/50">
                      <RoleIcon className="size-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {roleDisplay.label}
                      </p>

                      <p className="truncate text-xs text-sidebar-foreground/50">
                        {role === realRole
                          ? "Real access"
                          : roleDisplay.description}
                      </p>
                    </div>

                    {isCurrentPreview ? (
                      <Check className="size-4 shrink-0 text-sidebar-foreground" />
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>

            {isPreviewing ? (
              <>
                <DropdownMenuSeparator className="mx-0 bg-sidebar-border/70" />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={resetPreview}
                    className={`${DASHBOARD_POPUP_ITEM_CLASSNAME} mt-0.5 gap-3 py-2`}
                  >
                    <ShieldCheck className="size-4" />
                    Return to real access
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : null}

            <DropdownMenuSeparator className="mx-0 bg-sidebar-border/70" />

            <div className="mt-1 px-2.5 py-2">
              <div className="flex gap-2">
                <Eye className="mt-0.5 size-3.5 shrink-0 text-sidebar-foreground/75" />

                <p className="text-[0.6875rem] leading-relaxed text-sidebar-foreground/55">
                  Preview hanya mengubah tampilan dashboard. Izin server tetap
                  memakai role asli Anda.
                </p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
