# Plutonium SMP — Deployment Guide

This guide covers everything you need to run the project locally and deploy it to Vercel.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Prerequisites](#2-prerequisites)
3. [Local Development Setup](#3-local-development-setup)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Discord OAuth Setup](#5-discord-oauth-setup)
6. [Vercel Deployment](#6-vercel-deployment)
7. [Database Setup](#7-database-setup)
8. [Email Setup](#8-email-setup)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Project Overview

The project is split into two deployable services:

| Service | Directory | Purpose |
|---|---|---|
| **Frontend** | `artifacts/plutonium-smp` | React + Vite web app |
| **API Server** | `artifacts/api-server` | Express REST API |

They are deployed **separately** — the frontend talks to the API via the `VITE_API_URL` environment variable.

---

## 2. Prerequisites

- **Node.js** 20 or later
- **pnpm** 9 or later (`npm install -g pnpm`)
- **PostgreSQL** database (local or hosted — see [Database Setup](#7-database-setup))

---

## 3. Local Development Setup

### 3.1 Install dependencies

```bash
pnpm install
```

### 3.2 Configure the API server

```bash
cp artifacts/api-server/.env.example artifacts/api-server/.env
```

Open `artifacts/api-server/.env` and fill in the required values (at minimum `DATABASE_URL` and `SESSION_SECRET`).

### 3.3 Configure the frontend

```bash
cp artifacts/plutonium-smp/.env.example artifacts/plutonium-smp/.env
```

For local development, you can leave `VITE_API_URL` blank — Vite's dev server automatically proxies `/api` requests to `localhost:3001`.

### 3.4 Run database migrations

```bash
pnpm --filter @workspace/db run migrate
```

### 3.5 Start both servers

```bash
pnpm dev
```

That's it. One command starts the API server and frontend in parallel.

- API server → http://localhost:3001
- Frontend   → http://localhost:5173

Open `http://localhost:5173` in your browser.

---

## 4. Environment Variables Reference

### API Server (`artifacts/api-server/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Port the API listens on. Default: `3001` |
| `APP_URL` | **Yes (production)** | Public base URL of the API server, e.g. `https://your-api.vercel.app`. Used for Discord OAuth redirect URI. |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `SESSION_SECRET` | **Yes** | Long random string for signing JWT tokens. Generate: `openssl rand -hex 64` |
| `ALLOWED_ORIGINS` | **Yes (production)** | Comma-separated list of allowed frontend origins, e.g. `https://your-frontend.vercel.app` |
| `DISCORD_CLIENT_ID` | OAuth only | Discord application Client ID |
| `DISCORD_CLIENT_SECRET` | OAuth only | Discord application Client Secret |
| `RESEND_API_KEY` | Email | API key from [Resend](https://resend.com) (preferred) |
| `SMTP_HOST` | Email | SMTP server host (fallback when Resend is not set) |
| `SMTP_PORT` | Email | SMTP port (usually `587`) |
| `SMTP_USER` | Email | SMTP username |
| `SMTP_PASS` | Email | SMTP password |
| `SMTP_FROM` | **Yes** | Sender address, e.g. `noreply@yourdomain.com` |
| `LOG_LEVEL` | No | Logging level: `trace`, `debug`, `info`, `warn`, `error`. Default: `info` |

### Frontend (`artifacts/plutonium-smp/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **Yes (production)** | Full URL of the API server, e.g. `https://your-api.vercel.app`. Leave blank in local dev. |
| `BASE_PATH` | No | Sub-path if not deployed at root. Default: `/` |

---

## 5. Discord OAuth Setup

### 5.1 Create a Discord Application

1. Go to [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** and give it a name (e.g. `Plutonium SMP`)
3. Open the **OAuth2** section in the left sidebar

### 5.2 Add Redirect URIs

Add the following redirect URIs based on your environment:

| Environment | Redirect URI |
|---|---|
| Local | `http://localhost:3001/api/auth/discord/callback` |
| Vercel (API) | `https://your-api.vercel.app/api/auth/discord/callback` |

> **Important:** The redirect URI must match exactly. Discord is strict about trailing slashes and `http` vs `https`.

### 5.3 Copy credentials

From the **OAuth2 → General** page, copy:
- **Client ID** → `DISCORD_CLIENT_ID`
- **Client Secret** (click "Reset Secret") → `DISCORD_CLIENT_SECRET`

Set these in your `.env` file (local) or in the Vercel dashboard (production).

### 5.4 How it works

The OAuth flow:
1. User clicks "Login with Discord" on the frontend
2. Frontend redirects to `GET /api/auth/discord`
3. API redirects user to Discord's authorization page
4. Discord redirects back to `GET /api/auth/discord/callback` with a `code`
5. API exchanges the code for an access token, fetches the user's Discord profile
6. If a matching account exists (by Discord ID or email) it is linked and logged in; otherwise a new account is created
7. User is redirected to `/dashboard?token=<jwt>`

---

## 6. Vercel Deployment

Deploy the API and frontend as two separate Vercel projects.

### 6.1 Deploy the API Server

1. Push your code to GitHub (or connect directly to Vercel)
2. In the Vercel dashboard, click **Add New → Project**
3. Select your repository
4. Set **Root Directory** to `artifacts/api-server`
5. Set the **Build Command** to:
   ```
   pnpm run build
   ```
6. Set the **Output Directory** to `dist` (Vercel will auto-detect for Node)
7. Add all required environment variables (see table above):
   - `APP_URL` = `https://your-api.vercel.app` (use the URL Vercel assigns)
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `ALLOWED_ORIGINS` = your frontend Vercel URL
   - `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`
   - `SMTP_FROM` and email credentials
8. Click **Deploy**

> After the first deploy, copy the assigned URL and set it as `APP_URL` in Vercel, then redeploy.

### 6.2 Deploy the Frontend

1. In the Vercel dashboard, click **Add New → Project** again
2. Select the same repository
3. Set **Root Directory** to `artifacts/plutonium-smp`
4. Set the **Build Command** to:
   ```
   pnpm run build
   ```
5. Set the **Output Directory** to `dist/public`
6. Add environment variables:
   - `VITE_API_URL` = `https://your-api.vercel.app` (the API URL from step 6.1)
7. Click **Deploy**

### 6.3 Update CORS and Discord after both are deployed

Once both are live:
- Set `ALLOWED_ORIGINS` on the API to the frontend's Vercel URL
- Add the production callback URI to Discord's OAuth2 redirect URIs
- Redeploy the API to pick up the changes

### 6.4 Custom Domain (optional)

In the Vercel project → **Settings → Domains**, add your custom domain. Update:
- `APP_URL` on the API project to the custom API domain
- `VITE_API_URL` on the frontend project to the custom API domain
- Discord redirect URI to use the custom API domain

---

## 7. Database Setup

The project uses **PostgreSQL** via Drizzle ORM. You need a hosted Postgres instance for production.

### Recommended providers

| Provider | Free tier | Notes |
|---|---|---|
| [Neon](https://neon.tech) | Yes | Serverless Postgres, great for Vercel |
| [Supabase](https://supabase.com) | Yes | Includes a full backend platform |
| [Railway](https://railway.app) | Yes (limited) | Easy to set up |

### Run migrations

```bash
# Local
pnpm --filter @workspace/db run migrate

# Against a remote DB (set DATABASE_URL first)
DATABASE_URL=postgresql://... pnpm --filter @workspace/db run migrate
```

---

## 8. Email Setup

The API sends transactional emails (OTP codes, welcome messages). Configure one of:

### Option A — Resend (recommended)

1. Create an account at [https://resend.com](https://resend.com)
2. Verify your sending domain
3. Create an API key
4. Set `RESEND_API_KEY` and `SMTP_FROM` in your environment

### Option B — SMTP

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`.

> If neither is configured, OTP emails will fail silently in development.

---

## 9. Troubleshooting

### "Discord OAuth not configured"
`DISCORD_CLIENT_ID` is missing or empty. Set it in your `.env` file or Vercel environment variables.

### "redirect_uri_mismatch" from Discord
The redirect URI registered in the Discord developer portal does not exactly match the one the server is sending. Check that:
- `APP_URL` is set correctly (no trailing slash)
- The URI in Discord's portal matches `<APP_URL>/api/auth/discord/callback`

### API returns CORS errors in production
`ALLOWED_ORIGINS` on the API server does not include your frontend URL. Update it and redeploy.

### Frontend shows a blank page on Vercel
Vercel needs to serve `index.html` for all routes (SPA routing). The `vercel.json` in `artifacts/plutonium-smp` handles this automatically.

### "Invalid token" / users get logged out on redeploy
`SESSION_SECRET` changed between deployments. Use a fixed, long random string and never rotate it unless you intentionally want all sessions to expire.
