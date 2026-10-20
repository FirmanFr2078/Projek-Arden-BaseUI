/**
 * Gaya bersama untuk semua pop-up sidebar (menu role, menu user, flyout
 * submenu saat sidebar tertutup) agar tampilannya seragam.
 */

/**
 * Jarak pop-up dari tombol pemicunya (px). Tombol berada 8px di dalam tepi
 * sidebar, jadi nilai 16 menghasilkan jarak visual 8px dari tepi sidebar.
 */
export const DASHBOARD_POPUP_SIDE_OFFSET = 16

/**
 * Container pop-up yang statis dan netral:
 * - ring bawaan DropdownMenuContent dimatikan (`ring-0`),
 * - tanpa bayangan,
 * - satu border tipis permanen agar tepi terlihat di latar gelap,
 * - tidak ada kelas hover/focus pada container; hanya item di dalamnya
 *   yang boleh bereaksi.
 *
 * Lebar ditentukan oleh masing-masing pop-up.
 */
export const DASHBOARD_POPUP_CLASSNAME =
  "rounded-xl border border-sidebar-border/90 bg-sidebar/90 p-1.5 text-sidebar-foreground shadow-none ring-0 backdrop-blur-xl"

/**
 * Label grup di dalam pop-up: hanya teks, tanpa latar dan border.
 */
export const DASHBOARD_POPUP_LABEL_CLASSNAME =
  "px-2.5 py-2 text-2xs font-semibold tracking-[0.14em] text-sidebar-foreground/55 uppercase"

/**
 * Item di dalam pop-up. Hover hanya menampilkan kilau (.sidebar-shine),
 * tanpa latar.
 *
 * Base UI menandai item yang di-hover dengan fokus, dan DropdownMenuItem
 * bawaan memberi `focus:bg-accent`, jadi `focus:bg-transparent` diperlukan
 * untuk menimpanya. Item aktif tetap berlatar lewat `data-active`.
 */
export const DASHBOARD_POPUP_ITEM_CLASSNAME =
  "sidebar-shine cursor-pointer rounded-lg px-2.5 text-sidebar-foreground/70 transition-colors duration-500 ease-(--transition-timing-function-smooth) hover:text-sidebar-accent-foreground focus:bg-transparent data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"