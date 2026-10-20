"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
  type RefObject,
} from "react";

import {
  SiNextdotjs,
  SiReact,
  SiTypescript,
  SiTailwindcss,
  SiPrisma,
  SiSupabase,
  SiVercel,
} from "@icons-pack/react-simple-icons";

const technologies = [
  {
    name: "Next.js",
    icon: SiNextdotjs,
    color: "#FFFFFF",
  },
  {
    name: "React",
    icon: SiReact,
    color: "#61DAFB",
  },
  {
    name: "TypeScript",
    icon: SiTypescript,
    color: "#3178C6",
  },
  {
    name: "Tailwind CSS",
    icon: SiTailwindcss,
    color: "#06B6D4",
  },
  {
    name: "Prisma",
    icon: SiPrisma,
    color: "#FFFFFF",
  },
  {
    name: "Supabase",
    icon: SiSupabase,
    color: "#3ECF8E",
  },
  {
    name: "Vercel",
    icon: SiVercel,
    color: "#FFFFFF",
  },
];

type TechnologyIconProps = {
  size?: number;
  color?: string;
  className?: string;
  "aria-hidden"?: boolean;
};

function TechnologyGroup({
  groupRef,
}: {
  groupRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={groupRef} className="flex shrink-0 items-center gap-8 pr-8">
      {technologies.map((technology) => {
        const Icon = technology.icon as ComponentType<TechnologyIconProps>;

        return (
          <div
            key={technology.name}
            className="group/item flex shrink-0 items-center gap-2.5"
          >
            <Icon
              size={16}
              color={technology.color}
              className="opacity-70 transition-opacity duration-300 group-hover/item:opacity-100"
              aria-hidden
            />

            <span className="font-ar-space text-sm font-medium whitespace-nowrap text-white/45 transition-colors duration-300 group-hover/item:text-white/80">
              {technology.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function TechStack() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  /*
   * Jumlah group dihitung otomatis berdasarkan:
   *
   * viewport width / sequence width
   *
   * + 1 group ekstra sebagai buffer.
   */
  const [groupCount, setGroupCount] = useState(2);

  /*
   * Lebar satu sequence.
   *
   * Ini menjadi jarak perpindahan marquee.
   */
  const [groupWidth, setGroupWidth] = useState(0);

  /*
   * Mengukur ulang marquee ketika:
   * - halaman pertama kali render
   * - ukuran browser berubah
   * - isi sequence berubah
   */
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const group = groupRef.current;

    if (!viewport || !group) return;

    const updateMarquee = () => {
      const viewportWidth = viewport.clientWidth;
      const sequenceWidth = group.offsetWidth;

      if (!viewportWidth || !sequenceWidth) return;

      setGroupWidth(sequenceWidth);

      /*
       * Minimal 2 group.
       *
       * Kalau sequence lebih pendek daripada viewport,
       * tambahkan group sebanyak yang diperlukan agar
       * tidak pernah ada area kosong.
       *
       * +2 memberikan satu buffer ekstra di luar viewport.
       */
      const requiredGroups = Math.ceil(viewportWidth / sequenceWidth) + 2;

      setGroupCount(Math.max(2, requiredGroups));
    };

    updateMarquee();

    const resizeObserver = new ResizeObserver(updateMarquee);

    resizeObserver.observe(viewport);
    resizeObserver.observe(group);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /*
   * Recalculate setelah font selesai dimuat.
   *
   * Ini penting karena perubahan font dapat mengubah
   * lebar sequence.
   */
  useEffect(() => {
    if (!document.fonts) return;

    document.fonts.ready.then(() => {
      const viewport = viewportRef.current;
      const group = groupRef.current;

      if (!viewport || !group) return;

      const viewportWidth = viewport.clientWidth;
      const sequenceWidth = group.offsetWidth;

      if (!viewportWidth || !sequenceWidth) return;

      setGroupWidth(sequenceWidth);

      const requiredGroups = Math.ceil(viewportWidth / sequenceWidth) + 2;

      setGroupCount(Math.max(2, requiredGroups));
    });
  }, []);

  /*
   * Kecepatan marquee.
   *
   * Semakin besar nilainya, semakin cepat gerakannya.
   * 30px/s memberikan gerakan yang cukup tenang untuk
   * ticker teknologi seperti ini.
   */
  const MARQUEE_SPEED = 30;

  const duration =
    groupWidth > 0 ? Math.max(groupWidth / MARQUEE_SPEED, 10) : 28;

  const marqueeStyle = {
    "--marquee-distance": `${groupWidth}px`,
    "--marquee-duration": `${duration}s`,
  } as CSSProperties;

  return (
    <section className="overflow-hidden border-y border-white/5 bg-white/1.5">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          {/* Label */}
          <div className="relative z-10 shrink-0 pr-4">
            <span className="font-ar-inter text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
              Built with
            </span>
          </div>

          {/* Marquee viewport */}
          <div
            ref={viewportRef}
            className="relative min-w-0 flex-1 overflow-hidden mask-[linear-gradient(to_right,transparent_0%,black_6%,black_94%,transparent_100%)]"
          >
            <div
              className="flex w-max animate-marquee will-change-transform"
              style={marqueeStyle}
            >
              {Array.from({ length: groupCount }).map((_, index) => (
                <TechnologyGroup
                  key={index}
                  groupRef={index === 0 ? groupRef : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
