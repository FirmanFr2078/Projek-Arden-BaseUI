# ARDEN V.4 — AI Engineering Blueprint

> Status dokumen: **AKTIF**. Baca dokumen ini sebelum mengubah atau membuat fitur ARDEN V.4.

## Tujuan

Blueprint ini adalah indeks pengetahuan teknis untuk AI/developer. Ia merangkum pola yang **benar-benar ada** di repository agar pekerjaan lanjutan tidak perlu membaca seluruh source setiap kali mulai.

Dokumen ini bukan spesifikasi produk lengkap dan bukan bukti bahwa semua schema, menu, atau capability sudah menjadi fitur operasional.

## Stack aktual

| Area | Implementasi | Status |
|---|---|---|
| Framework | Next.js `16.3.3`, App Router, React `19` | **AKTIF** |
| Bahasa | TypeScript strict melalui `tsconfig.json` | **AKTIF** |
| Database | PostgreSQL + Prisma `7.7.0` + `@prisma/adapter-pg` + `pg` | **AKTIF** |
| Auth lokal | `bcrypt`, JWT `jose`, cookie `httpOnly` | **AKTIF** |
| UI primitive | shadcn/ui yang memakai `@base-ui/react` | **AKTIF** |
| Styling | Tailwind CSS 4 + `tw-animate-css` | **AKTIF** |
| Storage | Supabase Storage helper | **TRANSISI**: helper ada, flow upload belum ada |
| OAuth | model `tbl_connections` | **BELUM DITERAPKAN** |
| Mobile/Pelaksana | access policy `/go` dan `/me` | **BELUM DITERAPKAN**: page/layout belum ada |

## Status proyek singkat

### AKTIF

- Seed identitas Admin internal dari environment.
- Login lokal, JWT cookie, logout, dan revoke lewat `session_version`.
- Verifikasi user aktif dari database melalui `requireUser()`.
- Access engine untuk role, capability, surface, dan preview UI.
- Activity log untuk bootstrap, login, logout, dan sebagian kegagalan auth.
- Shell dashboard desktop: sidebar, breadcrumb, preview Admin → Pemantau, identity user, logout.

### SEMENTARA

- Dashboard Home di `src/app/(dekstop)/dashboard/page.tsx` adalah foundation/placeholder, bukan dashboard data nyata.
- Banyak item pada `src/config/dashboard/menu.ts` adalah roadmap navigasi; mayoritas route belum memiliki `page.tsx`.
- Folder route group masih bernama `(dekstop)`. Ini typo yang tidak mengubah URL, tetapi sebaiknya dirapikan hanya dalam refactor khusus.

### BELUM DITERAPKAN

- Directory user management, password reset, profile, connections/OAuth, heartbeat endpoint, activity log UI, Globals UI/API, attendance, akademik, dan realtime.
- Rate limiting login, standar CSRF untuk API mutasi, dan automated test suite.

## Aturan inti sebelum bekerja

1. Jangan menganggap menu, route policy, schema Prisma, atau capability sebagai feature yang selesai.
2. Jangan menaruh query Prisma, cookie, JWT secret, atau `bcrypt` di component client atau folder `types`.
3. UI presentasional tidak memegang business logic. Taruh state/request React di `hooks`, aturan bisnis di `engine`, dan query Prisma di `database`.
4. Semua API yang mengubah/menampilkan data sensitif wajib memeriksa user aktual dengan `requireUser()` atau `requireCapability()`.
5. Feature yang mengubah data penting wajib mempertimbangkan audit melalui `ActivityService`.
6. UI primitive proyek memakai **Base UI**, bukan Radix UI. Baca dokumen konfigurasi sebelum menyalin component dari proyek lama.
7. Jangan memasukkan secret ke source, activity detail, response API, atau dokumentasi.

## Peta direktori

```text
src/
├─ app/        route, layout, Route Handler API
├─ components/ UI dan dashboard shell
├─ config/     definisi statis, mis. menu dashboard
├─ contexts/   state UI lintas komponen, bukan security source
├─ database/   service/query Prisma per domain
├─ engine/     aturan bisnis, auth, access, normalisasi audit
├─ hooks/      adapter React; berawalan use-
├─ lib/        instance teknis dan utilitas
├─ types/      kontrak lintas lapisan
└─ proxy.ts    penyaring route Edge awal
```

## Rute dokumen berikutnya

- [Architecture and feature flow](./01-ARCHITECTURE-AND-FEATURE-FLOW.md): pola implementasi feature baru dari UI sampai database.
- [Security, activity, and data](./02-SECURITY-ACTIVITY-AND-DATA.md): auth, access, session, database, dan audit trail.
- [Configuration, UI, and decisions](./03-CONFIGURATION-UI-AND-DECISIONS.md): environment, Prisma, Base UI, styling, dan keputusan transisi.

## Pemeriksaan minimal sebelum menyerahkan perubahan

```powershell
pnpm lint
pnpm exec tsc --noEmit
pnpm exec prisma validate
```

Jalankan migration, seed, atau perubahan environment hanya bila pekerjaan memang memerlukannya dan sudah diminta secara eksplisit.
