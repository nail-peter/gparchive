const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Cloudflare R2 configuration
// R2 uses the S3 API, so we use the S3Client
class R2Client {
  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucketName) {
      console.warn('R2 credentials not fully configured. Missing one of: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
      this.enabled = false;
      return;
    }

    // R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: 'auto', // R2 uses 'auto' as the region
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    this.enabled = true;
    console.log('R2 client initialized successfully');
    console.log(`Bucket: ${this.bucketName}`);
  }

  isEnabled() {
    return this.enabled;
  }

  async listFiles(prefix = '') {
    if (!this.enabled) {
      throw new Error('R2 client not enabled - check environment variables');
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const response = await this.client.send(command);

      // Return files with metadata
      return (response.Contents || []).map(item => ({
        key: item.Key,
        size: item.Size,
        modified: item.LastModified,
        etag: item.ETag,
      }));
    } catch (error) {
      console.error('Error listing R2 files:', error);
      throw error;
    }
  }

  async getFile(key) {
    if (!this.enabled) {
      throw new Error('R2 client not enabled - check environment variables');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);

      return {
        stream: response.Body,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
      };
    } catch (error) {
      console.error(`Error getting R2 file ${key}:`, error);
      throw error;
    }
  }

  async getFileStream(key, range = null) {
    if (!this.enabled) {
      throw new Error('R2 client not enabled - check environment variables');
    }

    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      // Add range if specified (for streaming)
      if (range) {
        params.Range = range;
      }

      const command = new GetObjectCommand(params);
      const response = await this.client.send(command);

      return {
        stream: response.Body,
        contentType: response.ContentType || 'audio/mpeg',
        contentLength: response.ContentLength,
        contentRange: response.ContentRange,
        acceptRanges: response.AcceptRanges,
        lastModified: response.LastModified,
      };
    } catch (error) {
      console.error(`Error streaming R2 file ${key}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const r2Client = new R2Client();

module.exports = r2Client;
