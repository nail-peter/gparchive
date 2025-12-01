# Project Structure

## Core Files

```
gp_proxy/
├── download-bbc-authenticated.js  # Main download script (USE THIS)
├── test-uk-access.js              # Test UK VPN/proxy connection
├── index.js                       # RadioArchiver base class
├── bbc-downloader.js              # BBC-specific downloader class
├── package.json                   # Dependencies
└── .env                           # Your credentials (gitignored)
```

## Documentation

```
├── README.md                      # Main documentation
├── BBC_DOWNLOAD_GUIDE.md         # Detailed BBC download guide with learnings
└── PROJECT_STRUCTURE.md          # This file
```

## Directories

```
├── archive/                      # Downloaded MP3 files (gitignored)
├── node_modules/                 # NPM dependencies (gitignored)
└── .claude/                      # Claude Code configuration
```

## Configuration Files

```
├── .env                          # Your credentials (KEEP PRIVATE!)
├── .env.example                  # Template for .env
├── .gitignore                    # Git ignore rules
└── package-lock.json             # Locked dependency versions
```

## What Each File Does

### `download-bbc-authenticated.js`
**Purpose:** Main script for downloading BBC shows
**Usage:** `node download-bbc-authenticated.js "BBC_URL"`
**Features:**
- Reads BBC credentials from `.env`
- Uses yt-dlp for downloading
- Automatic MP3 conversion at 320kbps
- Works with `/programmes/` URLs

### `test-uk-access.js`
**Purpose:** Verify UK VPN/proxy is working
**Usage:** `npm run test-vpn` or `node test-uk-access.js`
**Checks:**
- Current IP location
- BBC Sounds accessibility
- UK geo-location detection

### `index.js`
**Purpose:** Base RadioArchiver class
**Features:**
- Proxy agent setup
- HTTP requests with proxy support
- Archive directory management
- Automatic MP3 conversion via FFmpeg

### `bbc-downloader.js`
**Purpose:** BBC-specific downloader (extends RadioArchiver)
**Features:**
- Episode ID extraction
- Dynamic build ID fetching
- HTML/JSON parsing for media URLs
- Note: For BBC Sounds, use yt-dlp instead (via download-bbc-authenticated.js)

## Dependencies (Production Only)

All listed in `package.json`:
- **axios** - HTTP client
- **dotenv** - Environment variable management
- **fs-extra** - Enhanced file system operations
- **https-proxy-agent** - Proxy support for HTTPS

## Removed Files (Cleanup)

Previously had, now removed:
- ❌ `download.js` - Old scheduler (not needed)
- ❌ `download.bat` - Old batch file
- ❌ `bbc-sounds-stream.js` - Failed experiment
- ❌ `get-media-url.js` - Failed experiment
- ❌ `google_drive_uploader.py` - Google Drive integration
- ❌ `weekly-download.py` - Google Drive integration
- ❌ `GOOGLE_DRIVE_SETUP.md` - Google Drive docs
- ❌ `node-cron` dependency - Not needed for BBC Sounds
- ❌ `cheerio` dependency - Not needed for current workflow
- ❌ `yt-dlp-wrap` dependency - Direct Python yt-dlp is better

## Environment Variables

Required in `.env`:
```env
USE_VPN=true                      # true for VPN, false for HTTP proxy
BBC_EMAIL=your-email@example.com  # BBC account email
BBC_PASSWORD=your-password        # BBC account password
ARCHIVE_DIR=./archive             # Where to save MP3 files
```

Optional (only if using HTTP proxy):
```env
PROXY_HOST=proxy.example.com
PROXY_PORT=80
PROXY_USERNAME=your-username
PROXY_PASSWORD=your-password
```

## Typical Workflow

1. Connect UK VPN
2. Test: `npm run test-vpn`
3. Download: `npm run download "https://www.bbc.co.uk/programmes/EPISODE_ID"`
4. Wait 45-50 minutes for 3-hour show
5. Find MP3 in `./archive/`

## File Naming Convention

Downloaded files are automatically named by yt-dlp:
```
archive/
├── Gilles Peterson, Charlotte Dos Santos.mp3
└── Other Show, Episode Title.mp3
```

## Storage Requirements

- ~140-150 MB per hour of audio (320kbps MP3)
- 3-hour show ≈ 430 MB
- 10 shows ≈ 4.3 GB

## Security Notes

**Never commit to git:**
- `.env` file (contains credentials)
- `archive/` directory (copyrighted content)
- Any files with credentials/tokens

**Keep private:**
- BBC account password
- VPN/proxy credentials
- Downloaded content (personal use only)

## Maintenance

### Update yt-dlp monthly:
```bash
pip install --upgrade yt-dlp
```

### Update Node dependencies:
```bash
npm update
```

### Clear old downloads:
```bash
# Be careful - this deletes everything in archive!
rm archive/*.mp3
```

## Quick Reference

| Task | Command |
|------|---------|
| Install | `npm install` |
| Test VPN | `npm run test-vpn` |
| Download | `npm run download URL` |
| Update yt-dlp | `pip install --upgrade yt-dlp` |
| Check location | `curl -s "http://ip-api.com/json/"` |

---

**Last Updated:** 2025-10-29
**Project Status:** Clean, minimal, focused on BBC downloads
