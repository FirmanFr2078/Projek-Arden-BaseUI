import {
  Activity,
  BrainCircuit,
  CalendarRange,
  ClipboardCheck,
  Cloud,
  FileSpreadsheet,
  LockKeyhole,
  Radio,
  ScanLine,
} from "lucide-react"

const features = [
  {
    icon: BrainCircuit,
    title: "Smart Anomaly Detection",
    description:
      "Mendeteksi ketidaksesuaian logika antar sesi untuk membantu menemukan data yang perlu diperiksa.",
  },
  {
    icon: Activity,
    title: "Configurable Bio-Logic",
    description:
      "Parameter pencatatan siklus dapat dikonfigurasi sesuai kebutuhan sistem dan kebijakan yang digunakan.",
  },
  {
    icon: ScanLine,
    title: "Hybrid Input Protocol",
    description:
      "Mendukung QR scanning sebagai metode utama dengan manual input sebagai fallback yang tetap tercatat.",
  },
  {
    icon: LockKeyhole,
    title: "Lost Card Lifecycle",
    description:
      "Mencatat status kartu yang hilang sampai proses penggantian dan validasi selesai.",
  },
  {
    icon: Radio,
    title: "Strict Role Hierarchy",
    description:
      "Hak akses dibangun berdasarkan peran sehingga setiap tindakan dapat dibatasi sesuai kewenangannya.",
  },
  {
    icon: CalendarRange,
    title: "Visual Cycle Calendar",
    description:
      "Data siklus ditampilkan dalam bentuk kalender agar pola dan status dapat dipahami dengan lebih mudah.",
  },
  {
    icon: ClipboardCheck,
    title: "Administrative Audit",
    description:
      "Aktivitas dan kondisi tidak normal dicatat untuk membantu proses pemeriksaan administratif.",
  },
  {
    icon: Cloud,
    title: "Real-time Cloud Sync",
    description:
      "Data lapangan dapat disinkronkan dengan penyimpanan pusat untuk menjaga konsistensi antar sesi.",
  },
  {
    icon: FileSpreadsheet,
    title: "Automated Reporting",
    description:
      "Data yang telah tercatat dapat digunakan sebagai dasar rekap dan laporan secara lebih terstruktur.",
  },
]

export function Features() {
  return (
    <section className="relative border-t border-white/5 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="max-w-2xl">
          <p className="font-ar-inter text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-400">
            System Capabilities
          </p>

          <h2 className="mt-4 font-ar-space text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Built around
            <br />
            <span className="text-white/40">data integrity.</span>
          </h2>

          <p className="mt-6 font-sans text-base leading-7 text-white/50">
            Setiap bagian ARDEN dirancang untuk membuat proses pencatatan
            lebih terstruktur, validasi lebih jelas, dan data lebih mudah
            ditelusuri.
          </p>
        </div>

        {/* Feature grid */}
        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <article
                key={feature.title}
                className="group bg-black p-6 transition hover:bg-white/2.5 sm:p-8"
              >
                <div className="flex size-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/5">
                  <Icon className="size-4 text-indigo-400" />
                </div>

                <h3 className="mt-6 font-ar-space text-lg font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 font-sans text-sm leading-6 text-white/45">
                  {feature.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}