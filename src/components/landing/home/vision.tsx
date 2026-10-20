import {
  ArrowRight,
  Cloud,
  FileWarning,
  ShieldCheck,
  Smartphone,
} from "lucide-react"
import Link from "next/link"

const evolution = [
  {
    icon: FileWarning,
    title: "Physical Records",
    description:
      "Ketergantungan pada kartu fisik, pencatatan manual, serta risiko data yang sulit ditelusuri.",
  },
  {
    icon: Smartphone,
    title: "Digital Validation",
    description:
      "Pencatatan menggunakan perangkat digital dengan QR sebagai salah satu metode validasi utama.",
  },
  {
    icon: Cloud,
    title: "Connected Data",
    description:
      "Data tersimpan secara terstruktur dan dapat digunakan lintas proses untuk membangun konteks validasi.",
  },
]

export function Vision() {
  return (
    <section className="relative border-t border-white/5 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* Mission */}
          <div>
            <p className="font-ar-inter text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-400">
              The Core Mission
            </p>

            <h2 className="mt-4 max-w-3xl font-ar-space text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Building Character
              <br />
              <span className="text-white/40">
                Through Data Precision.
              </span>
            </h2>

            <div className="mt-8 max-w-2xl space-y-5 font-sans text-base leading-7 text-white/50">
              <p>
                ARDEN dibangun untuk menjembatani proses pembentukan karakter
                dengan sistem pencatatan yang lebih terstruktur.
              </p>

              <p>
                Tujuannya bukan sekadar mengubah pencatatan manual menjadi
                digital, tetapi menciptakan proses yang lebih konsisten,
                transparan, dan dapat ditelusuri.
              </p>

              <p>
                Dengan data yang terorganisasi, setiap proses dapat memiliki
                konteks yang lebih jelas dan menjadi dasar evaluasi yang lebih
                baik.
              </p>
            </div>

            <div className="mt-10">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 font-ar-inter text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
              >
                Explore system documentation
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Stats / System Evolution */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/2.5 p-6">
                <ShieldCheck className="size-5 text-indigo-400" />

                <p className="mt-6 font-ar-space text-2xl font-bold text-white">
                  Auditable
                </p>

                <p className="mt-2 font-ar-inter text-xs leading-5 text-white/40">
                  Setiap proses penting dapat dirancang untuk memiliki jejak
                  data yang dapat ditelusuri.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/2.5 p-6">
                <Cloud className="size-5 text-indigo-400" />

                <p className="mt-6 font-ar-space text-2xl font-bold text-white">
                  Connected
                </p>

                <p className="mt-2 font-ar-inter text-xs leading-5 text-white/40">
                  Data terhubung untuk membantu proses validasi dan pelaporan.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-ar-inter text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                    System Evolution
                  </p>

                  <h3 className="mt-2 font-ar-space text-xl font-semibold text-white">
                    From manual records to connected data.
                  </h3>
                </div>

                <div className="hidden size-10 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/5 sm:flex">
                  <ArrowRight className="size-4 text-indigo-400" />
                </div>
              </div>

              <div className="mt-8 space-y-5">
                {evolution.map((item) => {
                  const Icon = item.icon

                  return (
                    <div key={item.title} className="flex gap-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/2.5">
                        <Icon className="size-4 text-white/50" />
                      </div>

                      <div>
                        <h4 className="font-ar-space text-sm font-semibold text-white">
                          {item.title}
                        </h4>

                        <p className="mt-1 font-ar-inter text-xs leading-5 text-white/40">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}