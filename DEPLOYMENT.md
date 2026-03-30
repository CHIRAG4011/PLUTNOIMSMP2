# Plutonium SMP — Vercel Deployment Guide

> **No terminal commands needed.** Everything is done through browser dashboards.
> Estimated time: 15–20 minutes.

---

## Quick Reference — Exact Vercel Settings

Use these exact values when configuring each Vercel project. **Do not guess — these must match exactly.**

### Project 1: API Server

| Setting | Value |
|---|---|
| **Root Directory** | `artifacts/api-server` |
| **Framework Preset** | **Other** |
| **Build Command** | *(leave blank — auto-handled)* |
| **Output Directory** | *(leave blank — auto-handled)* |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |

### Project 2: Frontend

| Setting | Value |
|---|---|
| **Root Directory** | `artifacts/plutonium-smp` |
| **Framework Preset** | **Vite** |
| **Build Command** | `pnpm run build` |
| **Output Directory** | `dist/public` |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |

---

## Deployment Checklist

- [ ] Code is pushed to GitHub
- [ ] MongoDB Atlas cluster created and connection string copied
- [ ] API project deployed on Vercel
- [ ] Frontend project deployed on Vercel
- [ ] `APP_URL` on API matches the actual deployed API URL
- [ ] `VITE_API_URL` on frontend points to the API URL
- [ ] `ALLOWED_ORIGINS` on API includes the frontend URL
- [ ] Database seeded (admin account + store items created)

---

## Step 1 — Push your code to GitHub

Vercel deploys directly from GitHub. Your code must be there first.

