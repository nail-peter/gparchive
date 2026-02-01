# Audio Player Setup Guide

A minimal, private audio player for sharing BBC Radio downloads with friends. Features password protection and iPhone app installation (PWA).

## Features

- **Password Protected**: Basic authentication prevents unauthorized access
- **Private Files**: Audio files NOT publicly scannable or indexed
- **iPhone App**: Install as standalone app on iPhone (PWA)
- **Minimal Design**: Clean, black & white interface
- **Auto-Play**: Most recent episode starts automatically
- **Download**: Download episodes directly to device
- **Low Cost**: Self-hosted, no ongoing fees

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This adds Express.js for the web server.

### 2. Configure Authentication

Edit `.env` and set strong credentials:

```env
# Audio Player Server Settings
PORT=3000
PLAYER_USERNAME=your-username
PLAYER_PASSWORD=your-strong-password
```

**IMPORTANT**: Change these default credentials!

### 3. Start the Server

```bash
npm start
```

Server runs at: `http://localhost:3000`

### 4. Test Locally

1. Open browser to: `http://localhost:3000`
2. Enter username/password when prompted
3. Should see episode list and player

## Installing on iPhone (PWA)

### Requirements
- iOS 16.4+ (for best PWA support)
- Server must be HTTPS (not localhost)

### Installation Steps

1. Open Safari on iPhone (must use Safari, not Chrome)
2. Navigate to your server URL
3. Enter username/password
4. Tap Share button (square with arrow)
5. Scroll down and tap "Add to Home Screen"
6. Name it "GP Archive" (or whatever you prefer)
7. Tap "Add"

The app icon appears on home screen like a native app!

## Deployment Options

### Option 1: Home Server (Free)

**Best for**: Technical users with existing home server/PC

**Pros**:
- Completely free
- Full control
- Files stay on your network

