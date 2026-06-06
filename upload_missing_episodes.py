import boto3
import os
import sys
from pathlib import Path

# Set UTF-8 encoding for console output
sys.stdout.reconfigure(encoding='utf-8')

# Cloudflare R2 credentials
ACCESS_KEY = "3fe1d0fac3028b108dfb1434fbeda5ab"
SECRET_KEY = "7e39e93560a2555e2e20c57a6ea094746212d3360ee13395d8ddb40c69924516"
ACCOUNT_ID = "daa5cfc7d0326ab77077899860d9ae03"
BUCKET_NAME = "gparchive"

# R2 endpoint
ENDPOINT_URL = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"

# Files to upload
FILES_TO_UPLOAD = [
    r"C:\Users\schmi\Downloads\gp_proxy\archive\Gilles Peterson, Gary Bartz in conversation.mp3",
    r"C:\Users\schmi\Downloads\gp_proxy\archive\Gilles Peterson, 10⧸01⧸2026.mp3"
]

# Create S3 client for R2
s3_client = boto3.client(
    's3',
    endpoint_url=ENDPOINT_URL,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    region_name='auto'
)

def upload_files():
    success_count = 0

    for file_path_str in FILES_TO_UPLOAD:
        file_path = Path(file_path_str)

        if not file_path.exists():
            print(f"⚠ Warning: File not found - {file_path.name}")
            continue

        file_name = file_path.name
        file_size_mb = file_path.stat().st_size / (1024 * 1024)

        print(f"\nUploading: {file_name}")
        print(f"Size: {file_size_mb:.2f} MB")
        print("-" * 60)

        try:
            s3_client.upload_file(
                str(file_path),
                BUCKET_NAME,
                file_name,
                Callback=lambda bytes_transferred: print('.', end='', flush=True)
            )
            print(f"\n✓ Successfully uploaded: {file_name}")
            success_count += 1
        except Exception as e:
            print(f"\n✗ Error uploading {file_name}: {str(e)}")

    print("\n" + "=" * 60)
    print(f"Upload complete! {success_count}/{len(FILES_TO_UPLOAD)} files uploaded successfully.")

    # List all files in bucket
    print("\nAll files in bucket:")
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME)
        if 'Contents' in response:
            total_files = len(response['Contents'])
            total_size = sum(obj['Size'] for obj in response['Contents'])
            print(f"  Total episodes: {total_files}")
            print(f"  Total size: {total_size / (1024**3):.2f} GB")
        else:
            print("  No files found in bucket")
    except Exception as e:
        print(f"  Error listing files: {str(e)}")

if __name__ == "__main__":
    upload_files()
