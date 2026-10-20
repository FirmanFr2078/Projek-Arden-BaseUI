# Configuration, UI, and Decisions

> Baca [00-START-HERE.md](./00-START-HERE.md) dahulu. Semua status di bawah menggambarkan repository saat blueprint dibuat.

## 1. Konfigurasi proyek

| Area | Referensi | Fungsi | Status / implikasi |
|---|---|---|---|
| Package | `package.json` | Script, dependency, package manager `pnpm@11.24.0` | **AKTIF** |
| TypeScript | `tsconfig.json` | Alias `@/` dan pemeriksaan type | **AKTIF** |
| ESLint | `eslint.config.mjs` | Lint Next/React | **AKTIF** |
| Next | `next.config.ts` bila tersedia | Konfigurasi framework | **BELUM TERVERIFIKASI** di blueprint ini; baca sebelum mengubah build/PWA |
| Prisma CLI | `prisma.config.ts` | Memuat `.env.local`, schema, migration, seed | **AKTIF** |
| Prisma schema | `prisma/schema.prisma` | Model PostgreSQL | **AKTIF** |
| Build approval | `pnpm-workspace.yaml` | Allow build untuk Prisma/bcrypt/esbuild | **AKTIF** |
| Styling | `src/app/globals.css` | Token theme, utility, animasi | **AKTIF** |

## 2. Environment variables

Jangan menyalin value environment ke source atau dokumen. Gunakan nama variable dan kategorinya saja.

| Variable | Kategori | Dipakai untuk | Aturan |
|---|---|---|---|
| `DATABASE_URL` | Secret server | Runtime `pg` / Prisma adapter | Tidak pernah ke browser |
| `DIRECT_URL` | Secret server | Prisma CLI migration/seed | Tidak pernah ke browser |
| `ARDEN_SESSION_SECRET` | Secret server | Sign/verify JWT ARDEN | Minimal 32 karakter; jangan memakai secret provider lain |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret server | `src/lib/storage.ts` | Tidak boleh diimpor client |
| `SUPABASE_SECRET_KEY` | Secret server | Konfigurasi Supabase server | Jangan expose |
| `NEXT_PUBLIC_SUPABASE_URL` | Public config | URL Supabase | Boleh sampai browser |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public config | Client Supabase bila diperlukan | Boleh sampai browser |
| `SEED_ADMIN_USERNAME` | Local bootstrap | Seed Admin | Hanya `.env.local`/deployment secret |
| `SEED_ADMIN_PASSWORD` | Secret bootstrap | Seed Admin | Jangan hardcode |

Semua `NEXT_PUBLIC_*` secara desain dapat masuk browser bundle. Secret tidak boleh memakai prefix tersebut.

## 3. Prisma, PostgreSQL, dan pool

### Status: AKTIF

`src/lib/prisma.ts` membuat:

```text
pg Pool
  → PrismaPg adapter
  → PrismaClient
```

Pool dan Prisma client dicache pada `globalThis` saat non-production. Ini mengurangi pembuatan koneksi berulang ketika hot reload development.

Konfigurasi pool yang ditemukan mencakup batas koneksi, idle timeout, dan connection timeout. Timeout tetap dapat terjadi bila Supabase/network tidak tersedia; jangan mengubah kegagalan database menjadi seolah session user invalid.

Prisma CLI memakai `DIRECT_URL` melalui `prisma.config.ts`, sedangkan runtime adapter memakai `DATABASE_URL`. Keduanya memiliki peran berbeda dan jangan ditukar tanpa memeriksa endpoint Supabase yang dipakai.

## 4. Migrasi UI: Base UI, bukan Radix UI

### Status: AKTIF

Primitive shadcn/ui dalam project ini menggunakan `@base-ui/react`, terbukti pada misalnya:

```text
src/components/ui/dropdown-menu.tsx
src/components/ui/sidebar.tsx
src/components/ui/collapsible.tsx
src/components/ui/avatar.tsx
```

### Konsekuensi API

| Kebutuhan | Base UI di proyek ini | Jangan salin dari Radix lama |
|---|---|---|
| Render Link/custom element | `render={<Link href="..." />}` | `asChild` |
| Dropdown open visual | `data-popup-open` | `data-[state=open]` |
| Collapsible panel visual | `data-panel-open` | `data-[state=open]` / asumsi Radix |
| Group label menu | `DropdownMenuLabel` di dalam `DropdownMenuGroup` | Label langsung di content |
| Dropdown width | `--anchor-width` | `--radix-dropdown-menu-trigger-width` |
| Focus hook Radix | Jangan diasumsikan tersedia | `onCloseAutoFocus` tanpa verifikasi |

Contoh aman yang dipakai di dashboard:

```tsx
<DropdownMenuTrigger
  render={<SidebarMenuButton size="lg" />}
>
  ...
</DropdownMenuTrigger>
```

