import type { AppRole } from "@/types/auth"

/**
 * ============================================================
 * ARDEN ACCESS CONTRACT
 * ============================================================
 *
 * Kontrak authorization yang dipakai access engine, API,
 * proxy, hook, dan UI preview.
 *
 * Role menjawab: "siapa user ini?"
 * Capability menjawab: "apa yang boleh ia lakukan?"
 * Surface menjawab: "lingkungan UI mana untuk role tersebut?"
 * ============================================================
 */

export const APP_SURFACES = [
  "desktop",
  "mobile",
] as const

export type AppSurface = (typeof APP_SURFACES)[number]

/**
 * Capability dibuat cukup spesifik agar API tidak hanya bertanya
 * "apakah user adalah Admin?".
 *
 * Capability baru boleh ditambah saat fitur baru benar-benar dibuat.
 * Jangan memberi capability hanya karena suatu role dapat melihat UI.
 */
export const APP_CAPABILITIES = [
  "dashboard.view",

  "profile.view",
  "profile.manage",

  "user.view",
  "user.manage",

  "student.view",
  "student.manage",

  "attendance.view",
  "attendance.record",
  "attendance.manage",

  "menstruation.view",
  "menstruation.manage",

  "report.view",
  "report.manage",

  "activity.view",

  "globals.view",
  "globals.manage",
] as const

export type AppCapability =
  (typeof APP_CAPABILITIES)[number]

/**
 * Identitas minimum untuk memutuskan authorization.
 *
 * AuthenticatedUser memenuhi bentuk ini.
 * Proxy memakai bentuk ini dari JWT yang sudah diverifikasi,
 * tetapi proxy bukan pengganti pengecekan database pada API.
 */
export type AccessSubject = {
  role: AppRole
  isActive: boolean
}

/**
 * Aturan sebuah route UI.
 *
 * capability:
 *   Izin utama yang diperlukan untuk membuka route.
 *
 * surface:
 *   Lingkungan UI yang memang ditujukan untuk route tersebut.
 */
export type RoutePolicy = {
  capability: AppCapability
  surface: AppSurface
}

/**
 * Alasan yang dapat dipakai proxy/UI untuk memilih redirect,
 * tanpa mengirim detail keamanan sensitif ke browser.
 */
export type RouteAccessReason =
  | "ALLOWED"
  | "INACTIVE_USER"
  | "NO_POLICY"
  | "CAPABILITY_DENIED"
  | "SURFACE_DENIED"

export type RouteAccessResult = {
  allowed: boolean
  reason: RouteAccessReason
  policy: RoutePolicy | null
  userSurface: AppSurface | null
}