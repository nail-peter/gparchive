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

# Create S3 client for R2
s3_client = boto3.client(
    's3',
    endpoint_url=ENDPOINT_URL,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    region_name='auto'
)

def upload_app_js():
    file_path = Path("api/public/app.js")

    if not file_path.exists():
        print(f"Error: File not found at {file_path}")
        return

    print(f"Uploading: app.js")
    print("-" * 60)

    try:
        # Upload file with correct content type
        s3_client.upload_file(
            str(file_path),
            BUCKET_NAME,
            'app.js',
            ExtraArgs={
                'ContentType': 'application/javascript',
                'CacheControl': 'no-cache'  # Ensure browsers get the latest version
            }
        )
        print(f"✓ Successfully uploaded: app.js")
        print("\nPlayback position saving feature is now live!")

    except Exception as e:
        print(f"✗ Error uploading app.js: {str(e)}")
        return

if __name__ == "__main__":
    upload_app_js()
