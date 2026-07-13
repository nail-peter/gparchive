"""
Get episode information from BBC using yt-dlp without downloading
"""
import subprocess
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# The 4 episodes we need info for
EPISODE_IDS = ["m002x2b1", "m002xdzt", "m002xmyp", "m002y01b"]

def get_episode_info(episode_id):
    url = f"https://www.bbc.co.uk/programmes/{episode_id}"
    print(f"\nGetting info for {episode_id}...")
    print(f"URL: {url}")

    try:
        result = subprocess.run(
            [
                'python', '-m', 'yt_dlp',
                '--print', '%(title)s|||%(upload_date)s|||%(description)s',
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                '--no-playlist',
                url,
            ],
            capture_output=True,
            text=True,
            timeout=120,
            encoding='utf-8'
        )

        if result.returncode == 0:
            output = result.stdout.strip()
            if '|||' in output:
                parts = output.split('|||')
                title = parts[0] if len(parts) > 0 else 'Unknown'
                date = parts[1] if len(parts) > 1 else 'Unknown'
                desc = parts[2] if len(parts) > 2 else ''

                # Format date from YYYYMMDD to YYYY-MM-DD
                if len(date) == 8 and date.isdigit():
                    date = f"{date[0:4]}-{date[4:6]}-{date[6:8]}"

                print(f"  Title: {title}")
                print(f"  Date: {date}")
                print(f"  Description: {desc[:100]}...")

                return {
                    "id": episode_id,
                    "title": title,
                    "date": date,
                    "description": desc
                }
        else:
            print(f"  Error: {result.stderr}")
            return None

    except Exception as e:
        print(f"  Exception: {e}")
        return None

if __name__ == "__main__":
    episodes_info = []
    for ep_id in EPISODE_IDS:
        info = get_episode_info(ep_id)
        if info:
            episodes_info.append(info)

    print("\n" + "="*60)
    print("Summary:")
    print("="*60)
    for info in episodes_info:
        print(f"{info['date']} - {info['title']}")

    print(f"\n\nSuccessfully retrieved {len(episodes_info)} out of {len(EPISODE_IDS)} episodes")
