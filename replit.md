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
- **Database**: MongoDB + Mongoose
- **Validation**: Zod (`zod/v4`)
- **Auth**: JWT (jsonwebtoken + bcryptjs) + Discord OAuth
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
│   └── db/                 # Mongoose models + DB connection
└── scripts/                # Utility scripts
```

## Website Pages

- `/` — Home (hero, server IP, player count, features, announcements)
- `/store` — Server store (add-to-cart flow, USD pricing, category tabs)
- `/cart` — Shopping cart with coupon code + OTP checkout verification
- `/login` — Login page (Discord OAuth button + email/password)
- `/register` — Registration page (email OTP verification + Discord OAuth)
- `/dashboard` — User dashboard (profile, order history with status badges)
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

## Default Admin Account

- Email: `admin@plutoniumsmp.net`
- Password: `admin123`
- Role: Owner (full access)

## Database

MongoDB + Mongoose. Collections: `users`, `storeitems`, `purchases`, `tickets`, `ticketmessages`, `announcements`, `coupons`, `leaderboards`, `otps`

Connection: set `MONGODB_URI` in Replit Secrets (or `artifacts/api-server/.env` for local dev).
Free Atlas cluster: https://www.mongodb.com/cloud/atlas

OTP purposes: `registration`, `login`, `checkout`

## Auth

JWT tokens stored in localStorage as `plutonium_token`. Bearer token sent in Authorization header for all protected routes. Admin routes require `admin` or `owner` role.

Discord OAuth: `/api/auth/discord` → `/api/auth/discord/callback` → redirect to `FRONTEND_URL/dashboard?token=<jwt>`

## Cart System

Cart state managed via React Context (`src/lib/cart.tsx`) with localStorage persistence. Cart items store the full StoreItem object + quantity. Checkout flow:
1. User adds items to cart on Store page
2. Goes to /cart page
3. Clicks "Verify & Checkout" → API sends OTP to user's email
4. User enters 6-digit OTP → API creates purchase records with `status: "pending"`
5. Confirmation email sent via SMTP

## API Routes

All under `/api`:
- `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/send-otp`, `/auth/verify-otp`
- `/auth/discord`, `/auth/discord/callback` (Discord OAuth)
- `/store/items`, `/store/purchase`, `/store/checkout/send-otp`, `/store/checkout`
- `/users/purchases`
- `/tickets`, `/tickets/:id`, `/tickets/:id/messages`, `/tickets/:id/close`
- `/server/status`, `/leaderboard`, `/announcements`
- `/admin/*` (admin-only routes)

## Required Environment Variables

### Database (REQUIRED):
- `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/plutonium` — MongoDB Atlas connection string

### Gmail SMTP (for OTP + confirmation emails):
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=<your-gmail>`
- `SMTP_PASS=<gmail-app-password>`
- `SMTP_FROM=<display-name@gmail.com>`

### Discord OAuth:
- `DISCORD_CLIENT_ID=<your-app-id>`
- `DISCORD_CLIENT_SECRET=<your-app-secret>`

### Deployment (Vercel / production):
- `APP_URL=https://<api-domain>` — explicit base URL for the API (used in Discord OAuth redirect URI). Takes priority over all automatic detection.
- `ALLOWED_ORIGINS=https://<frontend-domain>` — CORS allowed origins
- `VITE_API_URL=https://<api-domain>` — frontend env var pointing to the API

## Vercel Deployment

- `artifacts/api-server/vercel.json` routes all requests to Express via `api/index.ts`
- `artifacts/plutonium-smp/vercel.json` rewrites all paths to `index.html` for SPA routing
- See `DEPLOYMENT.md` in the project root for the full step-by-step guide

## Running

- Frontend: `pnpm --filter @workspace/plutonium-smp run dev`
- API: `pnpm --filter @workspace/api-server run dev`
- Both: `pnpm dev` (parallel)
- Seed DB: `pnpm --filter @workspace/scripts run seed`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
