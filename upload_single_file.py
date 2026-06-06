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

# File to upload
FILE_TO_UPLOAD = r"C:\Users\schmi\Downloads\gp_proxy\archive\Gilles Peterson, 13⧸12⧸2025.mp3"

# Create S3 client for R2
s3_client = boto3.client(
    's3',
    endpoint_url=ENDPOINT_URL,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    region_name='auto'
)

def upload_file():
    file_path = Path(FILE_TO_UPLOAD)

    if not file_path.exists():
        print(f"Error: File not found at {FILE_TO_UPLOAD}")
        return

    file_name = file_path.name
    file_size_mb = file_path.stat().st_size / (1024 * 1024)

    print(f"Uploading: {file_name}")
    print(f"Size: {file_size_mb:.2f} MB")
    print("-" * 60)

    try:
        # Upload file
        s3_client.upload_file(
            str(file_path),
            BUCKET_NAME,
            file_name,
            Callback=lambda bytes_transferred: print('.', end='', flush=True)
        )
        print(f"\n✓ Successfully uploaded: {file_name}")

    except Exception as e:
        print(f"\n✗ Error uploading {file_name}: {str(e)}")
        return

    print("\n" + "=" * 60)
    print("Upload complete!")

    # List uploaded files
    print("\nFiles in bucket:")
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME)
        if 'Contents' in response:
            for obj in response['Contents']:
                size_mb = obj['Size'] / (1024 * 1024)
                print(f"  - {obj['Key']} ({size_mb:.2f} MB)")
        else:
            print("  No files found in bucket")
    except Exception as e:
        print(f"  Error listing files: {str(e)}")

if __name__ == "__main__":
    upload_file()
