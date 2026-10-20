import { Prisma } from "@prisma/client"

import { prepareActivityLog } from "@/engine/activity-engine"
import { prisma } from "@/lib/prisma"
import type {
  ActivityLogQuery,
  ActivityLogRecord,
  CreateActivityLogInput,
} from "@/types/activity"

type ActivityDatabase = Prisma.TransactionClient | typeof prisma

/**
 * Satu-satunya pintu database untuk activity log.
 *
 * Service/domain lain tidak menulis tbl_activity_logs secara langsung.
 * Semua event harus melalui engine agar category, scope, action,
 * actor, dan outcome selalu memiliki format yang konsisten.
 */
export class ActivityService {
  static async create(
    input: CreateActivityLogInput,
    database: ActivityDatabase = prisma,
  ): Promise<ActivityLogRecord> {
    const event = prepareActivityLog(input)

    const log = await database.tbl_activity_logs.create({
      data: {
        ...event,
        details: event.details as Prisma.InputJsonValue | undefined,
      },
    })

    return toActivityLogRecord(log)
  }

  /**
   * Membuat event dengan deduplikasi waktu sederhana.
   *
   * Dipakai untuk error sistem berulang seperti:
   * - secret auth tidak tersedia
   * - dependency timeout
   * - database gagal merespons
   *
   * Tujuannya agar satu error yang terjadi berkali-kali tidak
   * memenuhi dashboard activity.
   *
   * Ini bukan lock distribusi; dua request yang sangat bersamaan
   * masih mungkin menghasilkan dua log. Untuk kebutuhan audit
   * ARDEN, best-effort deduplication ini sudah cukup.
   */
  static async createOnce(
    input: CreateActivityLogInput,
    cooldownMs = 5 * 60 * 1000,
  ): Promise<ActivityLogRecord | null> {
    const event = prepareActivityLog(input)
    const threshold = new Date(Date.now() - cooldownMs)

    const recentLog = await prisma.tbl_activity_logs.findFirst({
      where: {
        actor_type: event.actor_type,
        category: event.category,
        scope: event.scope,
        action: event.action,
        outcome: event.outcome,
        timestamp: {
          gte: threshold,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    if (recentLog) {
      return null
    }

    const log = await prisma.tbl_activity_logs.create({
      data: {
        ...event,
        details: event.details as Prisma.InputJsonValue | undefined,
      },
    })

    return toActivityLogRecord(log)
  }

  static async list(
    query: ActivityLogQuery = {},
  ): Promise<ActivityLogRecord[]> {
    const logs = await prisma.tbl_activity_logs.findMany({
      where: {
        category: query.category?.trim().toUpperCase(),
        scope: query.scope?.trim().toLowerCase(),
        target_type: query.targetType?.trim().toLowerCase(),
        target_id:
          query.targetId === undefined
            ? undefined
            : String(query.targetId),
      },
      orderBy: {
        timestamp: "desc",
      },
      take: Math.min(Math.max(query.take ?? 20, 1), 100),
    })

    return logs.map(toActivityLogRecord)
  }
}

function toActivityLogRecord(log: {
  id_log: bigint
  actor_type: string
  id_user: bigint | null
  actor_name: string | null
  actor_role: string | null
  category: string
  scope: string
  action: string
  outcome: string | null
  target_type: string | null
  target_id: string | null
  summary: string
  details: Prisma.JsonValue | null
  timestamp: Date
}): ActivityLogRecord {
  return {
    id: String(log.id_log),
    actorType: log.actor_type as ActivityLogRecord["actorType"],
    userId: log.id_user === null ? null : String(log.id_user),
    actorName: log.actor_name,
    actorRole: log.actor_role,
    category: log.category,
    scope: log.scope,
    action: log.action,
    outcome: log.outcome as ActivityLogRecord["outcome"],
    targetType: log.target_type,
    targetId: log.target_id,
    summary: log.summary,
    details: log.details as Record<string, unknown> | null,
    timestamp: log.timestamp,
  }
}