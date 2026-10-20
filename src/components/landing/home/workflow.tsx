import {
  CheckCircle2,
  ClipboardCheck,
  Database,
  ScanLine,
  ShieldAlert,
} from "lucide-react"

const workflow = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Officer Checkpoint",
    description:
      "Siswi melakukan proses pencatatan melalui petugas atau perangkat yang telah ditentukan.",
  },
  {
    number: "02",
    icon: ScanLine,
    title: "Dual-Mode Entry",
    description:
      "QR menjadi metode utama, sementara mode manual tersedia sebagai fallback dengan alasan yang tercatat.",
  },
  {
    number: "03",
    icon: Database,
    title: "Cross-Session Sync",
    description:
      "Data dari sesi sebelumnya digunakan sebagai konteks untuk membantu validasi sesi berikutnya.",
  },
  {
    number: "04",
    icon: ShieldAlert,
    title: "Logic & Anomaly Audit",
    description:
      "Sistem memeriksa kemungkinan ketidaksesuaian berdasarkan aturan dan kondisi yang telah ditentukan.",
  },
  {
    number: "05",
    icon: CheckCircle2,
    title: "Final Verdict",
    description:
      "Hasil validasi menghasilkan status yang dapat digunakan untuk proses administrasi selanjutnya.",
  },
]

export function Workflow() {
  return (
    <section className="border-t border-white/5 bg-white/1.5 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="font-ar-inter text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-400">
            Integrity Pipeline
          </p>

          <h2 className="mt-4 font-ar-space text-3xl font-bold tracking-tight text-white sm:text-5xl">
            From entry
            <br />
            <span className="text-white/40">to final verdict.</span>
          </h2>

          <p className="mt-6 font-sans text-base leading-7 text-white/50">
            Alur validasi dibuat berlapis sehingga data tidak hanya dicatat,
            tetapi juga dapat diperiksa berdasarkan konteks dan aturan sistem.
          </p>
        </div>

        <div className="relative mt-16">
          {/* Connecting line */}
          <div className="absolute left-5 top-5 hidden h-px w-[calc(100%-2.5rem)] bg-white/10 lg:block" />

          <div className="grid gap-10 lg:grid-cols-5 lg:gap-6">
            {workflow.map((step) => {
              const Icon = step.icon

              return (
                <article key={step.number} className="relative">
                  <div className="relative flex size-10 items-center justify-center rounded-full border border-indigo-500/30 bg-black">
                    <Icon className="size-4 text-indigo-400" />
                  </div>

                  <p className="mt-6 font-ar-inter text-[10px] font-semibold tracking-[0.2em] text-indigo-400">
                    STEP {step.number}
                  </p>

                  <h3 className="mt-2 font-ar-space text-lg font-semibold text-white">
                    {step.title}
                  </h3>

                  <p className="mt-3 font-sans text-sm leading-6 text-white/45">
                    {step.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}