"""
Automated Weekly Download Script for Gilles Peterson Archive
Finds, downloads, renames, and uploads the latest episode to R2

Usage:
    python auto_download_weekly.py

Requirements:
    - CyberGhost VPN connected to UK
    - yt-dlp installed: pip install yt-dlp
    - boto3 installed: pip install boto3
"""

import subprocess
import json
import boto3
from pathlib import Path
from datetime import datetime
import sys

# Set UTF-8 encoding for console output
sys.stdout.reconfigure(encoding='utf-8')

# Cloudflare R2 credentials
ACCESS_KEY = "3fe1d0fac3028b108dfb1434fbeda5ab"
SECRET_KEY = "7e39e93560a2555e2e20c57a6ea094746212d3360ee13395d8ddb40c69924516"
ACCOUNT_ID = "daa5cfc7d0326ab77077899860d9ae03"
BUCKET_NAME = "gparchive"
ENDPOINT_URL = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"

# BBC Programme ID for Gilles Peterson
GP_PROGRAMME_ID = "b01fm4ss"

# Download directory
DOWNLOAD_DIR = Path(__file__).parent / "downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)


def log(message):
    """Print with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")


def find_latest_episode():
    """Find the latest Gilles Peterson episode using BBC API"""
    log("Searching for latest episode...")

    # Use yt-dlp to get the latest episode info
    url = f"https://www.bbc.co.uk/programmes/{GP_PROGRAMME_ID}/episodes/player"

    try:
        result = subprocess.run(
            ['python', '-m', 'yt_dlp', '--playlist-items', '1', '--dump-json', '--skip-download', url],
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode != 0:
            log(f"Error finding episode: {result.stderr}")
            return None

        # Parse the first line of JSON output
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                data = json.loads(line)
                episode_id = data.get('id')
                title = data.get('title', 'Gilles Peterson')
                upload_date = data.get('upload_date', '')

                # Format date from YYYYMMDD to YYYY-MM-DD
                if upload_date and len(upload_date) == 8:
                    formatted_date = f"{upload_date[0:4]}-{upload_date[4:6]}-{upload_date[6:8]}"
                else:
                    formatted_date = datetime.now().strftime("%Y-%m-%d")

                log(f"Found: {title}")
                log(f"Date: {formatted_date}")
                log(f"Episode ID: {episode_id}")

                return {
                    'id': episode_id,
                    'title': title,
                    'date': formatted_date,
                    'url': f"https://www.bbc.co.uk/programmes/{episode_id}"
                }

        log("No episode data found")
        return None

    except Exception as e:
        log(f"Error finding latest episode: {e}")
        return None


def check_if_exists_in_r2(filename):
    """Check if file already exists in R2 bucket"""
    try:
        s3_client = boto3.client(
            's3',
            endpoint_url=ENDPOINT_URL,
            aws_access_key_id=ACCESS_KEY,
            aws_secret_access_key=SECRET_KEY,
            region_name='auto'
        )

        s3_client.head_object(Bucket=BUCKET_NAME, Key=filename)
        return True
    except:
        return False


def download_episode(episode):
    """Download episode using yt-dlp"""
    log("Downloading episode...")

    # Generate filename: YYYY-MM-DD Gilles Peterson - Title.mp3
    # Clean the title
    clean_title = episode['title'].replace('Gilles Peterson, ', '').replace('Gilles Peterson: ', '')
    clean_title = clean_title.strip()

    # Remove date patterns like "10⧸01⧸2026" from title
    import re
    clean_title = re.sub(r'\d{2}⧸\d{2}⧸\d{4}', '', clean_title).strip()

    # Generate filename
    if clean_title and clean_title != 'Gilles Peterson':
        filename = f"{episode['date']} Gilles Peterson - {clean_title}.mp3"
    else:
        filename = f"{episode['date']} Gilles Peterson.mp3"

    # Remove invalid filename characters
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)

    # Check if already exists
    if check_if_exists_in_r2(filename):
        log(f"Episode already exists in R2: {filename}")
        return None

    output_path = DOWNLOAD_DIR / filename

    # Download with yt-dlp
    try:
        result = subprocess.run(
            [
                'python', '-m', 'yt_dlp',
                '--format', 'bestaudio',
                '--extract-audio',
                '--audio-format', 'mp3',
                '--output', str(output_path),
                episode['url']
            ],
            capture_output=True,
            text=True,
            timeout=600  # 10 minute timeout
        )

        if result.returncode != 0:
            log(f"Download failed: {result.stderr}")
            return None

        if output_path.exists():
            size_mb = output_path.stat().st_size / (1024 * 1024)
            log(f"Downloaded: {filename} ({size_mb:.1f} MB)")
            return output_path
        else:
            log("Download failed: file not found")
            return None

    except Exception as e:
        log(f"Error downloading: {e}")
        return None


def upload_to_r2(file_path):
    """Upload file to R2 bucket"""
    log("Uploading to R2...")

    try:
        s3_client = boto3.client(
            's3',
            endpoint_url=ENDPOINT_URL,
            aws_access_key_id=ACCESS_KEY,
            aws_secret_access_key=SECRET_KEY,
            region_name='auto'
        )

        filename = file_path.name

        s3_client.upload_file(
            str(file_path),
            BUCKET_NAME,
            filename,
            Callback=lambda bytes: print('.', end='', flush=True)
        )

        print()  # New line after progress dots
        log(f"✓ Successfully uploaded: {filename}")

        # Delete local file after successful upload
        file_path.unlink()
        log("Local file cleaned up")

        return True

    except Exception as e:
        log(f"✗ Upload failed: {e}")
        return False


def main():
    """Main automation workflow"""
    log("=" * 60)
    log("GP Archive - Automated Weekly Download")
    log("=" * 60)

    # Step 1: Find latest episode
    episode = find_latest_episode()
    if not episode:
        log("No episode found. Exiting.")
        return

    # Step 2: Download episode
    file_path = download_episode(episode)
    if not file_path:
        log("Download failed or episode already exists. Exiting.")
        return

    # Step 3: Upload to R2
    success = upload_to_r2(file_path)

    if success:
        log("=" * 60)
        log("✓ Automation complete!")
        log("=" * 60)
    else:
        log("Automation failed during upload")


if __name__ == "__main__":
    main()
