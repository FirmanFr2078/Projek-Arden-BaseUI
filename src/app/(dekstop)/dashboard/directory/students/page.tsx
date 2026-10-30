import { StudentsView } from "@/components/dashboard/directory/students/students-view"
import { requirePageCapability } from "@/lib/page-guard"

/**
 * /dashboard/directory/students
 *
 * Halaman tipis: pagar capability di server, lalu render tampilan.
 */
export default async function StudentsPage() {
  await requirePageCapability("student.view")

  return <StudentsView />
}