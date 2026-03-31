# Plutonium SMP — Complete Vercel Deployment Guide

> Everything you need to go from code to live website.
> No guessing. Every field, every button, every variable is listed here.

---

## What You Will Deploy

This project has **two separate apps** that both go on Vercel:

```
YOUR GITHUB REPO
├── artifacts/api-server/        ← Deploy as "plutonium-api" on Vercel
└── artifacts/plutonium-smp/     ← Deploy as "plutonium-smp" on Vercel
```

They talk to each other — the frontend calls the API. You deploy the API first, then the frontend.

You also need a **MongoDB Atlas** database (free) before starting.

**Total time:** ~20 minutes

---

## Prerequisites

Before you start, you need accounts on these 3 websites (all free):

| Service | Sign-up link | What it's for |
|---|---|---|
| **GitHub** | [github.com](https://github.com) | Hosts your code (Vercel reads from it) |
| **Vercel** | [vercel.com](https://vercel.com) | Deploys and hosts both apps |
| **MongoDB Atlas** | [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) | Your database |

---

## PART 1 — Push Your Code to GitHub

Vercel needs your code on GitHub before it can deploy anything.

1. Log in to [github.com](https://github.com)
2. Click the **+** button (top right) → **New repository**
3. Name it `plutonium-smp` → set it to **Private** → click **Create repository**
4. GitHub shows you commands — **ignore those** and go to Replit instead
5. In Replit, open the **Shell** tab (bottom of screen) and run:

```
git remote add origin https://github.com/YOUR_USERNAME/plutonium-smp.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

Your code is now on GitHub. You can verify at `github.com/YOUR_USERNAME/plutonium-smp`.

---

## PART 2 — Set Up MongoDB Atlas (Free Database)

### Step 1 — Create account and cluster

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click **Try Free** → sign up with Google or email
3. Answer the onboarding questions (skip if possible)
4. On the **Deploy your cluster** page:
   - Select **M0 Sandbox** — this is the **free forever** tier
   - Pick any cloud provider (AWS is fine) and any region near your users
   - Set cluster name to: `plutonium`
   - Click **Create Deployment**

### Step 2 — Create a database user

A dialog appears asking you to create a user:

1. Username: `plutonium`
2. Click **Autogenerate Secure Password**
3. **COPY THE PASSWORD NOW** and save it — you can't see it again
4. Click **Create Database User**

### Step 3 — Set up network access

Vercel uses changing IP addresses, so you must allow all IPs:

1. Click **Network Access** in the left sidebar
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere**
4. Click **Confirm**

### Step 4 — Get the connection string

1. Click **Database** in the left sidebar
2. Click **Connect** on your cluster
3. Select **Drivers**
4. Make sure **Node.js** is selected
5. Copy the connection string. It looks like:
   ```
   mongodb+srv://plutonium:<password>@plutonium.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with the password from Step 2
7. Add `/plutonium` before the `?` to set the database name:
   ```
   mongodb+srv://plutonium:YOURPASSWORD@plutonium.xxxxx.mongodb.net/plutonium?retryWrites=true&w=majority
   ```

**This final string is your `MONGODB_URI`. Save it — you will paste it multiple times.**

---

## PART 3 — Deploy the API Server

### Step 1 — Import project on Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **Add New…** → **Project**
3. Click **Connect** next to GitHub and authorize Vercel
4. Find `plutonium-smp` in the repository list → click **Import**

### Step 2 — Configure the project settings

You will see a configuration page. Set these fields:

---

**Project Name**
```
plutonium-api
```

---

**Root Directory**

Click the **Edit** pencil icon next to this field. Type:
```
artifacts/api-server
```
Then click **Continue**.

> This tells Vercel which folder is the API. If you skip this, the deploy will fail.

---

**Framework Preset**

Select: **Other**

---

**Build Command**

Leave completely **blank**. The `vercel.json` file inside the folder handles the build automatically.

---

**Output Directory**

Leave completely **blank**.

---

**Install Command**

Click **Override** and type:
```
cd ../.. && pnpm install --frozen-lockfile
```

> This navigates to the monorepo root and installs all packages including the shared database library. Without this override, the build fails because it can't find `@workspace/db`.

---

### Step 3 — Add environment variables

Scroll down to **Environment Variables**. Add each variable below by typing the name, pasting the value, and clicking **Add**.

---

#### DATABASE

| Name | Value |
|---|---|
| `MONGODB_URI` | Your full Atlas connection string from Part 2 Step 4 |

---

#### AUTHENTICATION

| Name | Value | How to get the value |
|---|---|---|
| `SESSION_SECRET` | A random 64-character string | Go to [generate-random.org/string-password-generator](https://generate-random.org/string-password-generator?count=1&length=64&type=mixed) and copy the result |
| `NODE_ENV` | `production` | Type this literally |

---

#### YOUR API URL

| Name | Value |
|---|---|
| `APP_URL` | `https://plutonium-api.vercel.app` |

> Use your actual project name here. If you named it differently (e.g. `my-api`), it would be `https://my-api.vercel.app`.
> You can update this after the first deploy if the URL is different.

---

#### CORS (allows frontend to talk to API)

| Name | Value |
|---|---|
| `ALLOWED_ORIGINS` | `https://plutonium-smp.vercel.app` |

> This is the frontend URL you will create in Part 4. If your frontend project name is different, adjust accordingly.

---

#### EMAIL — Choose one option

You need email for OTP codes (login, register, checkout). Choose one:

**Option A — Resend (recommended, easiest)**

1. Sign up free at [resend.com](https://resend.com)
2. Go to **API Keys** → **Create API Key**
3. Copy the key

| Name | Value |
|---|---|
| `RESEND_API_KEY` | `re_xxxxxx` (your Resend API key) |
| `SMTP_FROM` | `Plutonium SMP <noreply@yourdomain.com>` |

**Option B — Gmail**

First, create a Gmail App Password:
1. Go to your Google Account → **Security**
2. Under "How you sign in to Google", click **2-Step Verification** (must be enabled)
3. Scroll to the bottom → click **App passwords**
4. Select app: **Mail**, device: **Other** → type "Vercel" → click **Generate**
5. Copy the 16-character password shown

| Name | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your@gmail.com` |
| `SMTP_PASS` | The 16-character app password from above |
| `SMTP_FROM` | `Plutonium SMP <your@gmail.com>` |

---

#### DISCORD OAUTH (optional)

Skip this for now. You can add it after everything is working.

---

### Step 4 — Click Deploy

Click the **Deploy** button. The build takes 1–3 minutes.

When it completes:
- You will see a success screen with a URL like `https://plutonium-api.vercel.app`
- Click the URL and add `/api/health` to the end: `https://plutonium-api.vercel.app/api/health`
- If you see `{"status":"ok"}` the API is running correctly

**Copy your API URL.** You need it in the next part.

#### Fix APP_URL if the URL is different

If Vercel gave you a different URL than what you typed for `APP_URL`:

1. In your project, go to **Settings** → **Environment Variables**
2. Find `APP_URL` and click **Edit**
3. Update the value to the actual URL
4. Click **Save**
5. Go to **Deployments** → click the three-dot menu on the latest deployment → **Redeploy**

---

## PART 4 — Deploy the Frontend

### Step 1 — Import the same repository again

1. In Vercel, click **Add New…** → **Project**
2. Find `plutonium-smp` in the repository list → click **Import**
3. This is the same repo as before — that's correct

### Step 2 — Configure the project settings

---

**Project Name**
```
plutonium-smp
```

---

**Root Directory**

Click **Edit** → type:
```
artifacts/plutonium-smp
```
Click **Continue**.

---

**Framework Preset**

Select: **Vite**

---

**Build Command**
```
pnpm run build
```

---

**Output Directory**
```
dist/public
```

---

**Install Command**

Click **Override** → type:
```
cd ../.. && pnpm install --frozen-lockfile
```

---

### Step 3 — Add environment variables

| Name | Value |
|---|---|
| `VITE_API_URL` | Your API URL from Part 3 (e.g. `https://plutonium-api.vercel.app`) |

### Step 4 — Click Deploy

Click **Deploy** and wait ~1 minute.

When done, click the URL Vercel gives you. You should see the Plutonium SMP home page.

---

## PART 5 — Seed the Database

The database is empty right now. The seed script creates:
- Admin account (`admin@plutoniumsmp.net` / `admin123`)
- 8 store items (ranks, crates, coins)
- 10 leaderboard entries
- 3 announcements

In **Replit's Shell** tab, run (replace the URI with your actual Atlas connection string):

```
MONGODB_URI="mongodb+srv://plutonium:YOURPASSWORD@plutonium.xxxxx.mongodb.net/plutonium?retryWrites=true&w=majority" pnpm --filter @workspace/scripts run seed
```

You should see:
```
Connecting to MongoDB...
[MongoDB] Connected
Seeding database...
Created admin user: admin@plutoniumsmp.net / admin123
Created store items
Created leaderboard entries
Created announcements
Seed complete!
```

Now visit your live site, go to **Login**, and sign in with:
- Email: `admin@plutoniumsmp.net`
- Password: `admin123`

**Change this password immediately** after logging in.

---

## PART 6 — Set Up Discord OAuth (Optional)

This enables the "Login with Discord" button. Skip if you don't need it.

### Step 1 — Create a Discord application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Log in with your Discord account
3. Click **New Application** (top right)
4. Name: `Plutonium SMP` → click **Create**

### Step 2 — Add the redirect URI

1. In the left sidebar, click **OAuth2**
2. Under **Redirects**, click **Add Redirect**
3. Paste this URL (replace with your actual API URL):
   ```
   https://plutonium-api.vercel.app/api/auth/discord/callback
   ```
4. Click **Save Changes**

### Step 3 — Copy your credentials

On the **OAuth2** page:
- **Client ID** is shown near the top — click the copy icon next to it
- **Client Secret** — click **Reset Secret** → click **Yes, do it!** → copy the secret shown

### Step 4 — Add to Vercel

In your **API Vercel project** → **Settings** → **Environment Variables**:

| Name | Value |
|---|---|
| `DISCORD_CLIENT_ID` | Paste your Client ID |
| `DISCORD_CLIENT_SECRET` | Paste your Client Secret |

Then redeploy: **Deployments** → three-dot menu on the latest deploy → **Redeploy**.

Test it by clicking "Login with Discord" on your live site.

---

## PART 7 — Custom Domain (Optional)

To use `plutoniumsmp.net` instead of `plutonium-smp.vercel.app`:

### Frontend domain

1. In the `plutonium-smp` Vercel project → **Settings** → **Domains**
2. Click **Add** and type your domain (e.g. `plutoniumsmp.net`)
3. Vercel shows you DNS records to add — log in to your domain registrar (Namecheap, GoDaddy, etc.) and add those records
4. Wait a few minutes for DNS to propagate — Vercel shows a green checkmark when ready

### API domain

1. In the `plutonium-api` Vercel project → **Settings** → **Domains**
2. Add your API subdomain (e.g. `api.plutoniumsmp.net`)

### Update environment variables

After both custom domains are active, update these:

**In the API project:**

| Variable | New value |
|---|---|
| `APP_URL` | `https://api.plutoniumsmp.net` |
| `ALLOWED_ORIGINS` | `https://plutoniumsmp.net` |

**In the Frontend project:**

| Variable | New value |
|---|---|
| `VITE_API_URL` | `https://api.plutoniumsmp.net` |

**In Discord developer portal:**
- OAuth2 → Redirects → update to `https://api.plutoniumsmp.net/api/auth/discord/callback`

Redeploy both projects after updating all variables.

---

## All Environment Variables — Complete Reference

### API Server project (`plutonium-api`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | **YES** | — | MongoDB Atlas connection string |
| `SESSION_SECRET` | **YES** | — | 64-char random string for JWT tokens. Never change after going live. |
| `APP_URL` | **YES** | — | Full public URL of the API. No trailing slash. Used for Discord OAuth redirect. |
| `ALLOWED_ORIGINS` | **YES** | — | Frontend URL. CORS blocks requests from other origins. |
| `NODE_ENV` | **YES** | — | Set to `production` |
| `DISCORD_CLIENT_ID` | Optional | — | Discord application Client ID |
| `DISCORD_CLIENT_SECRET` | Optional | — | Discord application Client Secret |
| `RESEND_API_KEY` | Email | — | Resend.com API key. If set, overrides SMTP. |
| `SMTP_HOST` | Email | — | SMTP server hostname |
| `SMTP_PORT` | Email | — | SMTP port (usually `587`) |
| `SMTP_USER` | Email | — | SMTP login username |
| `SMTP_PASS` | Email | — | SMTP password or app password |
| `SMTP_FROM` | Email | — | Display name + email for outgoing mail |
| `LOG_LEVEL` | No | `info` | Verbosity: `trace` `debug` `info` `warn` `error` |

### Frontend project (`plutonium-smp`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **YES** | Full URL of the API. No trailing slash. |

---

## Vercel Project Settings — Exact Values

### API Server

| Vercel Field | Exact Value |
|---|---|
| Project Name | `plutonium-api` |
| Root Directory | `artifacts/api-server` |
| Framework Preset | **Other** |
| Build Command | *(leave blank)* |
| Output Directory | *(leave blank)* |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |

### Frontend

| Vercel Field | Exact Value |
|---|---|
| Project Name | `plutonium-smp` |
| Root Directory | `artifacts/plutonium-smp` |
| Framework Preset | **Vite** |
| Build Command | `pnpm run build` |
| Output Directory | `dist/public` |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |

---

## Troubleshooting

### Build fails with "Cannot find module @workspace/db"
The Install Command is not overridden. Go to **Settings** → **General** → scroll to **Build & Development Settings** and set Install Command to `cd ../.. && pnpm install --frozen-lockfile`.

### API health check returns 500 or connection error
`MONGODB_URI` is wrong. Common mistakes:
- Password still contains `<password>` literally instead of your real password
- Missing `/plutonium` before the `?` in the URI
- Copy-paste added extra spaces
- Network Access in Atlas is not set to allow all IPs (`0.0.0.0/0`)

### Frontend loads but all API calls fail (network error)
- `VITE_API_URL` is not set, or has a typo — redeploy the frontend after fixing
- `ALLOWED_ORIGINS` on the API doesn't match the frontend URL exactly — redeploy the API after fixing

### "redirect_uri_mismatch" when logging in with Discord
The redirect URI in the Discord developer portal doesn't match. Make sure:
- The URI in Discord is exactly: `[APP_URL]/api/auth/discord/callback`
- `APP_URL` has no trailing slash
- Both are using `https`

### Login page shows OTP but no email arrives
Email is not configured. Add `RESEND_API_KEY` (easiest) or the SMTP variables to the API project and redeploy.

### Site works but store / leaderboard is empty
You haven't run the seed script. Follow Part 5 above.

### Users get logged out after every redeploy
`SESSION_SECRET` is changing. Set it to a fixed value in Vercel environment variables and never change it.

### White page on the frontend
The `vercel.json` inside `artifacts/plutonium-smp` handles SPA routing. Make sure:
- Root Directory is set to `artifacts/plutonium-smp`
- You haven't deleted or modified `artifacts/plutonium-smp/vercel.json`

### I forgot my admin password
In Replit's Shell, run the seed script again (Part 5). It won't overwrite an existing admin if the account already exists. Instead, in MongoDB Atlas, go to **Browse Collections** → `users` collection → find the admin document → edit `passwordHash` by replacing it with a new bcrypt hash. Or delete the admin document and re-run seed.
