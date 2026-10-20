# Architecture and Feature Flow

> Baca bersama [00-START-HERE.md](./00-START-HERE.md). Status pola di bawah: **AKTIF** kecuali diberi label lain.

## 1. Tanggung jawab tiap lapisan

| Lapisan | Lokasi | Tanggung jawab | Tidak boleh berisi |
|---|---|---|---|
| Kontrak | `src/types/` | Type lintas server/client, literal role/capability | Prisma, JWT secret, browser state |
| Aturan murni | `src/engine/` | Policy, normalisasi, validasi aturan bisnis | JSX, query UI, state React |
| Database service | `src/database/` | Query Prisma per domain dan mapping record | Component/UI |
| Route/API | `src/app/api/**/route.ts` | Parsing request, auth, HTTP status/response | Business rule besar yang dapat dipakai ulang |
| Hook | `src/hooks/` | State React, request API, UX loading/error | Secret, Prisma, capability sebagai security final |
| Component | `src/components/` | Render UI dan event ke hook | Query Prisma, cookie, JWT, aturan bisnis panjang |
| Config | `src/config/` | Definisi statis visual/menu | Security final atau state runtime |
| Lib | `src/lib/` | Instance/infrastruktur teknis | Policy domain tersembunyi |

Contoh pembagian yang aktif:

```text
src/types/auth.ts                 → AppRole, AuthenticatedUser
src/engine/access-engine.ts       → role/capability/surface policy
src/database/auth.service.ts      → tbl_users dan lifecycle auth
src/app/api/auth/login/route.ts   → HTTP login
src/hooks/auth/use-login.ts       → state form login
src/components/auth/login-form.tsx→ render form
```

## 2. Alur feature target

Gunakan urutan berikut sebagai pola utama. Beberapa domain lama belum memilikinya secara lengkap; jangan menyatakan feature selesai sebelum jalur yang diperlukan benar-benar ada.

```text
UI component
  → hook React
  → Route Handler API
  → requireUser / requireCapability
  → validasi request
  → engine / database service
  → Prisma / PostgreSQL
  → ActivityService bila event perlu diaudit
  → respons HTTP terstruktur
  → hook memperbarui UI
```

Urutan dapat sedikit berbeda untuk server-rendered read page: page/layout boleh memanggil `requireUser()` dan database service di server. Tetapi component client tetap tidak boleh mengimpor Prisma atau auth engine Node.

## 3. Contoh aktual: login lokal

### UI dan hook

`src/components/auth/login-form.tsx` hanya merender field dan meneruskan submit ke `useLogin()`:

```tsx
<form onSubmit={(event) => {
  event.preventDefault()
  void login()
}}>
```

`src/hooks/auth/use-login.ts` memegang state `username`, `password`, loading, dan pesan error; lalu mengirim `POST /api/auth/login`. Hook menentukan redirect UX memakai `getDefaultRouteForRole()`, tetapi ini **bukan** security boundary.

### API dan service

`src/app/api/auth/login/route.ts`:

1. Memastikan JSON dan `username/password` berbentuk string.
2. Memanggil `AuthService.loginWithPassword()`.
3. Membuat JWT melalui `createSessionToken()`.
4. Menetapkan cookie lewat `setSessionCookie()`.
5. Mengembalikan data user tanpa password/token.

`src/database/auth.service.ts` melakukan pekerjaan domain:

```ts
const user = await prisma.tbl_users.findUnique({
  where: { username },
})

const isPasswordValid = user
  ? await verifyPassword(input.password, user.password)
  : false
```

Sesudah password dan `is_active` valid, service memakai transaction untuk memperbarui `last_login`, `last_seen_at`, dan menulis audit login. Ini contoh yang harus diikuti jika satu aksi bisnis membutuhkan perubahan data dan audit yang harus konsisten.

## 4. Cara membuat database service baru

Buat satu service per domain, misalnya kelak `src/database/geographic.service.ts`, bukan query Prisma langsung dari API/component.

Tanggung jawab service:

- Mengubah input yang sudah valid menjadi query Prisma.
- Menjaga operasi terkait tetap atomik dengan `prisma.$transaction()` bila diperlukan.
- Mengembalikan bentuk data domain yang aman untuk dipakai layer di atasnya.
- Memanggil `ActivityService.create()` bila audit adalah bagian dari transaksi domain.

Pola aktual audit dalam transaction, disederhanakan dari `AuthService.loginWithPassword()`:

```ts
return prisma.$transaction(async (database) => {
  const updated = await database.tbl_users.updateMany({
    where: { id_user: userId, is_active: true },
    data: { last_login: new Date() },
  })

  if (updated.count !== 1) {
    throw new AuthEngineError("ACCOUNT_DISABLED", "...")
  }

  await ActivityService.create(
    {
      actor: { type: "USER", id: userId, name, role },
      category: "AUTH",
      scope: "auth.login",
      action: "auth.local-login",
      outcome: "SUCCESS",
      summary: "Berhasil login menggunakan username dan password.",
    },
    database,
  )
})
```

