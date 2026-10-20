"use client"

import { useDashboardPreviewContext } from "@/contexts/dashboard-preview-context"

/**
 * Adapter React untuk seluruh komponen yang membutuhkan state preview role.
 *
 * Komponen tidak perlu tahu bagaimana context dibuat atau divalidasi.
 */
export function useDashboardPreview() {
  return useDashboardPreviewContext()
}