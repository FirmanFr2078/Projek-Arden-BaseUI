"use client"

import Link from "next/link"
import { Fragment } from "react"

import { useDashboardNavigation } from "@/hooks/desktop/use-dashboard-navigation"
import { useDashboardPreview } from "@/hooks/desktop/use-dashboard-preview"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

/**
 * Header desktop.
 *
 * Breadcrumb mengikuti sidebar/navigation yang sudah diproses oleh hook,
 * sehingga tampilan Admin preview Pemantau tidak menampilkan breadcrumb
 * untuk menu yang tidak tersedia bagi Pemantau.
 */
export function DashboardHeader() {
  const { breadcrumbs } = useDashboardNavigation()
  const {
    isPreviewing,
    previewRole,
  } = useDashboardPreview()

  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />

      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />

      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => {
            const isLastItem = index === breadcrumbs.length - 1

            return (
              <Fragment key={`${item.label}-${index}`}>
                {index > 0 ? (
                  <BreadcrumbSeparator className="hidden md:block" />
                ) : null}

                <BreadcrumbItem
                  className={isLastItem ? undefined : "hidden md:inline-flex"}
                >
                  {isLastItem ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : item.href ? (
                    <BreadcrumbLink render={<Link href={item.href} />}>
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <span className="text-muted-foreground">
                      {item.label}
                    </span>
                  )}
                </BreadcrumbItem>
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {isPreviewing ? (
        <div className="ml-auto hidden rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-xs text-primary sm:block">
          Previewing {previewRole}
        </div>
      ) : null}
    </header>
  )
}