Jangan menggunakan transaction untuk heartbeat atau operasi sangat sering bila audit tidak diperlukan. `AuthService.recordHeartbeat()` sengaja hanya melakukan update presence.

## 5. Cara membuat API baru

Lokasi mengikuti App Router, misalnya:

```text
src/app/api/globals/geographic/route.ts
```

Urutan Route Handler:

1. Tetapkan `export const runtime = "nodejs"` bila memakai Prisma, bcrypt, atau library Node.
2. Verifikasi user dengan `requireUser()` atau `requireCapability("...")`.
3. Parse JSON/form request dengan `try/catch`.
4. Validasi bentuk dan batas value sebelum service dipanggil.
5. Panggil engine/service domain.
6. Kembalikan response JSON stabil dan `Cache-Control: no-store` untuk data session/dinamis.
7. Jangan kirim password hash, token, secret, raw database error, atau detail internal ke browser.

Contoh bentuk response aktual dari login route:

```ts
return NextResponse.json(
  { success: true, data: { user: safeUser } },
  { headers: { "Cache-Control": "no-store" } },
)
```

### Otorisasi bukan hanya proxy

`proxy.ts` hanya redirect awal di Edge. API baru tetap harus memanggil server authorization:

```ts
const user = await requireCapability("globals.manage")
```

Jangan membaca role dari body request, localStorage, atau UI preview untuk mengambil keputusan keamanan.

## 6. Cara membuat hook baru

Hook wajib berawalan `use-` dan berada di domain yang sesuai, misalnya:

```text
src/hooks/globals/use-geographic.ts
```

Hook bertanggung jawab atas:

- State form/list/data hasil request.
- Loading dan error yang aman ditampilkan ke user.
- Pemanggilan endpoint internal melalui `fetch`.
- Refresh data setelah mutation berhasil.

Referensi yang aktif:

- `src/hooks/auth/use-login.ts`: form submit dan redirect UX.
- `src/hooks/auth/use-logout.ts`: mutation tanpa menyentuh cookie browser.
- `src/hooks/auth/use-session.ts`: request awal memakai `AbortController` dan menghindari synchronous state update di `useEffect`.

Hook tidak boleh menjadi sumber authorization final. UI/hook boleh menyembunyikan tombol berdasarkan capability untuk UX, tetapi API/server tetap penentu akses.

## 7. Cara membuat component UI

Component presentasional menerima data dan callback; ia tidak memanggil Prisma maupun menyimpan aturan bisnis yang sulit diuji.

Contoh pemisahan yang aktif:

```text
LoginForm
  → memakai useLogin
  → tidak mengetahui bcrypt, Prisma, atau JWT

DashboardNavGroup
  → menerima navigation yang sudah resolved
  → tidak menentukan capability sendiri

useDashboardNavigation
  → menyaring config menu dari preview role/capability UI
```

Untuk dashboard, jangan letakkan data fetch kompleks di `page.tsx` hanya karena tampilan mudah dibuat di sana. Buat component domain dan hook domain ketika data nyata mulai dihubungkan.

## 8. Checklist feature sebelum dianggap selesai

### Read feature

- [ ] Route/page ada dan tidak hanya menu config.
- [ ] Server/API memeriksa user/capability sesuai kebutuhan.
- [ ] Database service terpisah dari UI.
- [ ] Empty/loading/error state tersedia.
- [ ] Tidak membocorkan data lintas role.

### Mutation feature

- [ ] Semua checklist read terpenuhi bila relevan.
- [ ] Input tervalidasi di server.
- [ ] Capability spesifik dipakai pada API.
- [ ] Perubahan multi-tabel memakai transaction bila perlu.
- [ ] Audit activity dibuat bila aksi memiliki dampak operasional/administratif.
- [ ] Respons API tidak mengandung secret atau raw error.
- [ ] `pnpm lint`, `pnpm exec tsc --noEmit`, dan `pnpm exec prisma validate` lulus.

## 9. Status domain saat blueprint dibuat

| Domain | Engine | Database service | API | Hook/UI nyata |
|---|---:|---:|---:|---:|
| Auth lokal | Ada | Ada | Ada | Ada |
| Activity audit | Ada | Ada | Belum ada API/list UI | Dipakai auth saja |
| Directory | Belum | Belum | Belum | Belum |
| Profile/Connections | Schema siap | Belum | Belum | Belum |
| Globals | Schema siap | Belum | Belum | Belum |
| Attendance | Schema siap | Belum | Belum | Belum |
| Akademik | Schema siap | Belum | Belum | Belum |
