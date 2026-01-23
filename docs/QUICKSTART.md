# Quick Start Guide

Get your anonymous GP Archive deployed in ~30 minutes.

## TL;DR

1. **Cloudflare R2**: Upload MP3 files
2. **Railway**: Deploy API
3. **Cloudflare Pages**: Deploy frontend
4. Done!

## Prerequisites Checklist

- [ ] MP3 files ready
- [ ] ProtonMail account
- [ ] VPN active
- [ ] Anonymous GitHub account

## 5-Step Deployment

### 1. Cloudflare Setup (10 min)

```bash
# Sign up at cloudflare.com
# Create R2 bucket: "gp-archive"
# Upload MP3 files
# Enable public access
# Copy credentials
```

**You'll need:**
- R2 Account ID
- R2 Access Key
- R2 Secret Key
- R2 Public URL

### 2. Prepare API (5 min)

```bash
cd gp_proxy_hosted/api/

# Edit server.js - add your episodes
vim server.js  # Update episodes array

# Create GitHub repo
git init
git add .
git commit -m "Init"
gh repo create gp-archive-api --private
git push -u origin main
```

### 3. Deploy API to Railway (5 min)

```bash
# Go to railway.app
# Connect GitHub
# Deploy gp-archive-api repo
# Add environment variables:
#   R2_ACCOUNT_ID
#   R2_ACCESS_KEY_ID
#   R2_SECRET_ACCESS_KEY
#   R2_BUCKET_NAME
#   R2_PUBLIC_URL
# Copy Railway URL
```

### 4. Prepare Frontend (5 min)

```bash
cd gp_proxy_hosted/frontend/

# Edit app.js - update config
vim app.js  # Update API_URL and R2_BUCKET_URL

# Create GitHub repo
git init
git add .
git commit -m "Init"
gh repo create gp-archive --public
git push -u origin main
```

### 5. Deploy Frontend to Cloudflare Pages (5 min)

```bash
# In Cloudflare dashboard:
# Pages → Create Project
# Connect GitHub → gp-archive
# Build command: (empty)
# Build output: /
# Deploy!
```

## Test It

```bash
# Test API
curl https://your-app.railway.app/api/episodes

# Test Frontend
# Open Cloudflare Pages URL in browser
# Play an episode
```

## Next Steps

1. ✅ Test on iOS (Add to Home Screen)
2. ✅ Test on Android
3. ⚠️ Add password protection (optional)
4. ⚠️ Buy custom domain (optional)
5. ✅ Set up monitoring

## Costs

- **Month 1-∞**: $0-5/month
- **Domain**: $2-15/year (optional)

## Help

Problem | Solution
--------|----------
API errors | Check Railway logs
No audio | Verify R2 public access
Won't install PWA | Check manifest.json & HTTPS

Full guide: See [DEPLOYMENT.md](DEPLOYMENT.md)

## Anonymity Checklist

- [ ] Used VPN/Tor
- [ ] Anonymous email only
- [ ] Separate GitHub account
- [ ] No personal info in code
- [ ] Private admin access only

---

🎉 **That's it!** Your anonymous GP Archive is live.
