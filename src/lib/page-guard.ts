import "server-only"

import { redirect } from "next/navigation"

import {
  AuthorizationError,
  requireCapability,
} from "@/engine/authorization-engine"
import type { AppCapability } from "@/types/access"
import type { AuthenticatedUser } from "@/types/auth"

/**
 * Pagar server untuk page.tsx.
 *
 * Layout desktop sudah memastikan user login dan bukan Pelaksana. Pagar ini
 * menambahkan pengecekan CAPABILITY per halaman (mis. Pemantau tidak boleh
 * membuka halaman Users), karena proxy dapat dilonggarkan saat development
 * (ARDEN_DEV_RELAXED_DESKTOP_ACCESS) dan tidak boleh menjadi satu-satunya
 * penjaga.
 *
 * - belum login / sesi tidak sah → /login
 * - login tetapi tidak berhak    → /dashboard
 * - error lain (database, konfigurasi) dilempar ulang agar terlihat di log.
 */
export async function requirePageCapability(
  capability: AppCapability,
): Promise<AuthenticatedUser> {
  try {
    return await requireCapability(capability)
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect(error.code === "UNAUTHENTICATED" ? "/login" : "/dashboard")
    }

    throw error
  }
}