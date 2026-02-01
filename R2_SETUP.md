# Cloudflare R2 Storage Setup

This application now supports Cloudflare R2 storage for hosting your audio files in the cloud.

## Features

- **Automatic R2 integration**: The app checks R2 first, then falls back to local storage
- **Streaming support**: Full support for range requests (seeking in audio files)
- **Easy deployment**: Upload files to R2, and they'll appear in your Railway app automatically

## Setup Instructions

### 1. Get Your R2 Credentials

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the left sidebar
3. Create a bucket if you haven't already (e.g., `gp-episodes`)
4. Go to **Manage R2 API Tokens**
5. Click **Create API Token**
6. Choose **Admin Read & Write** permissions
7. Copy the following values:
   - Account ID
   - Access Key ID
   - Secret Access Key

### 2. Configure Environment Variables

Add these to your Railway environment variables (or your `.env` file for local testing):

```bash
R2_ACCOUNT_ID=your-account-id-here
R2_ACCESS_KEY_ID=your-access-key-id-here
R2_SECRET_ACCESS_KEY=your-secret-access-key-here
R2_BUCKET_NAME=your-bucket-name-here
```

### 3. Upload Files to R2

You can upload your MP3 files to R2 using:

- **Cloudflare Dashboard**: Navigate to R2 > Your Bucket > Upload
- **Wrangler CLI**: `wrangler r2 object put your-bucket/filename.mp3 --file=./archive/filename.mp3`
- **AWS CLI** (S3-compatible):
  ```bash
  aws s3 cp ./archive/filename.mp3 s3://your-bucket/filename.mp3 \
    --endpoint-url https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com
  ```

### 4. Deploy to Railway

1. Push your code to GitHub
2. Railway will automatically redeploy
3. The new episode should now appear in your app!

## How It Works

- **`/api/episodes`**: Lists all MP3 files from R2 (or local fallback)
- **`/audio/:filename`**: Streams audio files from R2 (or local fallback)
- **Automatic fallback**: If R2 is not configured or fails, the app uses local storage

## Troubleshooting

### "R2 client not enabled"
Check that all 4 environment variables are set correctly in Railway.

### "No episodes showing up"
1. Verify files are uploaded to R2 bucket
2. Check Railway logs for errors: `railway logs`
3. Ensure files end with `.mp3` extension

### "Streaming issues"
- R2 supports range requests by default
- Check that the file uploaded correctly
- Try re-uploading the file

## Cost Considerations

Cloudflare R2:
- **Storage**: $0.015 per GB/month
- **Class A operations** (writes): $4.50 per million
- **Class B operations** (reads): $0.36 per million
- **Egress**: FREE (no bandwidth costs!)

For a typical podcast archive (100 episodes × 100MB), you'll pay:
- Storage: ~$0.15/month
- Operations: Negligible for personal use
- **Total: Less than $1/month**

## Support

If you encounter issues, check:
1. Railway deployment logs
2. R2 bucket permissions
3. Environment variables are set correctly
