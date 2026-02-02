# Gilles Peterson Archive

Automated BBC Radio 6 archive system using Cloudflare infrastructure.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Cloudflare Pages (PWA)                     │
│  ├── /public/          (static frontend)    │
│  └── /functions/       (API endpoints)      │
│      ├── /api/episodes.js                   │
│      └── /audio/[[filename]].js             │
└─────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────┐
│  Cloudflare R2 (Audio Storage)              │
│  Bucket: gparchive                          │
│  Files: YYYY-MM-DD Gilles Peterson - ....mp3│
└─────────────────────────────────────────────┘
```

## How It Works

1. **You say**: "Download the latest episode"
2. **Claude runs**: `python auto_download_weekly.py` (via yt-dlp + UK VPN)
3. **Script automatically**:
   - Downloads latest episode from BBC
   - Renames to: `YYYY-MM-DD Gilles Peterson - Title.mp3`
   - Uploads to Cloudflare R2
   - Cleans up local files
4. **Website updates automatically**: Cloudflare Pages Functions list episodes from R2

**No code deployment needed!** Just upload to R2 and the site shows it.

## The Workflow (What You Tell Claude)

```
You: "Download the latest Gilles Peterson episode"
Claude:
  1. Runs auto_download_weekly.py
  2. Episode appears on website automatically
  3. Done!
```

## Prerequisites

- **CyberGhost VPN** connected to UK
- **Python 3.11+** with packages:
  ```bash
  pip install yt-dlp boto3
  ```
- **Cloudflare Account** with R2 bucket configured

## Files in This Repo

### Core Files (Production)
- `public/` - PWA frontend (Cloudflare Pages)
  - `index.html` - Main page
  - `app.js` - Player logic
  - `style.css` - Styling
  - `sw.js` - Service worker for PWA
  - `manifest.json` - PWA manifest
  - `icon-*.png` - PWA icons

- `functions/` - Cloudflare Pages Functions
  - `api/episodes.js` - Lists episodes from R2
  - `audio/[[filename]].js` - Streams audio from R2

### Download Scripts
- `auto_download_weekly.py` - Main download script
- `run_gp_download.bat` - Windows helper (optional)

### Utilities
- `upload_to_r2.py` - Bulk upload old episodes
- `list_r2_files.py` - List what's in R2
- `create_icons.py` - Generate PWA icons
- Other helper scripts for migration

### Documentation
- `AUTOMATION_SETUP.md` - How to schedule downloads
- `README.md` - This file

## Deployment

### Initial Setup (One-time)

1. **Deploy to Cloudflare Pages**:
   ```bash
   # Push this repo to GitHub
   # Connect Cloudflare Pages to the repo
   # Root directory: /
   # Build command: (none - static site)
   # Build output: /public
   ```

2. **Configure R2 Bucket Binding**:
   - In Cloudflare Pages settings
   - Environment Variables → R2 Bindings
   - Variable name: `GPARCHIVE_BUCKET`
   - R2 bucket: `gparchive`

3. **Set R2 Public Access**:
   - Enable R2 public access for bucket
   - Or configure custom domain

### Weekly Updates (Hands-off)

Just tell Claude: **"Download the latest episode"**

Claude will:
1. Run `python auto_download_weekly.py`
2. Episode uploads to R2
3. Website shows it automatically (no deployment needed!)

## Manual Download

```bash
# Connect CyberGhost VPN to UK
python auto_download_weekly.py
```

The script:
- Finds latest episode
- Downloads via yt-dlp
- Renames with date
- Uploads to R2
- Cleans up local files

## Configuration

R2 credentials are in `auto_download_weekly.py`:

```python
ACCESS_KEY = "..."
SECRET_KEY = "..."
ACCOUNT_ID = "..."
BUCKET_NAME = "gparchive"
```

## Live Website

The website automatically:
- Lists all episodes from R2 (sorted newest first)
- Streams audio directly from R2
- Works as PWA (installable on mobile)
- Saves playback position
- No authentication needed

## Cost

| Service | Usage | Cost |
|---------|-------|------|
| Cloudflare Pages | Frontend hosting | $0 |
| Cloudflare R2 | ~5GB storage | $0 (10GB free) |
| **Total** | | **$0/month** |

## Helper Scripts

### List episodes in R2
```bash
python list_r2_files.py
```

### Upload old episodes
```bash
python upload_to_r2.py
```

### Create PWA icons
```bash
python create_icons.py
```

## Notes

- Episodes must be in format: `YYYY-MM-DD Gilles Peterson - Title.mp3`
- R2 bucket must be named `gparchive` (or update code)
- VPN to UK is required for BBC downloads
- Cloudflare Pages automatically deploys on git push
- But episodes don't need deployment - just upload to R2!

## The Beautiful Part

**No backend server needed!** Cloudflare Pages Functions dynamically list episodes from R2. Just upload MP3s and they appear on the site.

This is the simplest possible architecture:
1. Static PWA frontend
2. Serverless API (Pages Functions)
3. R2 storage
4. Python script for downloads

Everything free. Everything automatic. Works like a glove.