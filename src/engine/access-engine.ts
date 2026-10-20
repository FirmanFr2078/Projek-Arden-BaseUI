import type {
  AccessSubject,
  AppCapability,
  AppSurface,
  RouteAccessResult,
  RoutePolicy,
} from "@/types/access"
import type { AppRole } from "@/types/auth"

/**
 * ============================================================
 * ARDEN ACCESS ENGINE
 * ============================================================
 *
 * Pusat seluruh aturan authorization ARDEN.
 *
 * Access engine boleh dipakai oleh proxy, API, server, hook,
 * atau UI karena tidak membaca cookie, JWT, database, Prisma,
 * localStorage, maupun browser API.
 *
 * Authentication:
 *   auth-session-engine.ts / auth-engine.ts
 *
 * Authorization:
 *   access-engine.ts
 *
 * Database identity:
 *   database/auth.service.ts
 * ============================================================
 */

/**
 * Role → capability.
 *
 * Penting:
 * Admin bukan Pelaksana.
 *
 * Admin dapat manage data operasional, tetapi tidak menerima
 * attendance.record karena aksi record adalah tugas Pelaksana.
 * Ini mencegah API menganggap Admin boleh bertindak sebagai
 * operator mobile hanya karena ia memiliki hak manajemen.
 */
const ROLE_CAPABILITIES: Record<
  AppRole,
  readonly AppCapability[]
> = {
  Admin: [
    "dashboard.view",

    "profile.view",
    "profile.manage",

    "user.view",
    "user.manage",

    "student.view",
    "student.manage",

    "attendance.view",
    "attendance.manage",

    "menstruation.view",
    "menstruation.manage",

    "report.view",
    "report.manage",

    "activity.view",

    "globals.view",
    "globals.manage",
  ],

  Pemantau: [
    "dashboard.view",

    "profile.view",
    "profile.manage",

    "student.view",

    "attendance.view",

    "menstruation.view",

    "report.view",

    "activity.view",

    "globals.view",
  ],

  Pelaksana: [
    "profile.view",
    "profile.manage",

    "student.view",

    "attendance.view",
    "attendance.record",

    "menstruation.view",
  ],
}

/**
 * Role → surface utama.
 *
 * Ini bukan pengecekan ukuran layar.
 *
 * desktop/mobile di sini adalah lingkungan kerja berdasarkan role:
 * - Admin dan Pemantau bekerja pada dashboard desktop.
 * - Pelaksana bekerja pada operational mobile surface.
 *
 * Selama development, layout mobile tetap boleh diuji dari browser
 * desktop. Device check tidak boleh menjadi security boundary.
 */
const ROLE_SURFACES: Record<AppRole, AppSurface> = {
  Admin: "desktop",
  Pemantau: "desktop",
  Pelaksana: "mobile",
}

/**
 * Role nyata → role yang boleh dipreview di UI.
 *
 * Preview hanya untuk visual dashboard. Ia tidak mengubah:
 * - JWT
 * - role asli user
 * - capability API
 * - activity log actor
 *
 * Admin boleh melihat dashboard dalam perspektif Pemantau,
 * tetapi tidak boleh preview Pelaksana karena mobile adalah
 * surface operasional yang berbeda.
 */
const PREVIEWABLE_ROLES: Record<
  AppRole,
  readonly AppRole[]
> = {
  Admin: ["Admin", "Pemantau"],
  Pemantau: ["Pemantau"],
  Pelaksana: ["Pelaksana"],
}

/**
 * Route UI yang sudah jelas digunakan oleh fondasi saat ini.
 *
 * Feature route baru harus ditambahkan ketika dibuat.
 * Jangan membiarkan route internal baru terbuka hanya karena
 * developer lupa menambahkan policy.
 *
 * Detail authorization per aksi tetap dilakukan API dengan
 * requireCapability(), bukan hanya mengandalkan route UI.
 */
const ROUTE_POLICIES: readonly {
  pathPrefix: string
  policy: RoutePolicy
}[] = [
  {
    pathPrefix: "/dashboard",
    policy: {
      capability: "dashboard.view",
      surface: "desktop",
    },
  },
  {
    pathPrefix: "/dashboard/profile",
    policy: {
      capability: "profile.view",
      surface: "desktop",
    },
  },
  {
    pathPrefix: "/dashboard/profile/connections",
    policy: {
      capability: "profile.manage",
      surface: "desktop",
    },
  },
  {
    pathPrefix: "/go",
    policy: {
      capability: "attendance.record",
      surface: "mobile",
    },
  },
  {
    pathPrefix: "/me",
    policy: {
      capability: "profile.view",
      surface: "mobile",
    },
  },
    /**
   * Directory.
   *
   * Policy dibuat per halaman karena capability tiap halaman berbeda:
   * - users    → user.view    (hanya Admin)
   * - students → student.view (Admin dan Pemantau)
   * - classes  → student.view (kelas memakai capability student)
   *
   * Karena getRoutePolicy() kini memilih prefix terpanjang, policy ini
   * mengalahkan prefix umum "/dashboard" (dashboard.view).
   */
  {
    pathPrefix: "/dashboard/directory/users",
    policy: {
      capability: "user.view",
      surface: "desktop",
    },
  },
  {
    pathPrefix: "/dashboard/directory/students",
    policy: {
      capability: "student.view",
      surface: "desktop",
    },
  },
  {
    pathPrefix: "/dashboard/directory/classes",
    policy: {
      capability: "student.view",
      surface: "desktop",
    },
  },
]

/**
 * Mendapatkan seluruh capability untuk satu role.
 */
