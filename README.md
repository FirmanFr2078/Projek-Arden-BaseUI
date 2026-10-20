
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
│  │  │  └─ classes
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
│  │     ├─ menu.ts
│  │     ├─ popup.ts
│  │     ├─ role-display.ts
│  │     └─ sidebar.ts
│  ├─ contexts
│  │  └─ dashboard-preview-context.tsx
│  ├─ database
│  │  ├─ activity.service.ts
│  │  ├─ auth.service.ts
│  │  └─ class.service.ts
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
│  │  │  ├─ use-dashboard-navigation.ts
│  │  │  ├─ use-dashboard-preview.ts
│  │  │  └─ use-mobile.ts
│  │  └─ mobile
│  ├─ lib
│  │  ├─ api
│  │  │  └─ define-route.ts
│  │  ├─ data-error.ts
│  │  ├─ directory
│  │  │  ├─ audit.ts
│  │  │  └─ class-rules.ts
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
│  │  └─ user.ts
│  └─ types.d.ts
└─ tsconfig.json

```