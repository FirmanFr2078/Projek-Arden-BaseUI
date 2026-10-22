import { ClassesView } from "@/components/dashboard/directory/classes/classes-view"
import { requirePageCapability } from "@/lib/page-guard"

/**
 * /dashboard/directory/classes
 *
 * Halaman tipis: pagar capability di server, lalu render tampilan.
 */
export default async function ClassesPage() {
  await requirePageCapability("student.view")

  return <ClassesView />
}