export function getRoleCapabilities(
  role: AppRole,
): readonly AppCapability[] {
  return ROLE_CAPABILITIES[role]
}

/**
 * Memeriksa satu capability.
 */
export function hasCapability(
  subject: AccessSubject,
  capability: AppCapability,
) {
  return (
    subject.isActive &&
    ROLE_CAPABILITIES[subject.role].includes(capability)
  )
}

/**
 * Mendapatkan surface utama role.
 */
export function getRoleSurface(role: AppRole): AppSurface {
  return ROLE_SURFACES[role]
}

/**
 * Memeriksa apakah subject memang berada pada surface tertentu.
 */
export function hasSurface(
  subject: AccessSubject,
  surface: AppSurface,
) {
  return (
    subject.isActive &&
    getRoleSurface(subject.role) === surface
  )
}

/**
 * Memeriksa izin preview UI.
 *
 * Jangan gunakan fungsi ini untuk API/database authorization.
 */
export function canPreviewRole(
  realRole: AppRole,
  previewRole: AppRole,
) {
  return PREVIEWABLE_ROLES[realRole].includes(previewRole)
}

/**
 * Menentukan route awal sesudah login atau saat route ditolak.
 */
export function getDefaultRouteForRole(role: AppRole) {
  return role === "Pelaksana" ? "/go" : "/dashboard"
}

export function getRoutePolicy(
  pathname: string,
): RoutePolicy | null {
  const normalizedPathname = normalizePathname(pathname)

  /**
   * Pilih policy dengan prefix TERPANJANG yang cocok.
   *
   * Versi lama memakai .find() sehingga prefix umum "/dashboard"
   * yang berada paling atas selalu menang dan menutupi policy
   * khusus seperti "/dashboard/directory/users".
   *
   * Dengan aturan ini urutan isi ROUTE_POLICIES tidak lagi
   * berpengaruh terhadap hasil.
   */
  let bestMatch: (typeof ROUTE_POLICIES)[number] | null = null

  for (const route of ROUTE_POLICIES) {
    const isMatch =
      normalizedPathname === route.pathPrefix ||
      normalizedPathname.startsWith(`${route.pathPrefix}/`)

    if (
      isMatch &&
      (!bestMatch ||
        route.pathPrefix.length > bestMatch.pathPrefix.length)
    ) {
      bestMatch = route
    }
  }

  return bestMatch?.policy ?? null
}

type RouteAccessOptions = {
  /**
   * Dipakai hanya oleh proxy development.
   *
   * Saat true, capability untuk desktop route boleh dilonggarkan
   * bagi Admin dan Pemantau yang sudah memiliki session valid.
   *
   * Ini tidak boleh dipakai API sebagai pengganti requireCapability().
   */
  allowDesktopCapabilityBypass?: boolean
}

/**
 * Memeriksa akses UI route.
 *
 * Proxy memakai fungsi ini untuk redirect awal.
 * API tidak boleh cukup memakai fungsi ini; API wajib memakai
 * requireCapability() agar database user aktual selalu diperiksa.
 */
export function canAccessRoute(
  subject: AccessSubject,
  pathname: string,
  options: RouteAccessOptions = {},
): RouteAccessResult {
  const policy = getRoutePolicy(pathname)
  const userSurface = subject.isActive
    ? getRoleSurface(subject.role)
    : null

  if (!subject.isActive) {
    return {
      allowed: false,
      reason: "INACTIVE_USER",
      policy,
      userSurface: null,
    }
  }

  if (!policy) {
    return {
      allowed: false,
      reason: "NO_POLICY",
      policy: null,
      userSurface,
    }
  }

  /**
   * Surface tetap tidak boleh dibypass.
   *
   * Jadi Pelaksana tetap ditolak bila mencoba membuka /dashboard,
   * walaupun flag development sedang aktif.
   */
  if (userSurface !== policy.surface) {
    return {
      allowed: false,
      reason: "SURFACE_DENIED",
      policy,
      userSurface,
    }
  }

  /**
   * KERINGANAN KHUSUS DEVELOPMENT
   *
   * Hanya berlaku untuk:
   * - route desktop,
   * - Admin,
   * - Pemantau,
   * - flag yang sengaja dikirim proxy.
   *
   * Ini tidak mengubah role, JWT, database, session_version,
   * atau capability API.
   */
  const canBypassDesktopCapability =
    options.allowDesktopCapabilityBypass &&
    policy.surface === "desktop" &&
    (subject.role === "Admin" || subject.role === "Pemantau")

  if (canBypassDesktopCapability) {
    return {
      allowed: true,
      reason: "ALLOWED",
      policy,
      userSurface,
    }
  }

  if (!hasCapability(subject, policy.capability)) {
    return {
      allowed: false,
      reason: "CAPABILITY_DENIED",
      policy,
      userSurface,
    }
  }

  return {
    allowed: true,
    reason: "ALLOWED",
    policy,
    userSurface,
  }
}

function normalizePathname(pathname: string) {
  if (!pathname) {
    return "/"
  }

  const normalized = pathname
    .split("?")[0]
    ?.split("#")[0] ?? "/"

  if (normalized.length > 1 && normalized.endsWith("/")) {
    return normalized.slice(0, -1)
  }

  return normalized
}

/**
 * Daftar role yang boleh dipreview oleh role asli.
 *
 * Ini hanya untuk kebutuhan UI desktop. Fungsi ini tidak memberikan
 * capability baru dan tidak boleh digunakan sebagai pengganti otorisasi API.
 */
export function getPreviewableRoles(realRole: AppRole): readonly AppRole[] {
  return PREVIEWABLE_ROLES[realRole]
}