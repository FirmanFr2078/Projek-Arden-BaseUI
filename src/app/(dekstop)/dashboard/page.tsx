import {
  Activity,
  BellRing,
  Database,
  ShieldCheck,
} from "lucide-react"

/**
 * Dashboard Home tahap fondasi.
 *
 * Halaman ini belum memakai API statistik karena domain attendance,
 * student, cycle, dan activity card belum dimigrasikan penuh ke V.4.
 *
 * Tetapi shell, session, role asli, preview Pemantau, sidebar,
 * breadcrumb, serta logout sudah nyata dan terintegrasi.
 */
export default function DashboardPage() {
  return (
    <section className="flex flex-1 flex-col gap-6 py-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-primary">
          ARDEN / DASHBOARD HOME
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Dashboard foundation is ready.
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Identitas akun, role, desktop surface, role preview, navigasi,
          breadcrumb, dan session-aware logout sudah menjadi pondasi halaman
          ini. Statistik dan modul operasional akan masuk setelah domainnya
          memiliki API, database service, engine, hook, serta activity log.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FoundationCard
          icon={ShieldCheck}
          title="Session & Access"
          description="Role asli tervalidasi dari server."
          status="Integrated"
        />

        <FoundationCard
          icon={Activity}
          title="Activity System"
          description="Siap menjadi sumber audit setiap modul."
          status="Ready"
        />

        <FoundationCard
          icon={Database}
          title="Domain Data"
          description="Dashboard metric masih placeholder."
          status="Pending"
        />

        <FoundationCard
          icon={BellRing}
          title="Realtime Updates"
          description="Masuk setelah card memiliki data nyata."
          status="Planned"
        />
      </div>

      <div className="min-h-72 rounded-xl border border-dashed bg-muted/20 p-6">
        <p className="text-sm font-medium">Home content area</p>

        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Area ini sengaja belum memakai dummy logic yang berat. Ketika modul
          attendance, student, cycle, dan activity selesai dimigrasikan,
          komponen dashboard home akan menerima data dari hook khusus domain
          tersebut.
        </p>
      </div>
    </section>
  )
}

type FoundationCardProps = {
  icon: React.ElementType
  title: string
  description: string
  status: string
}

function FoundationCard({
  icon: Icon,
  title,
  description,
  status,
}: FoundationCardProps) {
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>

        <span className="rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {status}
        </span>
      </div>

      <h2 className="mt-4 font-semibold">{title}</h2>

      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </article>
  )
}