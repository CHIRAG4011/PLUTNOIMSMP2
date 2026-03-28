# Plutonium SMP Website

## Overview

Full-stack Minecraft Lifesteal server website for "Plutonium SMP". Dark + neon green gaming aesthetic.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/plutonium-smp)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **UI**: Tailwind CSS, Framer Motion, Recharts, React Hook Form

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── plutonium-smp/      # React + Vite frontend (main site)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
└── scripts/                # Utility scripts
```

## Website Pages

- `/` — Home (hero, server IP, player count, features, announcements)
- `/store` — Server store (ranks, crate keys, coins) with category tabs
- `/login` — Login page (email + password)
- `/register` — Registration page
- `/dashboard` — User dashboard (profile, purchases, tickets)
- `/tickets` — Ticket system (create, view tickets)
- `/tickets/:id` — Individual ticket chat view
- `/leaderboard` — Player leaderboard
- `/admin/dashboard` — Admin stats overview
- `/admin/users` — User management (ban/unban)
- `/admin/store` — Store item management (CRUD)
- `/admin/tickets` — All tickets management
- `/admin/purchases` — Purchase logs
- `/admin/announcements` — Announcement management
- `/admin/coupons` — Coupon/discount management
- `/admin/currency` — OWO currency adjustment

## Default Admin Account

- Email: `admin@plutoniumsmp.net`
- Password: `admin123`
- Role: Owner (full access)

## Database Schema

Tables: `users`, `store_items`, `purchases`, `tickets`, `ticket_messages`, `announcements`, `coupons`, `leaderboard`

## Auth

JWT tokens stored in localStorage as `plutonium_token`. Bearer token sent in Authorization header for all protected routes. Admin routes require `admin` or `owner` role.

## API Routes

All under `/api`:
- `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`
- `/store/items`, `/store/purchase`
- `/users/purchases`
- `/tickets`, `/tickets/:id`, `/tickets/:id/messages`, `/tickets/:id/close`
- `/server/status`, `/leaderboard`, `/announcements`
- `/admin/*` (admin-only routes)

## Running

- Frontend: `pnpm --filter @workspace/plutonium-smp run dev`
- API: `pnpm --filter @workspace/api-server run dev`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
- DB push: `pnpm --filter @workspace/db run push`
