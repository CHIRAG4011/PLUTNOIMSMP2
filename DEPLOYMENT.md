# Plutonium SMP — Vercel Deployment Guide

> **Zero commands.** Everything is done through web dashboards.
> The whole process takes about 15 minutes.

---

## Overview

You will deploy **two separate Vercel projects** — the API and the frontend — plus connect a **MongoDB Atlas** database.

| What | Where | URL you'll get |
|---|---|---|
| API Server | `artifacts/api-server` | `https://plutonium-api.vercel.app` |
| Frontend | `artifacts/plutonium-smp` | `https://plutonium-smp.vercel.app` |
| Database | MongoDB Atlas (free) | Connection string only |

---

## Step 1 — Push your code to GitHub

Before deploying, your code must be on GitHub (Vercel reads from it automatically).

1. Go to [github.com/new](https://github.com/new)
2. Create a new **private** repository — name it anything (e.g. `plutonium-smp`)
3. In Replit's Shell tab, run:
   - `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git`
   - `git push -u origin main`

> If you already have a GitHub repo connected, skip this step.

---

## Step 2 — Set up MongoDB Atlas (free database)

MongoDB Atlas provides a free forever tier — no credit card required.

### 2.1 Create your account & cluster

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → click **Try Free**
2. Sign up with Google or email
3. On the **Deploy your cluster** screen:
   - Choose **M0 Free** tier
   - Pick any cloud provider and region (closest to your users)
   - Name your cluster anything (e.g. `plutonium`)
   - Click **Create Deployment**

### 2.2 Create a database user

After the cluster is created, a dialog appears to create a user:

1. **Username**: `plutoniumadmin` (or anything you like)
2. **Password**: click **Autogenerate Secure Password** → copy it somewhere safe
3. Click **Create Database User**
4. Click **Choose a connection method** at the bottom

### 2.3 Allow all IP addresses

1. In the **Network Access** section that appears, click **Add IP Address**
2. Click **Allow Access from Anywhere** (adds `0.0.0.0/0`)
3. Click **Confirm**

> This is required for Vercel's serverless functions, which use dynamic IP addresses.

### 2.4 Get your connection string

1. Click **Connect** on your cluster
2. Choose **Drivers**
3. Select **Node.js** as the driver
4. Copy the connection string — it looks like:
   ```
   mongodb+srv://plutoniumadmin:<password>@cluster0.abc12.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with the password you saved in step 2.2
6. Add your database name before the `?`:
   ```
   mongodb+srv://plutoniumadmin:YOURPASSWORD@cluster0.abc12.mongodb.net/plutonium?retryWrites=true&w=majority
   ```

**Save this full string — you'll paste it into Vercel in the next steps.**

---

## Step 3 — Deploy the API Server

### 3.1 Create the Vercel project

1. Go to [vercel.com](https://vercel.com) → log in (or sign up free)
2. Click **Add New… → Project**
3. Connect your GitHub account if you haven't yet
4. Find your repository and click **Import**

### 3.2 Configure the project settings

On the configuration screen, change these settings:

| Setting | Value |
|---|---|
| **Project Name** | `plutonium-api` (or anything with "api" in the name) |
| **Root Directory** | `artifacts/api-server` ← **click Edit and type this** |
| **Framework Preset** | Other |
| **Build Command** | `pnpm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `pnpm install --frozen-lockfile` |

> **Root Directory is the most important setting.** Click the pencil/Edit icon next to it and type `artifacts/api-server` exactly.

### 3.3 Add environment variables

Scroll down to the **Environment Variables** section. Add each of these one by one:

#### Required — Must set before deploying

| Name | Value | Notes |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://...` | Your full connection string from Step 2.4 |
| `SESSION_SECRET` | (random string) | Go to [randomstring.net](https://www.random.org/strings/?num=1&len=64&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rng=new) and paste a 64-char random string |
| `APP_URL` | `https://plutonium-api.vercel.app` | Use your actual project name — this is the URL Vercel will give you |
| `ALLOWED_ORIGINS` | `https://plutonium-smp.vercel.app` | Your frontend URL (you'll create this in Step 4) |
| `NODE_ENV` | `production` | |

#### Email — Add at least one

**Option A (recommended): Resend**

| Name | Value |
|---|---|
| `RESEND_API_KEY` | Your key from [resend.com](https://resend.com) |
| `SMTP_FROM` | `Plutonium SMP <noreply@yourdomain.com>` |

**Option B: Gmail SMTP**

| Name | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your@gmail.com` |
| `SMTP_PASS` | Your Gmail App Password ([how to create one](https://support.google.com/accounts/answer/185833)) |
| `SMTP_FROM` | `Plutonium SMP <your@gmail.com>` |

#### Optional — Discord OAuth (add later if needed)

| Name | Value |
|---|---|
| `DISCORD_CLIENT_ID` | From [discord.com/developers](https://discord.com/developers/applications) |
| `DISCORD_CLIENT_SECRET` | From the same page |

### 3.4 Deploy

Click **Deploy** and wait ~2 minutes for the build to finish.

> After it deploys, copy the URL Vercel gives you (e.g. `https://plutonium-api.vercel.app`).
> Go to **Settings → Environment Variables** and make sure `APP_URL` matches this URL exactly.
> If it doesn't match, update it and click **Redeploy**.

---

## Step 4 — Deploy the Frontend

### 4.1 Create another Vercel project

1. In Vercel, click **Add New… → Project** again
2. Select the **same repository**

### 4.2 Configure the project settings

| Setting | Value |
|---|---|
| **Project Name** | `plutonium-smp` |
| **Root Directory** | `artifacts/plutonium-smp` ← **click Edit and type this** |
| **Framework Preset** | Vite |
| **Build Command** | `pnpm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `pnpm install --frozen-lockfile` |

### 4.3 Add environment variables

| Name | Value | Notes |
|---|---|---|
| `VITE_API_URL` | `https://plutonium-api.vercel.app` | Your API URL from Step 3 — no trailing slash |

### 4.4 Deploy

Click **Deploy** and wait ~1 minute.

---

## Step 5 — Seed the database with initial data

After both are deployed, seed the database so your store items, leaderboard, and admin account are created.

1. In Vercel, open your **API project** (plutonium-api)
2. Go to **Settings → Environment Variables**
3. Confirm `MONGODB_URI` is set correctly
4. Go to the **Functions** tab → you should see your API routes listed

To run the seed, call this URL in your browser once:

```
https://YOUR-API-URL.vercel.app/api/health
```

> The seed script creates the default admin account automatically on first startup:
> - Email: `admin@plutoniumsmp.net`
> - Password: `admin123`
> **Change the password immediately after first login.**

Actually, to seed: in Replit's shell, run `MONGODB_URI="your-atlas-uri" pnpm --filter @workspace/scripts run seed` once.

---

## Step 6 — Verify everything works

Visit your frontend URL and check each feature:

- [ ] Home page loads (server status, announcements)
- [ ] Register a new account (you'll receive a verification email)
- [ ] Login works
- [ ] Store page shows items
- [ ] Admin panel works at `/admin/dashboard` (login with `admin@plutoniumsmp.net`)

---

## Step 7 — Discord OAuth (optional)

Only needed if you want the "Login with Discord" button to work.

### 7.1 Create a Discord application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → name it `Plutonium SMP` → Create
3. In the left sidebar, click **OAuth2**

### 7.2 Add redirect URIs

Under **Redirects**, click **Add Redirect** and add:

```
https://YOUR-API-URL.vercel.app/api/auth/discord/callback
```

Click **Save Changes**.

### 7.3 Copy credentials

- **Client ID** — visible at the top of the OAuth2 page
- **Client Secret** — click **Reset Secret**, confirm, copy it

### 7.4 Add to Vercel

In your API Vercel project → **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `DISCORD_CLIENT_ID` | (paste Client ID) |
| `DISCORD_CLIENT_SECRET` | (paste Client Secret) |

Then click **Redeploy** → **Redeploy** (without clearing build cache) on the API project.

---

## Custom Domain (optional)

To use `api.plutoniumsmp.net` and `plutoniumsmp.net`:

1. In each Vercel project → **Settings → Domains** → **Add Domain**
2. Enter your domain and follow Vercel's DNS instructions
3. After domains are live, update these variables:
   - API project: `APP_URL` = `https://api.plutoniumsmp.net`
   - Frontend project: `VITE_API_URL` = `https://api.plutoniumsmp.net`
   - API project: `ALLOWED_ORIGINS` = `https://plutoniumsmp.net`
   - Discord portal: update the redirect URI to the new API domain
4. Redeploy both projects

---

## Environment Variables — Full Reference

### API Server (plutonium-api project)

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string |
| `SESSION_SECRET` | **Yes** | 64-character random string for JWT signing |
| `APP_URL` | **Yes** | Public URL of this API (no trailing slash) |
| `ALLOWED_ORIGINS` | **Yes** | Frontend URL for CORS |
| `NODE_ENV` | **Yes** | Set to `production` |
| `DISCORD_CLIENT_ID` | Optional | Discord app Client ID |
| `DISCORD_CLIENT_SECRET` | Optional | Discord app Client Secret |
| `RESEND_API_KEY` | Email | Resend API key (preferred) |
| `SMTP_HOST` | Email | SMTP server (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | Email | Usually `587` |
| `SMTP_USER` | Email | SMTP username / email |
| `SMTP_PASS` | Email | SMTP password or app password |
| `SMTP_FROM` | Email | Sender name + address |
| `LOG_LEVEL` | No | `info` (default), `debug`, `warn`, `error` |

### Frontend (plutonium-smp project)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **Yes** | Full URL of the API server |

---

## Troubleshooting

### API fails to start — "MONGODB_URI is not set"
Go to your API Vercel project → **Settings → Environment Variables** → confirm `MONGODB_URI` is set and has no typos. Redeploy.

### "redirect_uri_mismatch" on Discord login
The redirect URI in the Discord developer portal doesn't match. Check that:
- `APP_URL` in Vercel equals your exact API URL (no trailing slash, correct `https`)
- The Discord portal has exactly `APP_URL + /api/auth/discord/callback`

### Frontend shows "Network Error" or API calls fail
- Check `VITE_API_URL` is set on the frontend project and points to the API
- Check `ALLOWED_ORIGINS` on the API includes the frontend URL
- Both changes require a redeploy

### Blank page on the frontend
Vercel needs to serve `index.html` for all routes (SPA routing). The `vercel.json` inside `artifacts/plutonium-smp` handles this automatically — make sure you didn't delete it.

### "Invalid token" — users get logged out after every deploy
`SESSION_SECRET` changed. Set it to a fixed value in Vercel environment variables and never change it.

### Store / leaderboard is empty after deploying
The database is empty on a fresh MongoDB cluster. Run the seed script once from Replit's shell:
```
MONGODB_URI="your-atlas-uri" pnpm --filter @workspace/scripts run seed
```
