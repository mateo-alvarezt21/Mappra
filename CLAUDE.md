# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo structure

```
mappra/
├── apps/
│   ├── web/     — React 19 + Vite + Tailwind frontend (port 3000)
│   └── api/     — NestJS backend (port 3001)
├── packages/
│   └── types/   — Shared TypeScript types (@mappra/types)
├── package.json — npm workspaces root
└── turbo.json   — Turborepo pipeline
```

## Commands

```bash
# From root — runs both apps in parallel
npm run dev

# Individual apps
cd apps/web && npm run dev
cd apps/api && npm run dev

# Build / lint all
npm run build
npm run lint
```

## Environment setup

```bash
# apps/api — copy and fill in Supabase credentials
cp apps/api/.env.example apps/api/.env

# apps/web — only needed if using Gemini AI
cp apps/web/.env.example apps/web/.env
```

## Architecture

**Stack:** React 19, React Router 7, Vite 6, Tailwind CSS 4, Motion, Lucide React (frontend) / NestJS 10, Passport JWT, Supabase JS (backend).

**Routing (apps/web/src/App.tsx):**
```
/login  → Login
/       → MainLayout
  /             → Dashboard
  /appointments → Appointments
  /validation   → Validation
  /channels     → Channels
  /analytics    → Analytics
```

**API modules (apps/api/src/):**
- `auth` — login via Supabase Auth → returns JWT
- `appointments` — CRUD citas + cambio de estado
- `patients` — registro y búsqueda por documento
- `validation` — consulta cobertura EPS + historial
- `analytics` — KPIs, volumen diario, distribución por canal/especialidad
- `channels` — canales configurados + flujos de automatización
- `doctors` — médicos por especialidad

All modules use `AuthGuard('jwt')`. All services connect to Supabase with `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS on the server side).

**Swagger:** `http://localhost:3001/api/docs` when API is running.

**Dev proxy:** Vite proxies `/api/*` → `http://localhost:3001` so the frontend can call `/api/...` without CORS issues.

**Shared types:** `@mappra/types` (packages/types/src/index.ts) — import from here in both apps. UI-only types (e.g. `StatCardProps`) stay in `apps/web/src/types.ts`.

**Path alias:** `@/*` in `apps/web` maps to `apps/web/src/*`.

**Theme:** CSS custom properties — `--navy`, `--teal`, `--bg`, `--text`, `--text-muted`, `--text-subtle`, `--green`, `--amber`, `--red`, `--purple`. Don't hardcode hex values that duplicate these.

**Frontend state:** Still uses localStorage + local React state. Migration to real API calls is pending (Phase 4).
