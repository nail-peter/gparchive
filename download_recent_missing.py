"""
Download the most recent missing GP episodes
Based on BBC Sounds availability (usually 30 days)
"""
import subprocess
import boto3
from pathlib import Path
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# R2 credentials
ACCESS_KEY = "3fe1d0fac3028b108dfb1434fbeda5ab"
SECRET_KEY = "7e39e93560a2555e2e20c57a6ea094746212d3360ee13395d8ddb40c69924516"
ACCOUNT_ID = "daa5cfc7d0326ab77077899860d9ae03"
BUCKET_NAME = "gparchive"
ENDPOINT_URL = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"

DOWNLOAD_DIR = Path(__file__).parent / "downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)

# Recent episodes that might still be available
# We'll try to search for them by trying common BBC programme IDs
# or by scraping the BBC Sounds GP page

def search_bbc_sounds():
    """
    Try to get the latest episodes from BBC Sounds
    """
    print("Searching BBC Sounds for latest Gilles Peterson episodes...")

    # BBC Sounds URL for Gilles Peterson
    url = "https://www.bbc.co.uk/sounds/brand/b01fm4ss"

    try:
        result = subprocess.run(
            [
                'python', '-m', 'yt_dlp',
                '--flat-playlist',
                '--print', 'id|||%(title)s|||%(upload_date)s',
                '--playlist-items', '1-20',
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                url,
            ],
            capture_output=True,
            text=True,
            timeout=120,
            encoding='utf-8'
        )

        if result.returncode == 0:
            episodes = []
            for line in result.stdout.strip().split('\n'):
                if '|||' in line:
                    parts = line.split('|||')
                    if len(parts) >= 2:
                        ep_id = parts[0]
                        title = parts[1]
                        date = parts[2] if len(parts) > 2 else 'Unknown'

                        # Format date from YYYYMMDD to YYYY-MM-DD
                        if len(date) == 8 and date.isdigit():
                            date = f"{date[0:4]}-{date[4:6]}-{date[6:8]}"

                        episodes.append({
                            'id': ep_id,
                            'title': title,
                            'date': date
                        })

            return episodes
        else:
            print(f"Error: {result.stderr}")
            return []
    except Exception as e:
        print(f"Exception: {e}")
        return []

s3 = boto3.client(
    's3',
    endpoint_url=ENDPOINT_URL,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    region_name='auto'
)

def r2_exists(filename):
    try:
        s3.head_object(Bucket=BUCKET_NAME, Key=filename)
        return True
    except:
        return False

def list_r2_files():
    """Get list of existing files in R2"""
    response = s3.list_objects_v2(Bucket=BUCKET_NAME)
    if 'Contents' in response:
        return [obj['Key'] for obj in response['Contents']]
    return []

def safe_filename(s):
    # Replace problematic characters
    s = s.replace(':', ' -')
    return re.sub(r'[<>"/\\|?*]', '', s)

def download_episode(ep):
    # Clean title - remove "Gilles Peterson, " prefix if present
    title = ep['title']
    if title.startswith('Gilles Peterson, '):
        title = title[17:]  # Remove "Gilles Peterson, " prefix

    filename = safe_filename(f"{ep['date']} Gilles Peterson - {title}.mp3")
    out_path = DOWNLOAD_DIR / filename
    url = f"https://www.bbc.co.uk/programmes/{ep['id']}"

    print(f"\n{'='*60}")
    print(f"Downloading: {filename}")
    print(f"URL: {url}")

    if r2_exists(filename):
        print(f"  Already in R2, skipping.")
        return None

    tmp_out = str(DOWNLOAD_DIR / f"{ep['id']}.%(ext)s")

    result = subprocess.run(
        [
            'python', '-m', 'yt_dlp',
            '--format', 'bestaudio',
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            '--output', tmp_out,
            url,
        ],
        timeout=3600,
    )

    if result.returncode != 0:
        print(f"  Download failed (exit {result.returncode})")
        return None

    # Find the downloaded file
    candidates = list(DOWNLOAD_DIR.glob(f"{ep['id']}*"))
    if not candidates:
        print("  Download failed: output file not found")
        return None

    src = candidates[0]
    dest = DOWNLOAD_DIR / filename
    src.rename(dest)
    size_mb = dest.stat().st_size / (1024 * 1024)
    print(f"  Downloaded: {filename} ({size_mb:.1f} MB)")
    return dest

def upload_file(file_path):
    filename = file_path.name
    size_mb = file_path.stat().st_size / (1024 * 1024)
    print(f"  Uploading {size_mb:.1f} MB to R2...")

    s3.upload_file(
        str(file_path),
        BUCKET_NAME,
        filename,
        Callback=lambda b: print('.', end='', flush=True),
    )
    print()
    print(f"  Uploaded: {filename}")
    file_path.unlink()
    print(f"  Local file removed.")

def main():
    print("GP Archive - Finding and downloading recent missing episodes")
    print("=" * 60)

    # Get existing files
    print("\nChecking existing files in R2...")
    existing = list_r2_files()
    print(f"Found {len([f for f in existing if f.endswith('.mp3')])} existing MP3 files")

    # Search for episodes
    episodes = search_bbc_sounds()

    if not episodes:
        print("\nCould not retrieve episode list from BBC Sounds")
        return

    print(f"\nFound {len(episodes)} episodes on BBC Sounds")
    print("\nChecking which ones are missing...")

    downloaded_count = 0
    for ep in episodes:
        # Check if we already have this episode (by date or by ID)
        date_match = any(ep['date'] in f for f in existing)
        id_match = any(ep['id'] in f for f in existing)

        if not date_match and not id_match:
            print(f"\n  Missing: {ep['date']} - {ep['title']}")
            file_path = download_episode(ep)
            if file_path:
                upload_file(file_path)
                downloaded_count += 1
        else:
            print(f"  Already have: {ep['date']} - {ep['title']}")

    print("\n" + "=" * 60)
    print(f"Downloaded and uploaded {downloaded_count} new episodes!")

if __name__ == "__main__":
    main()
