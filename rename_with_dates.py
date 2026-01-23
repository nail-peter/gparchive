import boto3
import sys
from datetime import datetime

# Set UTF-8 encoding
sys.stdout.reconfigure(encoding='utf-8')

# R2 credentials
ACCESS_KEY = "3fe1d0fac3028b108dfb1434fbeda5ab"
SECRET_KEY = "7e39e93560a2555e2e20c57a6ea094746212d3360ee13395d8ddb40c69924516"
ACCOUNT_ID = "daa5cfc7d0326ab77077899860d9ae03"
BUCKET_NAME = "gparchive"

ENDPOINT_URL = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"

# Mapping of current filenames to proper dated filenames
# Format: YYYY-MM-DD Title.mp3
# Dates confirmed from 1001tracklists.com and BBC broadcast schedule (Saturdays)
FILE_RENAMING = {
    # January 2026 episodes
    "Gilles Peterson, Gary Bartz in conversation.mp3": "2026-01-18 Gilles Peterson - Gary Bartz in conversation.mp3",
    "Gilles Peterson, 10⧸01⧸2026.mp3": "2026-01-10 Gilles Peterson.mp3",

    # December 2025 episodes
    "Gilles Peterson, Best of 2025, Part 3.mp3": "2026-01-03 Gilles Peterson - Best of 2025 Part 3.mp3",  # Confirmed: 2026-01-03
    "Gilles Peterson, Best of 2025： sessions, words and music.mp3": "2025-12-27 Gilles Peterson - Best of 2025 Part 2.mp3",  # Part 2
    "Gilles Peterson, keiyaA at Maida Vale and best albums of the year.mp3": "2025-12-20 Gilles Peterson - keiyaA Best of 2025 Part 1.mp3",  # Confirmed: 2025-12-20
    "Gilles Peterson, 13⧸12⧸2025.mp3": "2025-12-13 Gilles Peterson.mp3",
    "Gilles Peterson, Jamie Woon live at Maida Vale.mp3": "2025-12-06 Gilles Peterson - Jamie Woon at Maida Vale.mp3",

    # November 2025 episodes
    "Gilles Peterson, Femi Koleoso sits in.mp3": "2025-11-29 Gilles Peterson - Femi Koleoso sits in.mp3",
    "Gilles Peterson, Zakia Sewell sits in [m002m9ss].mp3": "2025-11-22 Gilles Peterson - Zakia Sewell sits in.mp3",
    "Gilles Peterson, Zakia Sewell sits in [m002m2gm].mp3": "2025-11-15 Gilles Peterson - Zakia Sewell sits in.mp3",
    "Gilles Peterson, Zakia Sewell sits in.mp3": "2025-11-08 Gilles Peterson - Zakia Sewell sits in.mp3",
    "Gilles Peterson, 01⧸11⧸2025.mp3": "2025-11-01 Gilles Peterson.mp3",

    # October 2025 episodes
    "Gilles Peterson, Charlotte Dos Santos.mp3": "2025-10-25 Gilles Peterson - Charlotte Dos Santos.mp3",
    "Gilles Peterson, D'Angelo Tribute (1).mp3": "2025-10-18 Gilles Peterson - D'Angelo Tribute.mp3",
}

def rename_files():
    s3_client = boto3.client(
        's3',
        endpoint_url=ENDPOINT_URL,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        region_name='auto'
    )

    print("Renaming files in R2 to include airing dates...")
    print("=" * 60)

    success_count = 0
    for old_name, new_name in FILE_RENAMING.items():
        try:
            print(f"\n{old_name}")
            print(f"  → {new_name}")

            # Copy object with new name
            s3_client.copy_object(
                Bucket=BUCKET_NAME,
                CopySource={'Bucket': BUCKET_NAME, 'Key': old_name},
                Key=new_name
            )

            # Delete old object
            s3_client.delete_object(
                Bucket=BUCKET_NAME,
                Key=old_name
            )

            print(f"  ✓ Renamed successfully")
            success_count += 1

        except Exception as e:
            print(f"  ✗ Error: {e}")

    print("\n" + "=" * 60)
    print(f"Renamed {success_count}/{len(FILE_RENAMING)} files")

    # List all files after renaming
    print("\nFiles in bucket (sorted by name/date):")
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME)
        if 'Contents' in response:
            files = sorted([obj['Key'] for obj in response['Contents']], reverse=True)
            for i, filename in enumerate(files, 1):
                print(f"  {i}. {filename}")
    except Exception as e:
        print(f"Error listing files: {e}")

if __name__ == "__main__":
    import sys
    # Auto-confirm if --confirm flag is provided
    if len(sys.argv) > 1 and sys.argv[1] == '--confirm':
        rename_files()
    else:
        print("\nWARNING: This will rename all files in your R2 bucket!")
        print("Current filenames will be replaced with dated versions.")
        response = input("\nContinue? (yes/no): ")

        if response.lower() == 'yes':
            rename_files()
        else:
            print("Cancelled.")
