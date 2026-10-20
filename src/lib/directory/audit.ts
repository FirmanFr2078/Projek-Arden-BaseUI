import type { ActivityUserActor } from "@/types/activity"
import type { AuthenticatedUser } from "@/types/auth"

/**
 * Kategori activity log untuk semua aksi Directory.
 * Scope per entitas: directory.classes, directory.students,
 * directory.users.
 */
export const DIRECTORY_CATEGORY = "DIRECTORY"

/**
 * Mengubah user yang sedang login menjadi actor activity log.
 * Name dan role disalin sebagai snapshot oleh ActivityService.
 */
export function toActivityActor(user: AuthenticatedUser): ActivityUserActor {
  return {
    type: "USER",
    id: user.id,
    name: user.name,
    role: user.role,
  }
}