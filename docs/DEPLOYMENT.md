# GP Archive - Deployment Guide

Complete step-by-step guide for anonymous deployment using free tier services.

## Prerequisites

- Audio files (MP3) ready to upload
- Anonymous email account (ProtonMail recommended)
- VPN or Tor connection (for anonymity)
- GitHub account (can be anonymous)

## Architecture Overview

```
┌─────────────┐
│   Users     │
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
┌──────▼──────┐    ┌─────▼─────┐
│  Cloudflare │    │  Railway  │
│    Pages    │    │    API    │
│  (Frontend) │    │ (Metadata)│
└──────┬──────┘    └───────────┘
       │
┌──────▼──────┐
│ Cloudflare  │
│     R2      │
│  (Audio)    │
└─────────────┘
```

## Step 1: Setup Cloudflare Account

### Create Account Anonymously
1. Open Tor Browser or VPN
2. Go to [cloudflare.com](https://cloudflare.com)
3. Sign up with anonymous email (ProtonMail)
4. Enable 2FA with authenticator app (not SMS)

### Create R2 Bucket
1. Navigate to **R2** in Cloudflare dashboard
2. Click **Create bucket**
3. Name: `gp-archive` (or any name)
4. Region: Choose closest to target audience
5. Click **Create bucket**

### Configure R2 Public Access
1. Go to bucket **Settings**
2. Under **Public Access**, click **Allow Access**
3. Set domain: `pub-xxxxx.r2.dev` (Cloudflare provides this)
4. Note the public URL for later

### Get R2 API Credentials
1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Name: `gp-archive-api`
4. Permissions: **Object Read & Write**
5. Copy and save (securely):
   - Account ID
   - Access Key ID
   - Secret Access Key

### Upload Audio Files to R2
1. Use Cloudflare dashboard **Upload** button
2. Or use `rclone` for bulk upload:

```bash
# Configure rclone
rclone config

# Name: cloudflare-r2
# Type: s3
# Provider: Cloudflare
# Access Key: <YOUR_ACCESS_KEY>
# Secret Key: <YOUR_SECRET_KEY>
# Endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# Upload files
rclone copy ./archive/ cloudflare-r2:gp-archive/
```

## Step 2: Deploy API to Railway

### Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (use anonymous GitHub account)
3. Or sign up with email (use anonymous email)

### Deploy API
1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Connect your GitHub account
4. Create new repo and push the `api/` folder:

```bash
cd gp_proxy_hosted/api/
git init
git add .
git commit -m "Initial commit"

# Create new GitHub repo (private)
# Then push
git remote add origin https://github.com/YOUR_ANON_USER/gp-archive-api.git
git push -u origin main
```

5. Select the repository in Railway
6. Railway will auto-detect Node.js and deploy

### Configure Environment Variables
In Railway dashboard, go to **Variables** and add:

```
R2_ACCOUNT_ID=<your_account_id>
R2_ACCESS_KEY_ID=<your_access_key>
R2_SECRET_ACCESS_KEY=<your_secret_key>
R2_BUCKET_NAME=gp-archive
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### Get API URL
1. After deployment, Railway provides a URL
2. Example: `https://gp-archive-api-production.up.railway.app`
3. Copy this URL for frontend configuration

### Update Episode List
Edit `api/server.js` and add your episodes to the `episodes` array:

```javascript
const episodes = [
    {
        filename: "your-episode-file.mp3",
        name: "Episode Title",
        date: "2025-01-15T00:00:00Z",
        size: 452984832,
        episodeId: "unique_id"
    }
    // Add more...
];
```

Redeploy after changes.

## Step 3: Deploy Frontend to Cloudflare Pages

### Update Configuration
Edit `frontend/app.js` and update:

```javascript
const CONFIG = {
    API_URL: 'https://your-app.railway.app/api/episodes',
    R2_BUCKET_URL: 'https://pub-xxxxx.r2.dev'
};
```

### Create GitHub Repo for Frontend
```bash
cd gp_proxy_hosted/frontend/
git init
git add .
git commit -m "Initial commit"

# Create new GitHub repo (can be public - no sensitive data)
git remote add origin https://github.com/YOUR_ANON_USER/gp-archive.git
git push -u origin main
```

### Deploy to Cloudflare Pages
1. In Cloudflare dashboard, go to **Pages**
2. Click **Create a project**
3. Connect to GitHub
4. Select your frontend repository
5. Build settings:
   - Build command: (leave empty - static site)
   - Build output directory: `/`
6. Click **Save and Deploy**

### Configure Custom Domain (Optional)
1. Buy domain from privacy-focused registrar:
   - [Njalla](https://njal.la) (accepts Bitcoin)
   - Namecheap with WhoisGuard
2. In Cloudflare Pages, go to **Custom domains**
3. Add your domain
4. Update DNS in your registrar:
   - Point to Cloudflare nameservers

## Step 4: Test Deployment

### Test API
```bash
curl https://your-app.railway.app/api/health
curl https://your-app.railway.app/api/episodes
```

### Test Frontend
1. Open your Cloudflare Pages URL
2. Check browser console for errors
3. Verify episodes load
4. Test audio playback

### Test PWA Installation
1. On iOS: Open in Safari → Share → Add to Home Screen
2. On Android: Chrome → Menu → Install App

## Anonymity Best Practices

### Before Deployment
- [ ] Remove all personal info from code
- [ ] Use VPN/Tor for all admin access
- [ ] Use anonymous email for all services
- [ ] Use separate GitHub account
- [ ] Pay with cryptocurrency where possible

### After Deployment
- [ ] Never access admin panels without VPN
- [ ] Don't link to personal social media
- [ ] Use privacy-focused analytics only (or none)
- [ ] Consider Cloudflare's privacy settings
- [ ] Monitor for DMCA/takedown notices

### Git History Sanitization
```bash
# Remove author info
git filter-branch --env-filter '
CORRECT_NAME="Anonymous"
CORRECT_EMAIL="anon@example.com"
export GIT_COMMITTER_NAME="$CORRECT_NAME"
export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
export GIT_AUTHOR_NAME="$CORRECT_NAME"
export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
' --tag-name-filter cat -- --branches --tags
```

## Maintenance

### Adding New Episodes
1. Upload MP3 to R2 bucket
2. Update `api/server.js` episodes array
3. Redeploy Railway API
4. Frontend will automatically show new episodes

### Monitoring
- Railway: Check logs in dashboard
- Cloudflare: Analytics in Pages/R2 dashboards
- Set up uptime monitoring (UptimeRobot)

### Updating Frontend
1. Make changes to `frontend/` files
2. Commit and push to GitHub
3. Cloudflare Pages auto-deploys

### Backup
- R2 files: Use `rclone` to backup locally
- API code: GitHub repository
- Frontend code: GitHub repository

## Cost Tracking

### Free Tier Limits
| Service | Free Tier | Overage Cost |
|---------|-----------|--------------|
| Cloudflare R2 | 10GB storage | $0.015/GB/month |
| Cloudflare Pages | Unlimited bandwidth | Free |
| Railway | 500hrs/month | $5/month after |

### Estimated Usage
- 100 episodes × 400MB = 40GB storage = **$0.45/month** (R2 overage)
- API: Should stay within free 500hrs
- Total: **$0-5/month**

## Troubleshooting

### API Not Loading Episodes
- Check Railway logs
- Verify environment variables
- Test `/api/health` endpoint

### Audio Files Not Playing
- Check R2 public access settings
- Verify R2_PUBLIC_URL in frontend config
- Check browser console for CORS errors

### PWA Not Installing
- Verify manifest.json is accessible
- Check service worker registration
- Icons must be HTTPS

## Security Notes

### Legal Considerations
⚠️ **IMPORTANT**: This guide is for educational purposes.

- BBC content is copyrighted
- Public distribution may violate copyright
- Consider password protection
- Consider geographic restrictions
- Consult legal advice for your jurisdiction

### Recommended Additional Protection
1. Add password protection to frontend
2. Implement rate limiting
3. Use Cloudflare Access for private access
4. Monitor for abuse

## Next Steps

After successful deployment:
1. Test thoroughly from different devices
2. Monitor usage and costs
3. Consider adding password protection
4. Set up automated backups
5. Create update workflow for new episodes

---

**Questions?** Check Railway/Cloudflare documentation or community forums.

**Privacy Tip:** Always use Tor/VPN when accessing admin panels.
