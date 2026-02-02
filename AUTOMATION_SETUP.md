# Automated Weekly Download Setup

This guide will help you set up automated weekly downloads of Gilles Peterson episodes.

## Prerequisites

1. **CyberGhost VPN** - Must be connected to UK server
2. **Python packages** installed:
   ```bash
   pip install yt-dlp boto3
   ```

## How It Works

The `auto_download_weekly.py` script:
1. ✅ Finds the latest Gilles Peterson episode on BBC Sounds
2. ✅ Checks if it already exists in your R2 bucket (skips if yes)
3. ✅ Downloads the episode using yt-dlp (requires UK VPN)
4. ✅ Renames it to format: `YYYY-MM-DD Gilles Peterson - Title.mp3`
5. ✅ Uploads directly to Cloudflare R2
6. ✅ Deletes local file after successful upload

## Manual Test First

Before setting up automation, test it manually:

1. **Connect CyberGhost to UK server**

2. **Run the script:**
   ```bash
   cd C:\Users\schmi\Downloads\gp_proxy_hosted
   python auto_download_weekly.py
   ```

3. **Check the output** - it should download and upload the latest episode

## Windows Task Scheduler Setup

### Option A: Quick Setup (Recommended)

1. **Create a batch file** `run_gp_download.bat`:
   ```batch
   @echo off
   cd C:\Users\schmi\Downloads\gp_proxy_hosted
   python auto_download_weekly.py > logs\download_%date:~-4,4%%date:~-7,2%%date:~-10,2%.log 2>&1
   ```

2. **Save it** in `C:\Users\schmi\Downloads\gp_proxy_hosted\`

3. **Create logs folder:**
   ```bash
   mkdir logs
   ```

4. **Open Task Scheduler:**
   - Press `Win + R`
   - Type: `taskschd.msc`
   - Press Enter

5. **Create Task:**
   - Click "Create Basic Task"
   - Name: `GP Archive Weekly Download`
   - Description: `Automatically downloads latest Gilles Peterson episode`

6. **Set Trigger:**
   - Trigger: `Weekly`
   - Start: `Saturday`
   - Time: `6:00 PM` (or whenever you prefer)
   - Recur every: `1 weeks`

7. **Set Action:**
   - Action: `Start a program`
   - Program/script: `C:\Users\schmi\Downloads\gp_proxy_hosted\run_gp_download.bat`

8. **Settings:**
   - ✅ Run whether user is logged on or not
   - ✅ Run with highest privileges
   - ✅ If task fails, restart every: `1 hour`, up to `3 times`

9. **Save** and enter your Windows password when prompted

### Option B: Manual Task Scheduler Configuration

1. Open Task Scheduler (`taskschd.msc`)
2. Click "Create Task" (not Basic Task)
3. **General Tab:**
   - Name: `GP Archive Weekly Download`
   - ✅ Run whether user is logged on or not
   - ✅ Run with highest privileges

4. **Triggers Tab:**
   - Click "New"
   - Begin the task: `On a schedule`
   - Settings: `Weekly`
   - Days: `Saturday`
   - Time: `6:00 PM`
   - Click OK

5. **Actions Tab:**
   - Click "New"
   - Action: `Start a program`
   - Program: `python`
   - Arguments: `auto_download_weekly.py`
   - Start in: `C:\Users\schmi\Downloads\gp_proxy_hosted`
   - Click OK

6. **Conditions Tab:**
   - ✅ Wake the computer to run this task
   - ⬜ Start the task only if the computer is on AC power (uncheck if laptop)

7. **Settings Tab:**
   - ✅ Allow task to be run on demand
   - ✅ If the task fails, restart every: `1 hour`, `3` times
   - If running task does not end when requested: `Stop the existing instance`

8. Click OK and save

## Important Notes

### CyberGhost Must Be Connected

**The script requires UK VPN connection to download from BBC.**

Options:
1. **Manual:** Keep CyberGhost connected to UK server 24/7
2. **Auto-connect:** Use CyberGhost's auto-connect feature
3. **Script enhancement:** Modify batch file to connect CyberGhost first (see below)

### Auto-Connect CyberGhost (Advanced)

If CyberGhost has a command-line interface, you can modify `run_gp_download.bat`:

```batch
@echo off
REM Connect to CyberGhost UK (adjust path and command as needed)
"C:\Program Files\CyberGhost 8\CyberGhost.exe" --connect --country-code UK --wait

REM Wait for connection
timeout /t 10

REM Run download script
cd C:\Users\schmi\Downloads\gp_proxy_hosted
python auto_download_weekly.py > logs\download_%date:~-4,4%%date:~-7,2%%date:~-10,2%.log 2>&1

REM Optionally disconnect after
REM "C:\Program Files\CyberGhost 8\CyberGhost.exe" --disconnect
```

**Note:** Check CyberGhost's documentation for exact CLI commands.

## Testing the Task

1. **Right-click** the task in Task Scheduler
2. Click **"Run"**
3. Check the logs in `C:\Users\schmi\Downloads\gp_proxy_hosted\logs\`

## Viewing Logs

Logs are saved to `logs/download_YYYYMMDD.log`

To view recent log:
```bash
cd C:\Users\schmi\Downloads\gp_proxy_hosted\logs
type download_*.log | more
```

## Troubleshooting

### "Download failed: HTTP Error 403"
- **Cause:** VPN not connected to UK
- **Fix:** Ensure CyberGhost is connected to UK server

### "Episode already exists in R2"
- **Normal behavior** - script skips re-downloading existing episodes

### Task doesn't run
- Check Task Scheduler History (enable it under Actions → Enable All Tasks History)
- Make sure your PC is on at scheduled time
- Check Windows Power Settings (prevent sleep during task)

### Script hangs
- Increase timeout in script (currently 10 minutes)
- Check internet connection

## Recommended: Keep PC Awake

If you want this to run reliably:

1. **Prevent sleep:**
   - Settings → System → Power & Sleep
   - When plugged in, PC sleeps after: `Never`

2. **Or:** Enable "Wake timers"
   - Control Panel → Power Options → Change plan settings
   - Change advanced power settings
   - Sleep → Allow wake timers → `Enable`

## Summary

✅ Script runs every Saturday at 6 PM
✅ Automatically finds latest episode
✅ Downloads only if new
✅ Uploads to R2
✅ Cleans up local files
✅ Logs everything

**Cost:** $0 (uses your CyberGhost subscription)

Enjoy your automated archive!
