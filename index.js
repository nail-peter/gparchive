const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

class RadioArchiver {
  constructor() {
    this.proxyAgent = this.createProxyAgent();
    this.archiveDir = process.env.ARCHIVE_DIR || './archive';
    this.maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB) || 500;
    this.setupArchiveDirectory();
  }

  createProxyAgent() {
    // Check if using VPN mode or HTTP proxy mode
    if (process.env.USE_VPN === 'true') {
      console.log('Using VPN mode - no proxy agent needed');
      return null;
    }

    const proxyUrl = `http://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
    return new HttpsProxyAgent(proxyUrl);
  }

  setupArchiveDirectory() {
    fs.ensureDirSync(this.archiveDir);
    console.log(`Archive directory ready: ${this.archiveDir}`);
  }

  async fetchWithProxy(url, options = {}) {
    try {
      const requestConfig = {
        url,
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        ...options
      };

      // Only add proxy agent if not using VPN
      if (this.proxyAgent) {
        requestConfig.httpsAgent = this.proxyAgent;
      }

      const response = await axios(requestConfig);
      return response;
    } catch (error) {
      console.error(`Request failed: ${error.message}`);
      throw error;
    }
  }

  async downloadRadioShow(url, filename) {
    try {
      console.log(`Downloading: ${url}`);

      const response = await this.fetchWithProxy(url, {
        responseType: 'stream'
      });

      // Download to temporary file first
      const tempFilename = filename.replace(/\.(mp3|m4a)$/, '.temp$&');
      const tempFilePath = path.join(this.archiveDir, tempFilename);
      const writer = fs.createWriteStream(tempFilePath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', async () => {
          console.log(`Downloaded: ${tempFilename}`);

          try {
            // Convert to MP3 if not already MP3
            const finalFilePath = await this.convertToMp3(tempFilePath, filename);
            resolve(finalFilePath);
          } catch (conversionError) {
            reject(conversionError);
          }
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error(`Download failed: ${error.message}`);
      throw error;
    }
  }

  async convertToMp3(inputFilePath, desiredFilename) {
    try {
      // Ensure output filename has .mp3 extension
      const outputFilename = desiredFilename.replace(/\.(m4a|mp3)$/, '.mp3');
      const outputFilePath = path.join(this.archiveDir, outputFilename);

      // If input is already MP3 and matches desired name, just rename
      if (inputFilePath.endsWith('.temp.mp3') && desiredFilename.endsWith('.mp3')) {
        fs.renameSync(inputFilePath, outputFilePath);
        console.log(`File is already MP3: ${outputFilename}`);
        return outputFilePath;
      }

      console.log(`Converting to MP3: ${outputFilename}`);

      // Use ffmpeg to convert to MP3 with high quality
      const ffmpegCommand = `ffmpeg -i "${inputFilePath}" -vn -acodec libmp3lame -b:a 320k -ar 44100 "${outputFilePath}" -y`;

      execSync(ffmpegCommand, { stdio: 'pipe' });

      // Remove temporary file
      fs.unlinkSync(inputFilePath);

      console.log(`Conversion completed: ${outputFilename}`);
      return outputFilePath;
    } catch (error) {
      console.error(`Conversion failed: ${error.message}`);

      // If conversion fails, keep the original file
      const fallbackPath = inputFilePath.replace('.temp', '');
      if (fs.existsSync(inputFilePath)) {
        fs.renameSync(inputFilePath, fallbackPath);
        console.log(`Kept original file: ${path.basename(fallbackPath)}`);
      }

      throw new Error(`MP3 conversion failed: ${error.message}`);
    }
  }

  async searchBBCPrograms(query) {
    try {
      const searchUrl = `${process.env.BBC_API_BASE}/search.json?q=${encodeURIComponent(query)}`;
      const response = await this.fetchWithProxy(searchUrl);
      return response.data;
    } catch (error) {
      console.error(`Search failed: ${error.message}`);
      return null;
    }
  }

  async getAvailableShows() {
    try {
      const response = await this.fetchWithProxy(process.env.BBC_RADIO_URL);
      console.log('Successfully connected through UK proxy');
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch shows: ${error.message}`);
      return null;
    }
  }

  listArchivedShows() {
    try {
      const files = fs.readdirSync(this.archiveDir);
      const audioFiles = files.filter(file =>
        file.endsWith('.mp3') || file.endsWith('.m4a') || file.endsWith('.wav')
      );

      console.log('Archived shows:');
      audioFiles.forEach((file, index) => {
        const filePath = path.join(this.archiveDir, file);
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`${index + 1}. ${file} (${sizeMB} MB)`);
      });

      return audioFiles;
    } catch (error) {
      console.error(`Failed to list archived shows: ${error.message}`);
      return [];
    }
  }
}

module.exports = RadioArchiver;

// CLI usage
if (require.main === module) {
  const archiver = new RadioArchiver();

  const command = process.argv[2];

  switch (command) {
    case 'test':
      archiver.getAvailableShows()
        .then(() => console.log('Proxy connection successful!'))
        .catch(err => console.error('Proxy connection failed:', err.message));
      break;

    case 'list':
      archiver.listArchivedShows();
      break;

    case 'search':
      const query = process.argv[3];
      if (!query) {
        console.log('Usage: node index.js search "program name"');
        break;
      }
      archiver.searchBBCPrograms(query)
        .then(results => console.log(JSON.stringify(results, null, 2)))
        .catch(err => console.error('Search failed:', err.message));
      break;

    default:
      console.log('Usage:');
      console.log('  node index.js test    - Test proxy connection');
      console.log('  node index.js list    - List archived shows');
      console.log('  node index.js search "query" - Search for programs');
  }
}