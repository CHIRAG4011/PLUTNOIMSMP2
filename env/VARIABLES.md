# Environment Variables — Quick Reference

## How to Set Up

### Local Development

```bash
# 1. Copy environment templates
cp env/api.env.example artifacts/api-server/.env
cp env/frontend.env.example artifacts/plutonium-smp/.env

# 2. Fill in your values in both .env files, then:

# 3. Start everything with one command
pnpm dev
```

That single `pnpm dev` starts the API server and frontend in parallel.
- API:      http://localhost:3001
- Frontend: http://localhost:5173

---

### Vercel (Production)

Go to each Vercel project → **Settings → Environment Variables** and add the variables from the tables below.

---

## API Server Variables

| Variable | Local Default | Required in Production | Description |
|---|---|---|---|
| `PORT` | `3001` | No (Vercel sets it) | Port the server listens on |
| `APP_URL` | `http://localhost:3001` | **YES** | Public base URL of the API — used for Discord OAuth redirects |
| `DATABASE_URL` | *(your local DB)* | **YES** | PostgreSQL connection string |
| `SESSION_SECRET` | *(generate one)* | **YES** | Random 64-char string for signing JWT tokens |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | **YES** | Comma-separated frontend origins for CORS |
| `DISCORD_CLIENT_ID` | *(from Discord)* | If using Discord login | Discord application Client ID |
| `DISCORD_CLIENT_SECRET` | *(from Discord)* | If using Discord login | Discord application Client Secret |
| `RESEND_API_KEY` | *(optional)* | Recommended | Resend API key for transactional emails |
| `SMTP_HOST` | `smtp.gmail.com` | If no Resend key | SMTP server hostname |
| `SMTP_PORT` | `587` | If no Resend key | SMTP port |
| `SMTP_USER` | *(your email)* | If no Resend key | SMTP login username |
| `SMTP_PASS` | *(app password)* | If no Resend key | SMTP login password |
| `SMTP_FROM` | `noreply@yourdomain.com` | **YES** | Sender address on all emails |
| `LOG_LEVEL` | `info` | No | Logging verbosity: trace/debug/info/warn/error |

---

## Frontend Variables

| Variable | Local Default | Required in Production | Description |
|---|---|---|---|
| `VITE_API_URL` | *(blank — uses proxy)* | **YES** | Full URL of the API server |
| `BASE_PATH` | `/` | No | Sub-path prefix if not served from root |

---

## Minimum Required to Run Locally

**API server** (copy `env/api.env.example` → `artifacts/api-server/.env` and fill in):
- `DATABASE_URL`
- `SESSION_SECRET`
- `SMTP_FROM` + one email option (Resend or SMTP)

**Frontend**: no `.env` file needed for local dev.

---

## Minimum Required for Production (Vercel)

**API server project:**
- `APP_URL` (your API's Vercel URL)
- `DATABASE_URL`
- `SESSION_SECRET`
- `ALLOWED_ORIGINS` (your frontend's Vercel URL)
- `SMTP_FROM` + email credentials
- `DISCORD_CLIENT_ID` + `DISCORD_CLIENT_SECRET` (if using Discord login)

**Frontend project:**
- `VITE_API_URL` (your API's Vercel URL)
