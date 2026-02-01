# Deploy GP Archive to Cloudflare (FREE)

This guide will help you migrate from Railway to Cloudflare Workers + Pages for **$0/month** hosting.

## Overview

**Current Setup:**
- Railway (Express server) → **$5-20/month**
- Cloudflare R2 (storage) → **$0.07/month**

**New Setup:**
- Cloudflare Worker (API) → **FREE** (100k requests/day)
- Cloudflare Pages (frontend) → **FREE**
- Cloudflare R2 (storage) → **$0.07/month**

**Total Cost: ~$0.07/month** (essentially free)

---

## Prerequisites

1. **Cloudflare Account** (free)
   - Sign up at: https://dash.cloudflare.com/sign-up

2. **Node.js & npm** (already installed)

3. **Wrangler CLI** (Cloudflare's deployment tool)
   ```bash
   npm install -g wrangler
   ```

---

## Step 1: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate.

---

## Step 2: Deploy the Worker (API)

The Worker provides the `/api/episodes` endpoint and streams audio from R2.

```bash
cd C:\Users\schmi\Downloads\gparchive
wrangler deploy
```

**Output:**
```
Published gparchive-api (0.01 sec)
  https://gparchive-api.YOUR-SUBDOMAIN.workers.dev
```

**Your API endpoint will be:** `https://gparchive-api.YOUR-SUBDOMAIN.workers.dev`

---

## Step 3: Deploy the Frontend (Cloudflare Pages)

### Option A: Deploy via GitHub (Recommended)

1. Go to: https://dash.cloudflare.com/
2. Click **Pages** → **Create a project**
3. Connect to GitHub → Select `gparchive` repository
4. **Build settings:**
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: `/public`
5. Click **Save and Deploy**

**Your site will be live at:** `https://gparchive.pages.dev`

### Option B: Direct Upload (Manual)

```bash
cd C:\Users\schmi\Downloads\gparchive
npx wrangler pages deploy public --project-name=gparchive
```

---

## Step 4: Connect Frontend to Worker API

You have two options:

### Option A: Integrated (Same Domain) - RECOMMENDED

This makes the Worker and Pages work on the same domain (no CORS issues).

1. In the `gparchive` folder, create a `_worker.js` file in the `public/` directory:
   ```bash
   copy worker.js public\_worker.js
   ```

2. Redeploy Pages (it will now include the Worker)

**Result:** Everything runs on `https://gparchive.pages.dev`
- `https://gparchive.pages.dev/` → Frontend
- `https://gparchive.pages.dev/api/episodes` → Worker API

### Option B: Separate Domains

Update `public/app.js` to point to your Worker URL:

```javascript
// Line 34 - Update the API endpoint
const response = await fetch('https://gparchive-api.YOUR-SUBDOMAIN.workers.dev/api/episodes');
```

---

## Step 5: Verify Deployment

1. **Check Worker API:**
   ```bash
   curl https://gparchive-api.YOUR-SUBDOMAIN.workers.dev/api/episodes
   ```

   Should return JSON with your episodes.

2. **Check Frontend:**
   Open: `https://gparchive.pages.dev`

   Should show all your episodes and play them!

---

## Step 6: Turn Off Railway (Save Money!)

Once Cloudflare is working:

1. Go to: https://railway.app/
2. Find your `gparchive` project
3. Click **Settings** → **Danger Zone** → **Delete Service**

**You're now saving $5-20/month!**

---

## Upload Process (Unchanged)

Your upload workflow stays exactly the same:

1. **Download episode:**
   ```bash
   node download-bbc-authenticated.js "https://www.bbc.co.uk/programmes/EPISODE_ID"
   ```

2. **Upload to R2:**
   ```bash
   python upload_single_file.py
   ```

3. **Episode automatically appears on site** (no redeploy needed!)

---

## API Endpoints

Your new Worker provides:

- `GET /api/episodes` - List all episodes
- `GET /audio/:filename` - Stream audio file
- `GET /health` - Health check

---

## Troubleshooting

### Worker shows "R2 bucket not found"

Make sure your R2 bucket is named `gparchive`. Check with:
```bash
wrangler r2 bucket list
```

If it's different, update `wrangler.toml`:
```toml
bucket_name = "YOUR_BUCKET_NAME"
```

### CORS errors

Use **Option A** (Integrated deployment) to avoid CORS issues.

### Episodes not updating

The Worker lists files directly from R2, so they should appear immediately after upload. Try:
1. Hard refresh your browser (Ctrl+F5)
2. Clear browser cache

---

## Cost Breakdown (Final)

| Service | Cost |
|---------|------|
| Cloudflare Worker | **FREE** (100k requests/day) |
| Cloudflare Pages | **FREE** (unlimited sites) |
| Cloudflare R2 Storage (4GB) | **$0.06/month** |
| R2 Operations | **$0.01/month** |
| **TOTAL** | **~$0.07/month** |

---

## Summary

✅ **What you gain:**
- $0/month hosting (vs $5-20 on Railway)
- Auto-updating episode list
- No server maintenance
- Same PWA experience
- Unlimited bandwidth (Cloudflare CDN)

❌ **What you lose:**
- DLNA casting (requires persistent server)

---

## Next Steps

1. Run `wrangler login`
2. Run `wrangler deploy`
3. Deploy to Pages (via GitHub or direct upload)
4. Turn off Railway
5. Enjoy free hosting! 🎉

Need help? Check the Cloudflare docs: https://developers.cloudflare.com/workers/
