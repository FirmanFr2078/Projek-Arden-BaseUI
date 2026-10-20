# Security, Activity, and Data

> Baca [00-START-HERE.md](./00-START-HERE.md) terlebih dahulu. Dokumen ini mencatat mekanisme yang ditemukan pada source saat blueprint dibuat.

## 1. Batas keamanan

```text
Browser/UI
  → UX saja; tidak dipercaya untuk security

proxy.ts (Edge)
  → verifikasi JWT dan redirect awal route

Server Component / API Route (Node)
  → baca user aktual dari database
  → verifikasi is_active dan session_version
  → putuskan capability final
```

Preview role dashboard tidak pernah mengubah JWT, database, actor audit, atau capability API.

## 2. Auth dan session

### Status: AKTIF

| Bagian | File | Peran |
|---|---|---|
| JWT Edge-compatible | `src/engine/auth-session-engine.ts` | Sign/verify `jose`, issuer, audience, expiry |
| Auth Node-only | `src/engine/auth-engine.ts` | bcrypt, cookie `next/headers`, normalisasi username |
| User database | `src/database/auth.service.ts` | login, user aktif, logout, heartbeat helper |
| Server authorization | `src/engine/authorization-engine.ts` | `requireUser()` dan `requireCapability()` |
| Guard awal route | `src/proxy.ts` | proxy Edge tanpa Prisma/bcrypt |

Cookie tunggal adalah `arden_session`. Ia dibuat dengan `httpOnly`, `sameSite: "lax"`, `path: "/"`, dan `secure` di production.

### JWT bukan otorisasi akhir

JWT membawa `sub`, username, role, dan `sessionVersion`. Sesudah signature valid, server tetap membaca `tbl_users` melalui:

```ts
await AuthService.getActiveUser(
  session.userId,
  session.sessionVersion,
)
```

Tujuannya untuk menolak user yang dinonaktifkan, dihapus, berubah session, atau memiliki role database yang tidak valid.

### session_version

`tbl_users.session_version` adalah mekanisme revoke semua token lama milik user.

| Event aktif | Dampak |
|---|---|
| Logout | `session_version` dinaikkan oleh `AuthService.logout()` |
| Login | versi saat ini masuk ke JWT baru |
| Role/password/disable di masa depan | Wajib mempertimbangkan `incrementSessionVersion()` |

### Cookie mutation

`setSessionCookie()` dan `clearSessionCookie()` hanya boleh dipanggil oleh Route Handler atau Server Action. Mereka tidak boleh dipanggil dari Server Component/layout.

Status ini sudah diperbaiki dalam `requireUser()`: ia hanya memvalidasi session dan melempar `AuthorizationError`; layout kemudian redirect ke login tanpa mencoba menulis cookie.

## 3. Role, capability, dan surface

### Status: AKTIF sebagai policy

Sumber tunggal policy adalah `src/engine/access-engine.ts`.

```text
Admin     → desktop
Pemantau  → desktop
Pelaksana → mobile
```

Pemisahan `desktop/mobile` adalah surface kerja berdasarkan role, bukan pemeriksaan ukuran layar. Saat development, layout mobile boleh diuji dari browser desktop.

Contoh keputusan penting yang aktif:

```text
Admin      → attendance.manage, bukan attendance.record
Pelaksana  → attendance.record
```

Jadi Admin tidak otomatis bertindak sebagai operator mobile hanya karena memiliki hak kelola.

### Preview role

`DashboardPreviewProvider` di `src/contexts/dashboard-preview-context.tsx` adalah state UI sementara:

```text
Admin     → dapat preview Admin/Pemantau
Pemantau  → hanya Pemantau
Pelaksana → hanya Pelaksana
```

Ini bukan impersonation dan tidak menurunkan capability user asli di server.

### Catatan implementasi penting

`ROUTE_POLICIES` saat ini memiliki prefix umum `/dashboard` sebelum prefix yang lebih spesifik seperti `/dashboard/profile`. Karena `getRoutePolicy()` memakai `.find()`, prefix umum dapat menangkap route spesifik terlebih dahulu.

Status: **SEMENTARA / perlu diperbaiki sebelum Profile, Connections, atau route capability khusus dibuat.** Jangan menganggap policy spesifik dashboard saat ini sudah efektif.

## 4. Proxy

`src/proxy.ts`:

- Memverifikasi JWT via `verifySessionToken()`.
- Redirect login ke route awal berdasarkan role.
- Memisahkan desktop dan mobile melalui `canAccessRoute()`.
- Tidak memakai Prisma atau bcrypt agar tetap Edge-compatible.
- Menghapus cookie JWT rusak pada redirect ke login.

