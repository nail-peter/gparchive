#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import os
# Force UTF-8 output
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import boto3
import json
from datetime import datetime

# R2 Configuration
R2_ACCOUNT_ID = "daa5cfc7d0326ab77077899860d9ae03"
BUCKET_NAME = "gparchive"
ACCESS_KEY = "3fe1d0fac3028b108dfb1434fbeda5ab"
SECRET_KEY = "4d941b4340462010333f25508589b5f946d156b649439129012d8c86a41ff5f4"

# Create S3 client for R2
s3 = boto3.client(
    's3',
    endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    region_name='auto'
)

print(f"\nListing files in bucket: {BUCKET_NAME}\n")

# List objects
response = s3.list_objects_v2(Bucket=BUCKET_NAME)

if 'Contents' not in response:
    print("No files found in bucket!")
    exit()

# Prepare episode metadata
episodes = []

for obj in response['Contents']:
    filename = obj['Key']
    size = obj['Size']
    modified = obj['LastModified']

    # Only process MP3 files
    if not filename.lower().endswith('.mp3'):
        continue

    # Extract episode ID from filename (if it has [id] format)
    episode_id = "unknown"
    if '[' in filename and ']' in filename:
        start = filename.index('[') + 1
        end = filename.index(']')
        episode_id = filename[start:end]

    # Create episode entry
    episode = {
        "filename": filename,
        "name": filename.replace('.mp3', '').replace(f'[{episode_id}]', '').strip(),
        "date": modified.isoformat(),
        "size": size,
        "episodeId": episode_id
    }

    episodes.append(episode)

    print(f"[OK] {filename}")
    print(f"  Size: {size / 1024 / 1024:.1f} MB")
    print(f"  Modified: {modified}")
    print()

# Sort by date (newest first)
episodes.sort(key=lambda x: x['date'], reverse=True)

# Print JavaScript array format for server.js
print("\n" + "="*60)
print("Copy this into your api/server.js file:")
print("="*60 + "\n")
print("const episodes = " + json.dumps(episodes, indent=4) + ";")

print(f"\n\nTotal MP3 files: {len(episodes)}")
