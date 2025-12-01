# BBC Sounds Download Guide

## Critical Learnings & Best Practices

### ✅ What Works

#### 1. **Use BBC Programmes URL Format (NOT BBC Sounds URL)**
- ❌ **DOES NOT WORK**: `https://www.bbc.co.uk/sounds/play/m002l17p`
- ✅ **WORKS**: `https://www.bbc.co.uk/programmes/m002l17p`

**Why?** The `/programmes/` endpoint works with yt-dlp's BBC extractor, while `/sounds/play/` endpoint uses a newer format that yt-dlp cannot parse.

#### 2. **UK VPN is Required**
- BBC content is geo-restricted to UK only
- VPN must show as United Kingdom (GB)
- Test your location: `curl -s "http://ip-api.com/json/" | grep country`
- If not showing as UK, switch your VPN server to a UK location

#### 3. **BBC Account Authentication Required**
- BBC Sounds requires a BBC account (free to create)
- Store credentials in `.env` file:
  ```
  BBC_EMAIL=your-email@example.com
  BBC_PASSWORD=your-password
  ```
- yt-dlp will automatically login before downloading

#### 4. **Automatic MP3 Conversion**
- All downloads are automatically converted to MP3 at 320kbps
- FFmpeg handles the conversion (must be installed)
- Temporary files are cleaned up after conversion

### 🚫 What Doesn't Work

#### 1. **BBC Sounds URLs Directly**
- The new BBC Sounds website uses DRM for downloads
- yt-dlp's BBC Sounds extractor is outdated and broken
- Direct download URLs return `null` even with UK VPN
- **Solution**: Convert to `/programmes/` URL format

#### 2. **Downloads Without Authentication**
- BBC Sounds requires login to access media streams
- Anonymous requests return 404 or playlist extraction errors
- **Solution**: Always provide BBC account credentials

#### 3. **Non-UK IP Addresses**
- Downloads fail with "media not available" or 404 errors
- Using proxies can work but VPN is more reliable
- **Solution**: Connect to UK VPN before downloading

### 📝 Quick Start Guide

#### Setup (One-time)
1. Install yt-dlp: `pip install yt-dlp`
2. Install FFmpeg: `winget install ffmpeg`
3. Create BBC account: https://www.bbc.co.uk/account/register
4. Connect to UK VPN server
5. Add credentials to `.env`:
   ```env
   USE_VPN=true
   BBC_EMAIL=your-email@example.com
   BBC_PASSWORD=your-password
   ARCHIVE_DIR=./archive
   ```

#### Download a Show
```bash
# Use the authenticated download script
node download-bbc-authenticated.js "https://www.bbc.co.uk/programmes/EPISODE_ID"

# Or use yt-dlp directly
python -m yt_dlp \
  --username "your-email@example.com" \
  --password "your-password" \
  -x --audio-format mp3 --audio-quality 320K \
  -o "./archive/%(title)s.%(ext)s" \
  "https://www.bbc.co.uk/programmes/EPISODE_ID"
```

### 🔍 Finding Episode IDs

#### From BBC Sounds URL
If you have: `https://www.bbc.co.uk/sounds/play/m002l17p`
- Extract the ID: `m002l17p`
- Convert to programmes URL: `https://www.bbc.co.uk/programmes/m002l17p`

#### From Browser
1. Visit the BBC Sounds episode page
2. Look in the URL bar for the episode ID (usually starts with `m` or `b`)
3. Construct: `https://www.bbc.co.uk/programmes/[ID]`

### 🛠️ Troubleshooting

#### "Unable to extract playlist data"
- ❌ You're using `/sounds/play/` URL
- ✅ Convert to `/programmes/` URL format

#### "404 Not Found" or "This content doesn't seem to be available"
- Check VPN is connected to UK server
- Verify: `curl -s "http://ip-api.com/json/" | grep countryCode`
- Should show: `"countryCode":"GB"`

#### "Authentication failed"
- Verify BBC credentials are correct
- Try logging into https://www.bbc.co.uk manually first
- Check `.env` file has correct email/password

