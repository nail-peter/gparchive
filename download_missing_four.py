"""
Download and upload 4 missing Gilles Peterson episodes to R2.
Episodes: m002x2b1, m002xdzt, m002xmyp, m002y01b
"""

import subprocess
import re
import sys
import boto3
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# R2 credentials
ACCESS_KEY = "3fe1d0fac3028b108dfb1434fbeda5ab"
SECRET_KEY = "7e39e93560a2555e2e20c57a6ea094746212d3360ee13395d8ddb40c69924516"
ACCOUNT_ID = "daa5cfc7d0326ab77077899860d9ae03"
BUCKET_NAME = "gparchive"
ENDPOINT_URL = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"

DOWNLOAD_DIR = Path(__file__).parent / "downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)

# The 4 missing episodes with their broadcast dates
EPISODES = [
    {"id": "m002x2b1", "date": "2026-06-06", "title": "Episode 1"},
    {"id": "m002xdzt", "date": "2026-06-13", "title": "Episode 2"},
    {"id": "m002xmyp", "date": "2026-06-20", "title": "Episode 3"},
    {"id": "m002y01b", "date": "2026-06-27", "title": "Episode 4"},
]

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


def safe_filename(s):
    return re.sub(r'[<>:"/\\|?*]', '', s)


def download_episode(ep):
    filename = safe_filename(f"{ep['date']} Gilles Peterson - {ep['title']}.mp3")
    out_path = DOWNLOAD_DIR / filename
    url = f"https://www.bbc.co.uk/programmes/{ep['id']}"

    print(f"\n{'='*60}")
    print(f"Downloading: {filename}")
    print(f"URL: {url}")

    if r2_exists(filename):
        print(f"  Already in R2, skipping.")
        return None

    # yt-dlp outputs a .mp4 then we ask for mp3; the actual output file may have
    # a different extension initially, so use a temp stem and rename after.
    tmp_out = str(DOWNLOAD_DIR / f"{ep['id']}.%(ext)s")

    result = subprocess.run(
        [
            'python', '-m', 'yt_dlp',
            '--format', 'bestaudio',
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
    print("GP Archive - Downloading 4 missing episodes")
    print("=" * 60)

    for ep in EPISODES:
        file_path = download_episode(ep)
        if file_path:
            upload_file(file_path)

    print("\n" + "=" * 60)
    print("All done!")


if __name__ == "__main__":
    main()
