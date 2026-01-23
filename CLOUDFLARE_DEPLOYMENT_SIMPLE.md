# Deploy GP Archive to Cloudflare Pages (SIMPLIFIED)

This is the **easiest** way to deploy for **$0/month** hosting.

## Quick Deploy (5 Minutes)

### Step 1: Deploy to Cloudflare Pages

1. Go to https://dash.cloudflare.com/ and login
2. Click **Workers & Pages** → **Create application** → **Pages** tab
3. Click **Connect to Git**
4. Select your GitHub → Choose **gparchive** repository
5. Configure build settings:
   - **Build output directory**: `/public`
   - Click **Save and Deploy**

Wait 2-3 minutes for deployment to complete.

### Step 2: Add R2 Bucket Binding

After deployment finishes:

1. Stay in your **gparchive** Pages project
2. Click **Settings** (top navigation)
3. Scroll down to **Functions** section (you may need to expand it)
4. Find **R2 bucket bindings** and click **Add binding**
   - **Variable name**: `GPARCHIVE_BUCKET` (exactly this)
   - **R2 bucket**: Select `gparchive` from dropdown
5. Click **Save**

### Step 3: Redeploy

1. Click **Deployments** tab (top)
2. Find the latest deployment
3. Click the three dots **⋯** → **Retry deployment**

Wait 1-2 minutes.

### Step 4: Test It!

Your site is live at: `https://gparchive.pages.dev`

Test the API:
```
https://gparchive.pages.dev/api/episodes
```

Should show your 11 episodes!

---

## If You Can't Find "Functions" Section

The UI might be different. Try this:

1. In your Pages project, click **Settings**
2. Look for any of these sections:
   - **Bindings**
   - **Environment variables**
   - **Functions**
3. If you see **"Add binding"** anywhere, click it
4. Choose **R2 bucket** type
5. Set:
   - Variable name: `GPARCHIVE_BUCKET`
   - Bucket: `gparchive`

Still can't find it? Try **wrangler CLI** method below:

### Alternative: Use Command Line

```bash
cd C:\Users\schmi\Downloads\gparchive

# Install wrangler if you haven't
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Add R2 binding to your Pages project
wrangler pages project create gparchive
wrangler pages deployment create public --project-name=gparchive
```

Then in the Cloudflare dashboard, add the R2 binding as described above.

---

## Your New Endpoints

- **Website**: `https://gparchive.pages.dev`
- **API**: `https://gparchive.pages.dev/api/episodes`
- **Audio Stream**: `https://gparchive.pages.dev/audio/FILENAME.mp3`

---

## Cost

**Total: $0.07/month** (just R2 storage)

- Cloudflare Pages: **FREE**
- Pages Functions: **FREE** (100k requests/day)
- R2 Storage (4GB): **$0.06/month**
- R2 Operations: **$0.01/month**

---

## Upload Process (Same as Before)

1. Download episode:
   ```bash
   node download-bbc-authenticated.js "URL"
   ```

2. Upload to R2:
   ```bash
   python upload_single_file.py
   ```

3. Episodes appear automatically on your site!

---

## Turn Off Railway

Once Cloudflare works:

1. Go to https://railway.app/
2. Find **gparchive** project
3. **Settings** → **Delete Service**

**Save $5-20/month!** 💰

---

## Need Help?

- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- R2 Bindings: https://developers.cloudflare.com/pages/platform/functions/bindings/#r2-buckets

Can't find the settings? Screenshot your Cloudflare Pages settings page and I'll guide you through it.
