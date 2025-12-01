# BBC Radio Downloader

A streamlined tool for downloading BBC Radio shows using yt-dlp with UK VPN/proxy support.

## Prerequisites

1. **FFmpeg** (for automatic MP3 conversion)
   ```bash
   winget install ffmpeg
   # Or download from: https://ffmpeg.org/download.html
   ```

2. **Python with yt-dlp**
   ```bash
   pip install yt-dlp
   ```

3. **UK VPN** or UK proxy service
   - VPN recommended (NordVPN, ExpressVPN, ProtonVPN, etc.)
   - Must show as United Kingdom (GB)

4. **BBC Account** (free)
   - Register at: https://www.bbc.co.uk/account/register

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` with your credentials:**
   ```env
   # VPN Mode (recommended)
   USE_VPN=true

   # BBC Account (required)
   BBC_EMAIL=your-email@example.com
   BBC_PASSWORD=your-password

   # Archive directory
   ARCHIVE_DIR=./archive
   ```

4. **Connect to UK VPN server**

5. **Test connection:**
   ```bash
   npm run test-vpn
   # Should show: "Country: United Kingdom (GB)"
   ```

## Usage

### Download a BBC Show
```bash
# Using npm script
npm run download "https://www.bbc.co.uk/programmes/EPISODE_ID"

# Or directly
node download-bbc-authenticated.js "https://www.bbc.co.uk/programmes/m002l17p"
```

### Test VPN Connection
```bash
npm run test-vpn
```

## BBC Sounds Download (IMPORTANT - Read This First!)

### ✅ What Works - Critical Information

**Always use the `/programmes/` URL format, NOT `/sounds/play/`:**
- ❌ **BROKEN**: `https://www.bbc.co.uk/sounds/play/m002l17p`
- ✅ **WORKS**: `https://www.bbc.co.uk/programmes/m002l17p`

**Why?** The BBC Sounds website uses a new format that download tools cannot parse. The older `/programmes/` endpoint still works with yt-dlp.

### Required Setup for BBC Downloads

1. **UK VPN Required** - BBC content is geo-restricted
   - Connect to UK VPN server before downloading
   - Test location: `curl -s "http://ip-api.com/json/" | grep countryCode`
   - Must show `"countryCode":"GB"`

2. **BBC Account Required** - Authentication mandatory
   - Create free account: https://www.bbc.co.uk/account/register
   - Add credentials to `.env`:
     ```env
     BBC_EMAIL=your-email@example.com
     BBC_PASSWORD=your-password
     ```

3. **Use yt-dlp (Not Custom Scripts)** - Already handles authentication and download
   ```bash
   # Easiest method - use the authenticated script
   node download-bbc-authenticated.js "https://www.bbc.co.uk/programmes/EPISODE_ID"

   # Or use yt-dlp directly
   python -m yt_dlp --username "email" --password "pass" \
     -x --audio-format mp3 --audio-quality 320K \
     -o "./archive/%(title)s.%(ext)s" \
     "https://www.bbc.co.uk/programmes/EPISODE_ID"
   ```

### Quick Download Guide

1. Connect UK VPN
2. Find episode on BBC Sounds (e.g., `https://www.bbc.co.uk/sounds/play/m002l17p`)
3. Extract ID (`m002l17p`) and convert to: `https://www.bbc.co.uk/programmes/m002l17p`
4. Run: `node download-bbc-authenticated.js "https://www.bbc.co.uk/programmes/m002l17p"`
5. Wait ~45-50 minutes for a 3-hour show (BBC throttles speed)
6. MP3 saved to `./archive/` automatically

### Troubleshooting

- **"Unable to extract playlist data"** → You're using `/sounds/play/` URL, switch to `/programmes/`
- **"404 Not Found"** → VPN not connected to UK or not working
- **"Authentication failed"** → Check BBC credentials in `.env`
- **Very slow download** → Normal, BBC throttles to ~150 KB/s

### Important Notes

- ⚠️ **Don't try to scrape BBC Sounds JSON** - `file_url` is always `null` (DRM protected)
- ⚠️ **Don't build custom downloaders** - yt-dlp already works with `/programmes/` URLs
- ⚠️ **Automatic MP3 conversion** - All downloads convert to 320kbps MP3 automatically
- ✅ **Downloads are legal** - For personal use only with BBC account authentication

**Full details:** See [BBC_DOWNLOAD_GUIDE.md](BBC_DOWNLOAD_GUIDE.md)

## Notes

- Archived files are stored in `./archive` directory
- Schedule is saved in `./archive/schedule.json`
- Supports .mp3, .m4a, and .wav formats
- Respects file size limits (configurable)
- User-Agent spoofing for better compatibility
- FFmpeg automatically converts all downloads to MP3 (320kbps)