#### Download is very slow
- BBC throttles download speeds (~150-200 KB/s is normal)
- A 3-hour show (431MB) takes ~45-50 minutes
- This is normal behavior, be patient

#### "FFmpeg not found" during conversion
- Install FFmpeg: `winget install ffmpeg`
- Restart terminal after installation
- Verify: `ffmpeg -version`

### 📊 Expected Performance

- **Download Speed**: 130-200 KB/s (throttled by BBC)
- **File Size**: ~140-150 MB per hour of audio
- **3-hour show**: ~431 MB, ~45-50 minutes download time
- **Conversion Time**: 1-2 minutes after download completes

### 🔐 Security Notes

- **Never commit** `.env` file with credentials to git
- Add `.env` to `.gitignore`
- Use strong, unique password for BBC account
- VPN credentials should also be kept secure
- Consider using environment variables instead of `.env` in production

### 📦 File Structure

```
gp_proxy/
├── .env                           # Your credentials (keep private!)
├── BBC_DOWNLOAD_GUIDE.md         # This file
├── download-bbc-authenticated.js  # Easy download script
├── archive/                       # Downloaded MP3 files
│   └── Gilles Peterson, Charlotte Dos Santos.mp3
└── node_modules/
```

### 🎯 Example Workflow

```bash
# 1. Connect UK VPN
# 2. Find episode on BBC Sounds website
# 3. Copy episode ID from URL (e.g., m002l17p)
# 4. Download using programmes URL:

node download-bbc-authenticated.js "https://www.bbc.co.uk/programmes/m002l17p"

# 5. Wait 45-50 minutes for 3-hour show
# 6. Find MP3 in ./archive/ folder
```

### 💡 Pro Tips

1. **Batch Downloads**: You can queue multiple episodes - yt-dlp will download them sequentially
2. **Better Quality**: Some shows have higher bitrates available, yt-dlp auto-selects best
3. **Resume Capability**: If download fails, yt-dlp can resume from where it stopped
4. **Metadata**: Downloaded files include title, show name, and episode info
5. **File Naming**: Files are auto-named with show and episode details

### 🔄 Alternative Methods

If yt-dlp stops working:

#### Option 1: Record Stream in Browser
- Use Audacity to record system audio
- Play episode in browser while recording
- Export as MP3

#### Option 2: BBC Sounds Mobile App
- Official download feature with DRM
- Only works on mobile/tablet
- Files only playable in app

#### Option 3: Streamlink
- `streamlink --output "file.mp4" BBC_URL best`
- Then convert with FFmpeg
- May work when yt-dlp doesn't

### 📚 Useful Commands

```bash
# Test UK VPN connection
node test-uk-access.js

# Quick location check
curl -s "http://ip-api.com/json/"

# Update yt-dlp (recommended monthly)
python -m pip install --upgrade yt-dlp

# Check FFmpeg version
ffmpeg -version

# List downloaded files
ls -lh ./archive/

# Test download with verbose output
python -m yt_dlp --verbose "https://www.bbc.co.uk/programmes/EPISODE_ID"
```

### 🐛 Known Issues

1. **yt-dlp BBC Sounds extractor is broken** - Use `/programmes/` URLs instead
2. **Slow downloads** - This is BBC throttling, no workaround
3. **Cookie extraction fails on Windows** - Use direct authentication instead
4. **Build ID changes** - Script auto-fetches current build ID now

---

## Summary for Next Time

**The Quick Answer:**
1. ✅ Connect UK VPN
2. ✅ Use `/programmes/` URL (NOT `/sounds/play/`)
3. ✅ Authenticate with BBC account credentials
4. ✅ Use yt-dlp (not custom scrapers)
5. ✅ Be patient - downloads take 45-50 minutes for 3-hour shows

**Don't Waste Time On:**
- ❌ Trying to scrape BBC Sounds JSON data (file_url is always null)
- ❌ Using BBC media selector APIs (requires tokens/auth we can't get)
- ❌ Trying generic extractors (won't find media URLs)
- ❌ Building custom downloaders (yt-dlp already works with `/programmes/`)

**Last Updated:** 2025-10-29