Proxy **tidak** dapat memastikan `is_active` atau `session_version` terkini karena ia tidak membaca database. Itu tugas `requireUser()` pada server/API.

Matcher yang ditemukan:

```text
/dashboard/:path*
/go/:path*
/me/:path*
/login
```

## 5. Activity audit trail

### Status: AKTIF untuk Auth dan seed

Data audit disimpan di `tbl_activity_logs`, dengan normalisasi pada:

```text
src/engine/activity-engine.ts
  → prepareActivityLog()

src/database/activity.service.ts
  → ActivityService.create()
  → ActivityService.createOnce()
  → ActivityService.list()
```

### Bentuk event

```ts
await ActivityService.create({
  actor: {
    type: "USER",
    id: user.id,
    name: user.name,
    role: user.role,
  },
  category: "AUTH",
  scope: "auth.login",
  action: "auth.local-login",
  outcome: "SUCCESS",
  targetType: "user",
  targetId: user.id,
  summary: "Berhasil login menggunakan username dan password.",
  details: { method: "LOCAL" },
})
```

| Field | Fungsi aktual |
|---|---|
| `actor` | USER dengan snapshot identitas, atau SYSTEM untuk proses otomatis |
| `category` | Kelompok besar, dinormalisasi uppercase, mis. `AUTH` |
| `scope` | Lokasi fitur, dinormalisasi lowercase, mis. `auth.login` |
| `action` | Identifier aksi stabil, dinormalisasi lowercase |
| `outcome` | `SUCCESS`, `FAILED`, atau `SKIPPED` |
| `targetType` / `targetId` | Data terdampak, untuk feed per entitas/card |
| `summary` | Kalimat singkat untuk UI audit |
| `details` | JSON aman untuk before/after, revision, durasi, atau kode error |

### Kapan feature baru wajib diaudit

Buat log untuk aksi yang mengubah state operasional atau administratif, misalnya:

- Buat/nonaktifkan user, ubah role, reset password.
- Ubah Global Geographic, QR, jadwal prayer, atau routine.
- Link/unlink provider OAuth.
- Input/ubah attendance, menstruation, warning, atau recap.
- Proses cron/sinkronisasi yang sukses, gagal, atau dilewati.

Tidak perlu log untuk event berfrekuensi tinggi yang tidak bernilai audit, seperti heartbeat. `recordHeartbeat()` memang tidak mencatat activity.

### Transaction dan kegagalan log

`AuthService.loginWithPassword()` adalah referensi terbaik: update user dan activity login berada dalam `prisma.$transaction()`.

Untuk security revoke logout, session version dinaikkan lebih dahulu. Jika activity log logout gagal, security revoke tidak dibatalkan; kegagalan audit dicetak ke server log. Ini keputusan implementasi aktual.

`ActivityService.createOnce()` membuat deduplikasi best-effort berbasis cooldown untuk error sistem berulang. Ia bukan distributed lock; event paralel masih bisa berduplikasi.

### Audit trail vs logging teknis

| Jenis | Tujuan | Lokasi saat ini |
|---|---|---|
| Audit trail | Siapa mengubah apa, kapan, hasilnya apa | `tbl_activity_logs` |
| Logging teknis | Timeout Prisma, stack, deployment/runtime failure | terminal development / Vercel runtime log |

Jika database tidak dapat dihubungi, jangan memaksa membuat activity log karena tabel log berada di database yang sama. Log teknis server adalah sumber diagnosis pada kondisi itu.

### Data sensitif yang dilarang masuk log

```text
password mentah
password hash
JWT/cookie/session token
ARDEN_SESSION_SECRET
DATABASE_URL
Supabase service-role/secret key
raw authorization header
```

## 6. Database dan identitas

### tbl_users — AKTIF

Kolom penting:

```text
username          → login internal unik
password          → bcrypt hash
role              → Admin/Pemantau/Pelaksana
is_active         → blokir access/login
session_version   → revoke token lama
last_login        → login sukses terakhir
last_seen_at      → presence UI, bukan bukti keamanan
```

### tbl_connections — BELUM DITERAPKAN sebagai flow

Model sudah siap untuk OAuth provider:

```text
provider + provider_id → identitas provider yang dipercaya
email                  → metadata UI, bukan kunci kecocokan
metadata               → data unik provider
```

Belum ada callback OAuth, linking UI, API, atau login provider. Jangan menganggap Connections selesai hanya karena tabel sudah ada.

### Domain lain — BELUM DITERAPKAN

`tbl_students`, `tbl_classes`, `tbl_attendance`, Globals, prayers, QR, dan domain lain berada di schema/migration, tetapi belum memiliki full feature path V.4.
