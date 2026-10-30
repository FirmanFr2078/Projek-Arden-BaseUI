
```
arden-v.4
├─ AGENTS.md
├─ CLAUDE.md
├─ components.json
├─ docs
│  └─ ai-blueprint
│     ├─ 00-START-HERE.md
│     ├─ 01-ARCHITECTURE-AND-FEATURE-FLOW.md
│     ├─ 02-SECURITY-ACTIVITY-AND-DATA.md
│     └─ 03-CONFIGURATION-UI-AND-DECISIONS.md
├─ eslint.config.mjs
├─ next.config.ts
├─ package.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ postcss.config.mjs
├─ prisma
│  ├─ migrations
│  │  ├─ 20260913072921_add_user_session_version
│  │  │  └─ migration.sql
│  │  ├─ 20261020021307_directory_class_identity
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
│  ├─ prisma-minimal-connection-string.ts
│  ├─ prisma-minimal.ts
│  ├─ schema.prisma
│  ├─ seed.ts
│  ├─ seeders
│  │  └─ user-seeder.ts
│  └─ test-prisma.ts
├─ prisma.config.ts
├─ public
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ icon.ico
│  ├─ lottie
│  │  └─ cloud.lottie
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
├─ src
│  ├─ app
│  │  ├─ (auth)
│  │  │  ├─ layout.tsx
│  │  │  └─ login
│  │  │     └─ page.tsx
│  │  ├─ (dekstop)
│  │  │  ├─ dashboard
│  │  │  │  ├─ directory
│  │  │  │  │  ├─ classes
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  └─ students
│  │  │  │  │     └─ page.tsx
│  │  │  │  ├─ loading.tsx
│  │  │  │  └─ page.tsx
│  │  │  └─ layout.tsx
│  │  ├─ api
│  │  │  ├─ auth
│  │  │  │  ├─ login
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ logout
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ session
│  │  │  │     └─ route.ts
│  │  │  ├─ classes
│  │  │  │  ├─ route.ts
│  │  │  │  └─ [id]
│  │  │  │     └─ route.ts
│  │  │  └─ students
│  │  │     ├─ export
│  │  │     │  └─ route.ts
│  │  │     ├─ import
│  │  │     │  └─ route.ts
│  │  │     ├─ route.ts
│  │  │     └─ [id]
│  │  │        └─ route.ts
│  │  ├─ docs
│  │  │  └─ page.tsx
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ team
│  │     └─ page.tsx
│  ├─ components
│  │  ├─ auth
│  │  │  ├─ connections-button.tsx
│  │  │  └─ login-form.tsx
│  │  ├─ dashboard
│  │  │  ├─ app-sidebar.tsx
│  │  │  ├─ dashboard-shell.tsx
│  │  │  ├─ directory
│  │  │  │  ├─ classes
│  │  │  │  │  └─ classes-view.tsx
│  │  │  │  ├─ record-delete-dialog.tsx
│  │  │  │  ├─ record-form-dialog.tsx
│  │  │  │  ├─ record-table.tsx
│  │  │  │  └─ students
│  │  │  │     ├─ student-import-dialog.tsx
│  │  │  │     └─ students-view.tsx
│  │  │  ├─ header.tsx
│  │  │  ├─ nav-group.tsx
│  │  │  ├─ nav-role.tsx
│  │  │  ├─ nav-user.tsx
│  │  │  └─ user-avatar.tsx
│  │  ├─ keyboard-focus-mode.tsx
│  │  ├─ landing
│  │  │  ├─ footer.tsx
│  │  │  ├─ header.tsx
│  │  │  ├─ home
│  │  │  │  ├─ features.tsx
│  │  │  │  ├─ hero.tsx
│  │  │  │  ├─ tech-stack.tsx
│  │  │  │  ├─ vision.tsx
│  │  │  │  └─ workflow.tsx
│  │  │  └─ vanta.tsx
│  │  ├─ logo.tsx
│  │  └─ ui
│  │     ├─ alert-dialog.tsx
│  │     ├─ avatar.tsx
│  │     ├─ badge.tsx
│  │     ├─ breadcrumb.tsx
│  │     ├─ button.tsx
│  │     ├─ collapsible.tsx
│  │     ├─ dialog.tsx
│  │     ├─ dropdown-menu.tsx
│  │     ├─ input.tsx
│  │     ├─ label.tsx
│  │     ├─ progress.tsx
│  │     ├─ scroll-area.tsx
│  │     ├─ select.tsx
│  │     ├─ separator.tsx
│  │     ├─ sheet.tsx
│  │     ├─ sidebar.tsx
│  │     ├─ skeleton.tsx
│  │     ├─ sonner.tsx
│  │     ├─ table.tsx
│  │     ├─ tabs.tsx
│  │     └─ tooltip.tsx
│  ├─ config
│  │  └─ dashboard
│  │     ├─ directory
│  │     │  ├─ class-fields.ts
│  │     │  └─ student-fields.ts
│  │     ├─ menu.ts
│  │     ├─ popup.ts
│  │     ├─ role-display.ts
│  │     └─ sidebar.ts
│  ├─ contexts
│  │  └─ dashboard-preview-context.tsx
│  ├─ database
│  │  ├─ activity.service.ts
│  │  ├─ auth.service.ts
│  │  ├─ class.service.ts
│  │  ├─ student-transfer.service.ts
│  │  └─ student.service.ts
│  ├─ engine
│  │  ├─ access-engine.ts
│  │  ├─ activity-engine.ts
│  │  ├─ auth-engine.ts
│  │  ├─ auth-session-engine.ts
│  │  └─ authorization-engine.ts
│  ├─ hooks
│  │  ├─ auth
│  │  │  ├─ use-login.ts
│  │  │  ├─ use-logout.ts
│  │  │  └─ use-session.ts
│  │  ├─ desktop
│  │  │  ├─ directory
│  │  │  │  ├─ classes
│  │  │  │  │  └─ use-classes-page.ts
│  │  │  │  ├─ records
│  │  │  │  │  ├─ use-record-collection.ts
│  │  │  │  │  ├─ use-record-dialog.ts
│  │  │  │  │  ├─ use-record-mutation.ts
│  │  │  │  │  └─ use-record-table.ts
│  │  │  │  └─ students
│  │  │  │     ├─ use-student-export.ts
│  │  │  │     ├─ use-student-import.ts
│  │  │  │     └─ use-students-page.ts
│  │  │  ├─ use-dashboard-navigation.ts
│  │  │  ├─ use-dashboard-preview.ts
│  │  │  ├─ use-mobile.ts
│  │  │  └─ use-session-expiry.ts
│  │  └─ mobile
│  ├─ lib
│  │  ├─ api
│  │  │  ├─ client.ts
│  │  │  └─ define-route.ts
│  │  ├─ data-error.ts
│  │  ├─ directory
│  │  │  ├─ audit.ts
│  │  │  ├─ class-format.ts
│  │  │  ├─ class-rules.ts
│  │  │  ├─ form.ts
│  │  │  ├─ student-export.ts
│  │  │  ├─ student-format.ts
│  │  │  ├─ student-import-rules.ts
│  │  │  └─ student-rules.ts
│  │  ├─ download.ts
│  │  ├─ ids.ts
│  │  ├─ import
│  │  │  ├─ import-columns.ts
│  │  │  ├─ parse-sheet.ts
│  │  │  ├─ parse-sql.ts
│  │  │  └─ student-template.ts
│  │  ├─ page-guard.ts
│  │  ├─ prisma.ts
│  │  ├─ record-id.ts
│  │  ├─ storage.ts
│  │  ├─ text.ts
│  │  └─ utils.ts
│  ├─ proxy.ts
│  ├─ types
│  │  ├─ access.ts
│  │  ├─ activity.ts
│  │  ├─ api.ts
│  │  ├─ auth.ts
│  │  ├─ class.ts
│  │  ├─ dashboard.ts
│  │  ├─ form.ts
│  │  ├─ student.ts
│  │  ├─ table.ts
│  │  └─ user.ts
│  └─ types.d.ts
└─ tsconfig.json

```