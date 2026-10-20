"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, MoreHorizontal } from "lucide-react";

import type {
  ResolvedDashboardMenuItem,
  ResolvedDashboardNavigationGroup,
} from "@/types/dashboard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DASHBOARD_POPUP_CLASSNAME,
  DASHBOARD_POPUP_ITEM_CLASSNAME,
  DASHBOARD_POPUP_LABEL_CLASSNAME,
  DASHBOARD_POPUP_SIDE_OFFSET,
} from "@/config/dashboard/popup";

type DashboardNavGroupProps = {
  group: ResolvedDashboardNavigationGroup;
};

/**
 * Render satu kelompok navigasi dashboard.
 *
 * Filtering capability, preview role, active route, dan breadcrumb
 * sudah selesai di useDashboardNavigation().
 *
 * Component ini fokus pada UI Base UI saja.
 */
export function DashboardNavGroup({ group }: DashboardNavGroupProps) {
  const { isMobile, setOpenMobile, state } = useSidebar();

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>

      <SidebarMenu>
        {group.items.map((item) => {
          const Icon = item.icon;

          /**
           * Item sederhana tanpa submenu.
           */
          if (!item.children) {
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={item.isActive}
                  tooltip={item.title}
                  onClick={closeMobileSidebar}
                  className="sidebar-shine transition-colors duration-500 ease-(--transition-timing-function-smooth)"
                >
                  <Icon
                    className={
                      item.isActive
                        ? "text-sidebar-foreground"
                        : "text-sidebar-foreground/60 transition-colors duration-500 ease-(--transition-timing-function-smooth)"
                    }
                  />

                  <span className="font-medium group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          /**
           * Sidebar desktop collapsed:
           * parent submenu berubah menjadi flyout di kanan.
           */
          if (state === "collapsed" && !isMobile) {
            return (
              <CollapsedNavigationItem
                key={item.href}
                title={item.title}
                icon={<Icon />}
                isActive={item.isActive}
                items={item.children}
              />
            );
          }

          /**
           * Sidebar terbuka atau layar mobile:
           * parent submenu menjadi accordion.
           */
          return (
            <ExpandableNavigationItem
              key={item.href}
              title={item.title}
              icon={<Icon />}
              isActive={item.isActive}
              isOpenByRoute={item.isOpenByRoute}
              items={item.children}
              onNavigate={closeMobileSidebar}
            />
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

type ExpandableNavigationItemProps = {
  title: string;
  icon: ReactNode;
  isActive: boolean;
  isOpenByRoute: boolean;
  items: ResolvedDashboardMenuItem[];
  onNavigate: () => void;
};

/**
 * Parent menu ketika sidebar berada dalam mode normal/expanded.
 */
function ExpandableNavigationItem({
  title,
  icon,
  isActive,
  isOpenByRoute,
  items,
  onNavigate,
}: ExpandableNavigationItemProps) {
  const [isOpen, setIsOpen] = useState(isOpenByRoute)
  const [wasOpenByRoute, setWasOpenByRoute] = useState(isOpenByRoute)

  /**
   * Parent otomatis terbuka saat user BARU masuk ke salah satu child route,
   * tetapi tetap boleh ditutup manual setelahnya.
   *
   * Dibandingkan saat render (bukan lewat effect) agar sesuai pola React
   * dan tidak memicu render tambahan yang berkedip.
   */
  if (isOpenByRoute !== wasOpenByRoute) {
    setWasOpenByRoute(isOpenByRoute)

    if (isOpenByRoute) {
      setIsOpen(true)
    }
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/collapsible"
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            tooltip={title}
            isActive={isActive && !isOpen}
            className="sidebar-shine group/nav-parent transition-colors duration-500 ease-(--transition-timing-function-smooth)"
          />
        }
      >
        <span
          className={
            isActive || isOpen
              ? "text-sidebar-foreground"
              : "text-sidebar-foreground/60 transition-colors duration-500 ease-(--transition-timing-function-smooth)"
          }
        >
          {icon}
        </span>

        <span
          className={
            isActive || isOpen
              ? "font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden"
              : "font-medium text-sidebar-foreground/75 transition-colors duration-500 ease-(--transition-timing-function-smooth) group-data-[collapsible=icon]:hidden"
          }
        >
          {title}
        </span>

        <ChevronRight className="ml-auto size-4 text-sidebar-foreground/50 transition-transform duration-300 group-data-open/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <SidebarMenuSub>
          {items.map((child) => {
            const ChildIcon = child.icon;

            return (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  render={<Link href={child.href} />}
                  isActive={child.isActive}
                  onClick={onNavigate}
                  className="sidebar-shine h-8 transition-colors duration-500 ease-(--transition-timing-function-smooth)"
                >
                  <ChildIcon
                    className={
                      child.isActive
                        ? "size-3.5 text-sidebar-foreground"
                        : "size-3.5 text-sidebar-foreground/45 transition-colors duration-500 ease-(--transition-timing-function-smooth)"
                    }
                  />

                  <span
                    className={
                      child.isActive
                        ? "font-medium text-sidebar-foreground"
                        : "font-medium text-sidebar-foreground/70 transition-colors duration-500 ease-(--transition-timing-function-smooth)"
                    }
                  >
                    {child.title}
                  </span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

type CollapsedNavigationItemProps = {
  title: string;
  icon: ReactNode;
  isActive: boolean;
  items: ResolvedDashboardMenuItem[];
};

/**
 * Parent menu saat sidebar berada di mode icon-only.
 *
 * Gaya pop-up (container, label, jarak) memakai konstanta bersama di
 * config/dashboard/popup.ts agar seragam dengan menu role dan menu user.
 */
function CollapsedNavigationItem({
  title,
  icon,
  isActive,
  items,
}: CollapsedNavigationItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <SidebarMenuItem>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              tooltip={isMenuOpen ? { children: title, hidden: true } : title}
              isActive={isActive}
              className="sidebar-shine group/nav-collapsed transition-colors duration-500 ease-(--transition-timing-function-smooth)"
            />
          }
        >
          <span
            className={
              isActive
                ? "text-sidebar-foreground"
                : "text-sidebar-foreground/60 transition-colors duration-500 ease-(--transition-timing-function-smooth)"
            }
          >
            {icon}
          </span>

          <span className="font-medium group-data-[collapsible=icon]:hidden">
            {title}
          </span>

          <MoreHorizontal className="ml-auto size-4 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={DASHBOARD_POPUP_SIDE_OFFSET}
          className={`${DASHBOARD_POPUP_CLASSNAME} w-52 min-w-52`}
        >
          {/*
            Base UI mewajibkan DropdownMenuLabel berada di dalam Group.
          */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className={DASHBOARD_POPUP_LABEL_CLASSNAME}>
              {title}
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="mx-0 bg-sidebar-border/70" />

            {items.map((child) => {
              const ChildIcon = child.icon;

              return (
                <DropdownMenuItem
                  key={child.href}
                  render={<Link href={child.href} />}
                  data-active={child.isActive ? "true" : undefined}
                  className={`${DASHBOARD_POPUP_ITEM_CLASSNAME} mt-0.5 h-8 gap-2.5`}
                >
                  <ChildIcon
                    className={
                      child.isActive
                        ? "size-4 text-sidebar-foreground"
                        : "size-4 text-sidebar-foreground/55"
                    }
                  />

                  <span className="font-medium">{child.title}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