1. Go to [github.com/new](https://github.com/new)
2. Create a **private** repository (name it e.g. `plutonium-smp`)
3. In **Replit's Shell** tab, run these two commands:
   ```
   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
   git push -u origin main
   ```

> If you already have a connected GitHub repo, skip this step.

---

## Step 2 — Set up MongoDB Atlas (free database)

MongoDB Atlas has a **free forever tier** — no credit card required.

### 2.1 — Create an account and cluster

1. Open [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → click **Try Free**
2. Sign up with Google or create an account
3. On the **Deploy your cluster** screen that appears:
   - Select **M0** (the free tier)
   - Pick any cloud provider + region
   - Name the cluster anything (e.g. `plutonium`)
   - Click **Create Deployment**

### 2.2 — Create a database user

A popup appears asking you to create a user for this cluster:

1. Set **Username** to something like `plutoniumadmin`
2. Click **Autogenerate Secure Password** — copy and save this password now
3. Click **Create Database User**
4. Click **Choose a connection method** at the bottom right

### 2.3 — Allow all IP addresses

Vercel uses dynamic IPs, so you must allow connections from anywhere:

1. Click **Network Access** in the left sidebar (or it may appear as a step)
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** → this fills in `0.0.0.0/0`
4. Click **Confirm**

### 2.4 — Get your connection string

1. Click **Connect** on your cluster card
2. Choose **Drivers**
3. Select **Node.js** as the driver (version 5.5+)
4. Copy the string shown — it looks like this:
   ```
   mongodb+srv://plutoniumadmin:<password>@cluster0.abc12.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with the password you saved in step 2.2
6. Add the database name `plutonium` before the `?`:
   ```
   mongodb+srv://plutoniumadmin:YOURPASSWORD@cluster0.abc12.mongodb.net/plutonium?retryWrites=true&w=majority
   ```

**Keep this full string ready — you will paste it into Vercel in the next step.**

---

## Step 3 — Deploy the API Server

### 3.1 — Create a new Vercel project

1. Go to [vercel.com](https://vercel.com) → sign up or log in (free)
2. Click **Add New… → Project**
3. Connect your GitHub account when prompted
4. Find your repository in the list → click **Import**

### 3.2 — Configure the project

You will see a configuration screen. Fill it in **exactly** as follows:

| Field | What to type |
|---|---|
| **Project Name** | `plutonium-api` |
| **Root Directory** | Click the **Edit** pencil → type `artifacts/api-server` → click **Continue** |
| **Framework Preset** | Select **Other** from the dropdown |
| **Build Command** | Leave blank (the `vercel.json` handles the build automatically) |
| **Output Directory** | Leave blank |
| **Install Command** | Override to: `cd ../.. && pnpm install --frozen-lockfile` |

> **Root Directory is critical.** Without it, Vercel deploys the wrong folder.

### 3.3 — Add environment variables

Expand the **Environment Variables** section and add these one by one:

#### Database + Auth (required before first deploy)

| Variable Name | Value |
|---|---|
| `MONGODB_URI` | Your full Atlas connection string from Step 2.4 |
| `SESSION_SECRET` | A random 64-character string — generate one at [generate.plus/string](https://generate.plus/en/random-string) |
| `NODE_ENV` | `production` |
| `APP_URL` | `https://plutonium-api.vercel.app` — use your actual project name here |
| `ALLOWED_ORIGINS` | `https://plutonium-smp.vercel.app` — your frontend URL (you'll create it in Step 4) |

> Note: You can update `APP_URL` and `ALLOWED_ORIGINS` after deploying once you know the real URLs.

#### Email — choose one option

**Resend (recommended — free tier, easy setup)**

Sign up at [resend.com](https://resend.com), create an API key, then add:

| Variable Name | Value |
|---|---|
| `RESEND_API_KEY` | Your API key from Resend |
| `SMTP_FROM` | `Plutonium SMP <noreply@yourdomain.com>` |

**Gmail SMTP (if you don't want to use Resend)**

First create a Gmail App Password: Google Account → Security → 2-Step Verification → App passwords

| Variable Name | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your@gmail.com` |
| `SMTP_PASS` | Your Gmail App Password (16 characters, no spaces) |
| `SMTP_FROM` | `Plutonium SMP <your@gmail.com>` |

#### Discord OAuth (optional — add later if you want Discord login)

| Variable Name | Value |
|---|---|
| `DISCORD_CLIENT_ID` | From [discord.com/developers/applications](https://discord.com/developers/applications) |
| `DISCORD_CLIENT_SECRET` | From the same page |

### 3.4 — Deploy

Click **Deploy**. The build takes 1–3 minutes.

When it finishes, Vercel shows you a URL like `https://plutonium-api.vercel.app`.

**Copy this URL.** If it doesn't match what you typed for `APP_URL`:
1. Go to **Settings → Environment Variables**
2. Update `APP_URL` to the exact URL Vercel gave you
3. Click **Redeploy → Redeploy** (no need to clear build cache)

---

## Step 4 — Deploy the Frontend

### 4.1 — Create another Vercel project

1. In Vercel, click **Add New… → Project**
2. Select the **same GitHub repository**

### 4.2 — Configure the project

| Field | What to type |
|---|---|
| **Project Name** | `plutonium-smp` |
| **Root Directory** | Click **Edit** → type `artifacts/plutonium-smp` → click **Continue** |
| **Framework Preset** | **Vite** |
| **Build Command** | `pnpm run build` |
| **Output Directory** | `dist/public` |
| **Install Command** | Override to: `cd ../.. && pnpm install --frozen-lockfile` |

### 4.3 — Add environment variables

| Variable Name | Value |
|---|---|
| `VITE_API_URL` | `https://plutonium-api.vercel.app` — your API URL from Step 3 (no trailing slash) |

### 4.4 — Deploy

Click **Deploy**. The frontend build takes about 1 minute.

---

## Step 5 — Link the two projects together

After both are deployed, make sure they point to each other correctly.

### On the API project (plutonium-api)

Go to **Settings → Environment Variables** and verify:

| Variable | Should be |
|---|---|
| `APP_URL` | The exact URL of your API (e.g. `https://plutonium-api.vercel.app`) |
| `ALLOWED_ORIGINS` | The exact URL of your frontend (e.g. `https://plutonium-smp.vercel.app`) |

If you changed either, click **Redeploy** on the API project.

### On the Frontend project (plutonium-smp)

| Variable | Should be |
|---|---|
| `VITE_API_URL` | The exact URL of your API |

---

## Step 6 — Seed the database

The database is empty on first deploy. Seeding creates:
- Your admin account (`admin@plutoniumsmp.net` / `admin123`)
- Default store items (ranks, crates, coins)
- Leaderboard entries and announcements

In **Replit's Shell** tab, run:
```
MONGODB_URI="paste-your-atlas-uri-here" pnpm --filter @workspace/scripts run seed
```

Replace the URI with your full Atlas connection string from Step 2.4.

**After seeding, log in at `/login` with `admin@plutoniumsmp.net` / `admin123` and change the password immediately.**

---

## Step 7 — Set up Discord OAuth (optional)

Only needed if you want the "Login with Discord" button to work.

### 7.1 — Create a Discord application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → name it `Plutonium SMP` → click **Create**
3. In the left sidebar, click **OAuth2**

### 7.2 — Add the redirect URI

Under **Redirects**, click **Add Redirect** and enter:

```
https://plutonium-api.vercel.app/api/auth/discord/callback
```

(Replace with your actual API URL if different)

Click **Save Changes**.

### 7.3 — Copy your credentials

On the same OAuth2 page:
- **Client ID** — visible near the top, click the copy icon
- **Client Secret** — click **Reset Secret** → confirm → copy it

### 7.4 — Add to Vercel

In your API Vercel project → **Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `DISCORD_CLIENT_ID` | Paste your Client ID |
| `DISCORD_CLIENT_SECRET` | Paste your Client Secret |

Then: **Deployments → three-dot menu on latest deployment → Redeploy**

---

## Step 8 — Custom Domain (optional)

To use `api.plutoniumsmp.net` and `plutoniumsmp.net`:

1. In each Vercel project → **Settings → Domains** → **Add Domain**
2. Enter your domain and follow Vercel's DNS instructions (it tells you exactly which DNS records to add)
3. After the domain is active, update variables:

**On the API project:**

| Variable | New Value |
|---|---|
| `APP_URL` | `https://api.plutoniumsmp.net` |
| `ALLOWED_ORIGINS` | `https://plutoniumsmp.net` |

**On the Frontend project:**

| Variable | New Value |
|---|---|
| `VITE_API_URL` | `https://api.plutoniumsmp.net` |

**On Discord portal:** Update the redirect URI to `https://api.plutoniumsmp.net/api/auth/discord/callback`

Redeploy both projects after updating variables.

---

## All Environment Variables — Full Reference

### API Server (plutonium-api project)

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string |
| `SESSION_SECRET` | **Yes** | 64-char random string — never change after going live |
| `APP_URL` | **Yes** | Public URL of this API, no trailing slash |
| `ALLOWED_ORIGINS` | **Yes** | Frontend URL for CORS |
| `NODE_ENV` | **Yes** | `production` |
| `DISCORD_CLIENT_ID` | Optional | Discord app Client ID |
| `DISCORD_CLIENT_SECRET` | Optional | Discord app Client Secret |
| `RESEND_API_KEY` | Email | Resend API key (preferred email method) |
| `SMTP_HOST` | Email | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | Email | `587` |
| `SMTP_USER` | Email | Your email address |
| `SMTP_PASS` | Email | App password |
| `SMTP_FROM` | Email | Sender display name and address |
| `LOG_LEVEL` | No | `info` (default). Options: `trace` `debug` `info` `warn` `error` |

### Frontend (plutonium-smp project)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **Yes** | Full URL of the API server, no trailing slash |

---

## Troubleshooting

### "MONGODB_URI is not set" — API crashes on startup
Go to the API Vercel project → **Settings → Environment Variables** → confirm `MONGODB_URI` is set. Check for copy-paste errors (no extra spaces, password replaced correctly). Redeploy.

### API works but returns errors for every request
Check Vercel's **Functions** tab for logs. Usually this means `MONGODB_URI` is wrong or the Atlas cluster's Network Access is blocking the IP. Make sure `0.0.0.0/0` is in your Atlas Network Access list.

### Frontend shows "Network Error" / requests fail
- `VITE_API_URL` on the frontend does not point to your API URL — fix and redeploy
- `ALLOWED_ORIGINS` on the API does not include your frontend URL — fix and redeploy

### "redirect_uri_mismatch" on Discord login
The redirect URI in the Discord portal doesn't match exactly. Verify:
- `APP_URL` has no trailing slash
- Discord portal has exactly: `[APP_URL]/api/auth/discord/callback`

### Blank white page on the frontend
The SPA routing isn't set up. The `vercel.json` inside `artifacts/plutonium-smp` handles this automatically — make sure you set Root Directory to `artifacts/plutonium-smp` and not the repo root.

### Users get logged out every time you redeploy
`SESSION_SECRET` changed. Set it to a fixed, long random value and never rotate it unless you want to invalidate all sessions.

### Store / leaderboard / announcements are empty
Run the seed script from Replit's Shell (Step 6 above). MongoDB collections are created automatically — no migrations needed.
