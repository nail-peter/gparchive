import re
import subprocess
import json
from pathlib import Path

# Mapping of current filenames to BBC episode IDs (from download history)
EPISODE_MAPPING = {
    "Gilles Peterson, 13⧸12⧸2025.mp3": "m002n8kq",
    "Gilles Peterson, keiyaA at Maida Vale and best albums of the year.mp3": "m002nk9z",
    "Gilles Peterson, Best of 2025： sessions, words and music.mp3": "m002nskc",
    "Gilles Peterson, Best of 2025, Part 3.mp3": "m002p78w",
    "Gilles Peterson, 10⧸01⧸2026.mp3": "m002pbpm",
    "Gilles Peterson, Gary Bartz in conversation.mp3": "m002pr92",
    "Gilles Peterson, Jamie Woon live at Maida Vale.mp3": None,  # Need to find
    "Gilles Peterson, Femi Koleoso sits in.mp3": None,
    "Gilles Peterson, Zakia Sewell sits in [m002m2gm].mp3": "m002m2gm",
    "Gilles Peterson, Zakia Sewell sits in [m002m9ss].mp3": "m002m9ss",
    "Gilles Peterson, Zakia Sewell sits in.mp3": None,
    "Gilles Peterson, 01⧸11⧸2025.mp3": None,
    "Gilles Peterson, Charlotte Dos Santos.mp3": None,
    "Gilles Peterson, D'Angelo Tribute (1).mp3": None,
}

# Try to get episode info using yt-dlp
def get_episode_info(episode_id):
    if not episode_id:
        return None

    try:
        url = f"https://www.bbc.co.uk/programmes/{episode_id}"
        result = subprocess.run(
            ['python', '-m', 'yt_dlp', '--dump-json', '--skip-download', url],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode == 0:
            data = json.loads(result.stdout)
            return {
                'title': data.get('title', ''),
                'upload_date': data.get('upload_date', ''),  # YYYYMMDD format
                'release_date': data.get('release_date', ''),
            }
    except Exception as e:
        print(f"Error getting info for {episode_id}: {e}")

    return None

print("Looking up episode airing dates from BBC...")
print("=" * 60)

for filename, episode_id in EPISODE_MAPPING.items():
    if episode_id:
        print(f"\n{filename}")
        print(f"  Episode ID: {episode_id}")

        info = get_episode_info(episode_id)
        if info:
            upload_date = info.get('upload_date', '')
            if upload_date and len(upload_date) == 8:
                # Format: YYYYMMDD -> YYYY-MM-DD
                formatted_date = f"{upload_date[0:4]}-{upload_date[4:6]}-{upload_date[6:8]}"
                print(f"  Airing date: {formatted_date}")
                print(f"  Title: {info.get('title', '')}")
            else:
                print(f"  Airing date: Unknown")
        else:
            print(f"  Could not fetch episode info")
    else:
        print(f"\n{filename}")
        print(f"  Episode ID: Unknown - needs manual lookup")