Contoh struktur label Base UI:

```tsx
<DropdownMenuContent>
  <DropdownMenuGroup>
    <DropdownMenuLabel>Switch view as</DropdownMenuLabel>
    <DropdownMenuItem>...</DropdownMenuItem>
  </DropdownMenuGroup>
</DropdownMenuContent>
```

Pelanggaran terakhir ini pernah memicu runtime error `MenuGroupContext is missing`. Jangan menyalin component dropdown V.3 berbasis Radix tanpa menerjemahkan kontraknya.

### Component yang dikustomisasi

| Primitive | Penyesuaian aktual |
|---|---|
| `sidebar.tsx` | Provider, cookie collapse, Ctrl/Cmd+B, mobile sheet, rail, Base UI `render` |
| `dropdown-menu.tsx` | Wrapper `MenuPrimitive` Base UI dan GroupLabel context |
| `avatar.tsx` | Rounded clipping, `overflow-hidden`, `isolate`, object cover |
| `globals.css` | Theme token, `sidebar-shine`, animasi, responsive base styles |

## 5. Styling dan motion

`src/app/globals.css` memuat token dark/light, font, scrollbar, utility motion, dan `sidebar-shine`.

`sidebar-shine` adalah efek kilapan kaca. Ia harus mengikuti state Base UI seperti `data-active` atau `data-popup-open`; jangan hanya mengandalkan state attribute Radix lama.

Hormati `prefers-reduced-motion` ketika menambahkan motion baru. Jangan memakai animasi tak berhingga untuk informasi yang penting dibaca atau action yang sering terjadi.

## 6. Konfigurasi dashboard

| File | Fungsi | Status |
|---|---|---|
| `src/config/dashboard/menu.ts` | Urutan/label/icon/capability visual sidebar | **SEMENTARA**: sebagian route belum ada |
| `src/config/dashboard/role-display.ts` | Label, icon, deskripsi visual role | **AKTIF** untuk UI |
| `src/hooks/desktop/use-dashboard-navigation.ts` | Filter menu preview role, active state, breadcrumb | **AKTIF** sebagai UI adapter |
| `src/contexts/dashboard-preview-context.tsx` | Preview role sementara per tab | **AKTIF**, bukan auth |

`menu.ts` bukan policy keamanan. Otorisasi final tetap berada pada `access-engine.ts`, `requireCapability()`, dan API/server.

## 7. Keputusan dan batasan penting

### AKTIF / diputuskan oleh kode

- Satu identitas internal ARDEN dibuat oleh Admin; belum ada signup publik.
- OAuth provider nanti ditautkan ke user internal, bukan menjadi signup bebas.
- Identitas OAuth adalah `provider + provider_id`; email adalah metadata UI.
- Admin preview Pemantau hanya mengubah tampilan dashboard.
- Pelaksana adalah surface mobile terpisah, bukan preview role Admin.
- Activity actor memakai snapshot name/role agar log tetap terbaca setelah perubahan user.

### TRANSISI

- Banyak component template lama masih berada di `src/components/` (`app-sidebar.tsx`, `nav-main.tsx`, `nav-projects.tsx`, `team-switcher.tsx`, dan `nav-user.tsx`). Dashboard V.4 memakai versi di `src/components/dashboard/`.
- `src/lib/storage.ts` adalah helper server-side tetapi belum dipakai flow upload/profile. Sebelum dipakai, pastikan ia diberi pagar `import "server-only"` agar service-role key tidak bisa salah diimpor client.

### LEGACY

- Arden V.3 memakai Radix UI dan pattern `asChild`/state Radix. Jangan menjadikannya sumber copy-paste langsung untuk V.4.
- Pola context lama yang menyimpan real role di localStorage dan membersihkan focus guard Radix tidak dipakai oleh dashboard V.4.

### BELUM DITERAPKAN

- PWA/mobile implementation nyata.
- OAuth flow dan connection card.
- Supabase Storage upload route.
- Cron Vercel prayer sync.
- Realtime/event subscription.
- Theme preference yang benar-benar tersimpan.

## 8. Rekomendasi implementasi sebelum production

Rekomendasi ini bukan bukti bahwa ia sudah diterapkan:

1. Susun route policy spesifik sebelum prefix `/dashboard` umum, atau ubah matcher policy agar route baru tidak otomatis lolos `dashboard.view`.
2. Tambahkan rate limit login yang tahan lintas instance/deployment.
3. Tentukan standar CSRF/origin check untuk API mutation.
4. Tambahkan `server-only` pada semua module yang memegang secret/service-role client.
5. Buat test untuk access policy, JWT/session version, dan API mutation pertama.
6. Gunakan menu `comingSoon` atau sembunyikan route yang belum memiliki halaman agar user tidak mendapat 404.
