import type {
  ActivityActor,
  ActivityOutcome,
  CreateActivityLogInput,
} from "@/types/activity"

type PreparedActivityLog = {
  actor_type: "USER" | "SYSTEM"
  id_user?: bigint
  actor_name?: string
  actor_role?: string
  category: string
  scope: string
  action: string
  outcome: ActivityOutcome
  target_type?: string
  target_id?: string
  summary: string
  details?: Record<string, unknown>
}

/**
 * Menormalisasi semua event audit sebelum disimpan.
 * Engine ini tidak mengakses Prisma atau Next sehingga dapat dipakai dari
 * API route, cron, maupun service domain yang berbeda.
 */
export function prepareActivityLog(
  input: CreateActivityLogInput
): PreparedActivityLog {
  return {
    ...prepareActor(input.actor),
    category: requireValue(input.category, "category").toUpperCase(),
    scope: requireValue(input.scope, "scope").toLowerCase(),
    action: requireValue(input.action, "action").toLowerCase(),
    outcome: input.outcome ?? "SUCCESS",
    target_type: input.targetType?.trim().toLowerCase() || undefined,
    target_id:
      input.targetId === undefined ? undefined : String(input.targetId),
    summary: requireValue(input.summary, "summary"),
    details: input.details,
  }
}

function prepareActor(actor: ActivityActor) {
  if (actor.type === "SYSTEM") {
    return {
      actor_type: "SYSTEM" as const,
      actor_name: actor.name?.trim() || "ARDEN System",
    }
  }

  return {
    actor_type: "USER" as const,
    id_user: BigInt(actor.id),
    actor_name: requireValue(actor.name, "actor.name"),
    actor_role: requireValue(actor.role, "actor.role"),
  }
}

function requireValue(value: string, name: string) {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`Activity log membutuhkan ${name}.`)
  }

  return normalized
}
