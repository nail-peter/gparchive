# GP Archive - Hosted Version

Anonymous, privacy-focused Gilles Peterson archive PWA optimized for cloud hosting.

## Architecture (Option A - Free Tier)

```
User → Cloudflare Pages (Frontend PWA)
     → Cloudflare R2 (Audio file storage)
     → Railway/Render Free (Metadata API)
```

## Features

- Progressive Web App (PWA) - installable on iOS/Android
- Audio streaming from Cloudflare R2 (zero egress fees)
- Lightweight API for episode metadata
- No authentication (public access)
- Mobile-first responsive design

## Cost Breakdown

| Service | Usage | Cost |
|---------|-------|------|
| Cloudflare Pages | Frontend hosting | $0 |
| Cloudflare R2 | Audio storage (10GB free) | $0 |
| Railway/Render | API (500hrs/month free) | $0 |
| Domain (.xyz) | Optional | $2/year |
| **Total** | | **$0-2/year** |

## Privacy & Anonymity

This fork is designed for anonymous deployment:

- All personal information stripped from code
- No hardcoded credentials or usernames
- Git history sanitized
- Deploy via VPN/Tor
- Use privacy-focused domain registrar (Njalla)
- Pay with cryptocurrency where possible

## Structure

```
gp_proxy_hosted/
├── api/          # Node.js API for Railway/Render
├── frontend/     # Static PWA for Cloudflare Pages
├── docs/         # Deployment guides
└── README.md
```

## Deployment Guide

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for step-by-step instructions.

## Differences from Local Version

**Removed:**
- HTTP Basic Authentication
- Server-side DLNA/UPnP casting
- Local file serving
- Download functionality

**Added:**
- Cloudflare R2 integration
- Lightweight metadata API
- Public access (no auth)
- CDN optimization

## Legal Notice

This project is for educational purposes. Ensure you have rights to host any content you upload. The maintainer assumes no liability for how this software is used.
