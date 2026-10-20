/**
 * Kontrak activity log lintas engine, database, API, hook, dan UI.
 * Nilai-nilai ini sengaja berupa string agar kategori baru dapat ditambahkan
 * tanpa migrasi enum database.
 */

export const ACTIVITY_ACTOR_TYPES = ["USER", "SYSTEM"] as const
export type ActivityActorType = (typeof ACTIVITY_ACTOR_TYPES)[number]

export const ACTIVITY_OUTCOMES = ["SUCCESS", "FAILED", "SKIPPED"] as const
export type ActivityOutcome = (typeof ACTIVITY_OUTCOMES)[number]

/** Identitas user yang disalin ke log ketika sebuah aksi dilakukan. */
export type ActivityUserActor = {
  type: "USER"
  id: bigint | number | string
  name: string
  role: string
}

/** Actor untuk cron, engine, atau proses otomatis yang tidak memiliki user. */
export type ActivitySystemActor = {
  type: "SYSTEM"
  name?: string
}

export type ActivityActor = ActivityUserActor | ActivitySystemActor

/** Payload yang digunakan fitur untuk mencatat satu event audit. */
export type CreateActivityLogInput = {
  actor: ActivityActor
  category: string
  scope: string
  action: string
  summary: string
  outcome?: ActivityOutcome
  targetType?: string
  targetId?: bigint | number | string
  details?: Record<string, unknown>
}

/** Bentuk log yang aman dikirim ke browser; BigInt telah diubah menjadi string. */
export type ActivityLogRecord = {
  id: string
  actorType: ActivityActorType
  userId: string | null
  actorName: string | null
  actorRole: string | null
  category: string
  scope: string
  action: string
  outcome: ActivityOutcome | null
  targetType: string | null
  targetId: string | null
  summary: string
  details: Record<string, unknown> | null
  timestamp: Date
}

export type ActivityLogQuery = {
  category?: string
  scope?: string
  targetType?: string
  targetId?: bigint | number | string
  take?: number
}
