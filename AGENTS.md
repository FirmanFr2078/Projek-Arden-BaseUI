<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Aturan kerja AI untuk ARDEN V.4

Sebelum mengerjakan feature atau perbaikan, baca:

1. `docs/ai-blueprint/00-START-HERE.md`
2. Dokumen lanjutan yang sesuai tugas:
   - arsitektur/alur feature: `01-ARCHITECTURE-AND-FEATURE-FLOW.md`
   - auth, access, activity, dan data: `02-SECURITY-ACTIVITY-AND-DATA.md`
   - konfigurasi, Base UI, dan keputusan transisi: `03-CONFIGURATION-UI-AND-DECISIONS.md`

Aturan inti:

- Ikuti pola `types → engine → database → API → hooks → components` sesuai kebutuhan feature; jangan mencampur business logic ke component UI presentasional.
- Jangan menganggap schema Prisma, menu, capability, atau placeholder sebagai feature operasional yang sudah selesai.
- API/server tetap wajib memeriksa `requireUser()` atau `requireCapability()`; UI preview dan hook bukan security boundary.
- Untuk perubahan data yang bernilai audit, pertimbangkan `ActivityService` dan format event yang ada.
- Gunakan primitive Base UI yang ada di `src/components/ui/`; jangan mengasumsikan API Radix seperti `asChild`, state attribute Radix, atau lifecycle callback Radix.
- Jangan pernah mengekspos secret, token, password, connection string, atau service-role key.
- Jika perubahan arsitektur mengubah pola/keputusan di blueprint, perbarui dokumen blueprint terkait dalam pekerjaan yang sama.