**Cons**:
- Requires always-on computer
- Need to setup port forwarding
- Need dynamic DNS or static IP
- Need SSL certificate (Let's Encrypt is free)

**Setup**:
1. Run server on home PC/Raspberry Pi
2. Setup port forwarding (router forwards port 443 to your server)
3. Use DuckDNS or No-IP for free dynamic DNS
4. Setup SSL with Let's Encrypt (free)
5. Share your domain with friends: `https://yourname.duckdns.org`

### Option 2: DigitalOcean/Linode ($5/month)

**Best for**: Simple, reliable hosting

**Pros**:
- Always available
- Easy setup
- Automatic SSL
- $5-6/month for basic droplet

**Cons**:
- Monthly cost
- Need to manage Linux server

**Setup**:
1. Create DigitalOcean droplet (Ubuntu)
2. SSH into server
3. Install Node.js: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`
4. Clone/upload your project files
5. Install dependencies: `npm install`
6. Install PM2 (keeps server running): `npm install -g pm2`
7. Start server: `pm2 start server.js --name gp-player`
8. Setup SSL with Certbot (free)
9. Configure firewall to allow port 80/443

### Option 3: Railway.app (~$5/month)

**Best for**: Zero server management

**Pros**:
- Extremely easy deployment
- Automatic HTTPS
- No server management
- Git-based deployment

**Cons**:
- ~$5/month after free tier
- Files must be uploaded to server

**Setup**:
1. Create account at railway.app
2. Create new project
3. Connect GitHub repo or upload files
4. Add environment variables (from `.env`)
5. Deploy - Railway handles everything
6. Get your URL: `https://yourapp.railway.app`

### Option 4: Vercel/Netlify (Free tier possible)

**Note**: These are designed for static sites. For audio streaming with auth, you'd need to modify the approach (use serverless functions + external storage like S3). More complex setup.

## Security Notes

### Authentication
- Uses HTTP Basic Authentication
- Browser remembers credentials per session
- Not as secure as OAuth, but simple and effective
- **Must use HTTPS in production** (credentials sent in headers)

### File Privacy
- Files served only to authenticated users
- Not indexed by search engines (robots.txt + auth)
- No direct file URLs without authentication
- DRM flags on files don't matter - you control access

### Recommendations
1. Use HTTPS in production (required for PWA + security)
2. Use strong, unique passwords
3. Change default credentials immediately
4. Consider IP whitelisting for extra security
5. Don't share credentials publicly

## File Structure

```
gp_proxy/
├── server.js              # Express server with auth
├── public/                # Web files (protected by auth)
│   ├── index.html        # Main player interface
│   ├── style.css         # Minimal black/white styling
│   ├── app.js            # Player logic
│   ├── manifest.json     # PWA config
│   ├── sw.js             # Service worker (offline support)
│   ├── icon-192.png      # PWA icon (you need to create)
│   └── icon-512.png      # PWA icon (you need to create)
├── archive/              # MP3 files (served via auth)
└── .env                  # Credentials (NEVER commit!)
```

## Creating PWA Icons

You need two icon files for the app:

### Quick Method - Online Tool
1. Visit: https://www.favicon-generator.org/
2. Upload image or create simple design
3. Download 192x192 and 512x512 PNG files
4. Rename to `icon-192.png` and `icon-512.png`
5. Place in `public/` folder

### Design Suggestion
- Black background (#000000)
- White "GP" text in center
- Or use 🎵 emoji on black background

### Temporary Workaround
The app works without icons - iPhone will use a screenshot of the page. Add proper icons later.

## Usage Guide for Friends

### First Time Setup
1. Open Safari on iPhone
2. Visit: `https://your-server.com`
3. Enter username and password (you provide these)
4. Tap Share → Add to Home Screen
5. Tap the new "GP Archive" icon on home screen

### Playing Episodes
- App opens to most recent episode (auto-plays)
- Scroll down to see all episodes
- Tap any episode to play
- Use download button to save to device

### Offline Use
- Once installed, the app interface works offline
- Episodes must be downloaded to play offline
- Use download button to save episodes locally

## Troubleshooting

### "Failed to load episodes"
- Check server is running: `npm start`
- Check firewall allows connections
- Check authentication credentials

### PWA won't install on iPhone
- Must use Safari (not Chrome)
- Must be HTTPS (not HTTP or localhost)
- Clear Safari cache and try again
- iOS 16.4+ required for best support

### Audio won't play
- Check file exists in `archive/` folder
- Check file permissions (readable by server)
- Check browser console for errors (F12)
- Try different browser

### Authentication not working
- Check username/password in `.env`
- Restart server after changing `.env`
- Clear browser cache/cookies
- Try incognito/private mode

### Very slow loading
- Large file sizes normal (430MB for 3-hour show)
- First play streams from server (doesn't download entire file)
- Use download button for faster subsequent plays

## Maintenance

### Adding New Episodes
1. Download new episode: `npm run download "BBC_URL"`
2. Server automatically detects new MP3 in `archive/`
3. Refresh player to see new episode
4. No restart needed

### Updating Player
1. Stop server: `pm2 stop gp-player` (or Ctrl+C)
2. Update files
3. Restart: `npm start` or `pm2 restart gp-player`

### Backup
```bash
# Backup archive folder
tar -czf archive-backup-$(date +%Y%m%d).tar.gz archive/

# Backup to cloud (optional)
# Use rclone, rsync, or manual upload
```

## Cost Estimates

### Home Server
- **Hardware**: $0 (existing PC) to $50 (Raspberry Pi)
- **Internet**: $0 (existing connection)
- **Domain**: $0 (DuckDNS) to $12/year
- **SSL**: $0 (Let's Encrypt)
- **Total**: $0-50 one-time

### DigitalOcean
- **Server**: $6/month (basic droplet)
- **Domain**: $12/year (optional, can use IP)
- **SSL**: $0 (Let's Encrypt)
- **Total**: ~$6/month

### Railway.app
- **Hosting**: $5/month (after free tier)
- **Domain**: $0 (included subdomain)
- **SSL**: $0 (automatic)
- **Total**: ~$5/month

## Privacy & Legal

### Your Responsibility
- BBC content downloaded for personal use
- Sharing with friends in small group = grey area
- NOT for public distribution or commercial use
- Password protection shows intent to keep private
- Files not publicly searchable/indexed

### DRM Concerns
- Downloaded MP3s may have metadata flags
- Password protection prevents public scanning
- Files only accessible to authenticated users
- Not scraped by bots or search engines
- You control who has access

### Recommendation
- Keep to small friend group
- Don't share credentials widely
- Don't post URLs publicly
- Use as intended: private archive

## Support

### Check Server Status
```bash
# Is server running?
curl http://localhost:3000/api/episodes -u username:password

# Check logs (PM2)
pm2 logs gp-player

# Check logs (manual)
# View terminal where you ran `npm start`
```

### Common Commands
```bash
# Start server
npm start

# Start with PM2 (stays running)
pm2 start server.js --name gp-player

# Stop PM2
pm2 stop gp-player

# Restart PM2
pm2 restart gp-player

# View logs
pm2 logs gp-player

# Start on boot
pm2 startup
pm2 save
```

## Next Steps

1. **Install Dependencies**: `npm install`
2. **Change Default Password**: Edit `.env`
3. **Test Locally**: `npm start` → `http://localhost:3000`
4. **Create Icons**: See "Creating PWA Icons" section
5. **Choose Deployment**: Pick option that fits your needs
6. **Deploy**: Follow deployment guide for your choice
7. **Test on iPhone**: Install as PWA
8. **Share with Friends**: Provide URL + credentials

---

**Last Updated**: 2025-10-29
**Status**: Ready to deploy
