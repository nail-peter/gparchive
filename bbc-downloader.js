const RadioArchiver = require('./index');
const fs = require('fs-extra');
const path = require('path');

class BBCDownloader extends RadioArchiver {
  constructor() {
    super();
    this.bbcBaseUrl = 'https://www.bbc.com';
    this.iplayerApiBase = 'https://www.bbc.co.uk/iplayer/api';
  }

  extractProgramId(url) {
    // Extract program ID from BBC audio URLs like:
    // https://www.bbc.com/audio/play/m002kqfg
    const match = url.match(/\/play\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  async getProgramMetadata(programId) {
    try {
      // Try to get program metadata from BBC APIs
      const metadataUrl = `${this.iplayerApiBase}/programmes/${programId}`;
      const response = await this.fetchWithProxy(metadataUrl);
      return response.data;
    } catch (error) {
      console.log(`Metadata fetch failed, will extract from page: ${error.message}`);
      return null;
    }
  }

  async extractAudioStreamUrl(programUrl) {
    try {
      console.log(`Fetching program page: ${programUrl}`);

      // Extract program ID from URL
      const programId = this.extractProgramId(programUrl);
      if (!programId) {
        throw new Error('Could not extract program ID from URL');
      }

      // First, get the current build ID
      console.log('Fetching page to get build ID...');
      const pageResponse = await this.fetchWithProxy(programUrl);
      const buildIdMatch = pageResponse.data.match(/"buildId":"([^"]+)"/);

      if (!buildIdMatch) {
        throw new Error('Could not extract build ID from page');
      }

      const buildId = buildIdMatch[1];
      console.log(`Found build ID: ${buildId}`);

      // Try BBC Sounds Next.js data endpoint first
      try {
        const nextDataUrl = `https://www.bbc.co.uk/sounds/_next/data/${buildId}/play/${programId}.json`;
        console.log(`Trying Next.js data endpoint: ${nextDataUrl}`);
        const dataResponse = await this.fetchWithProxy(nextDataUrl);

        if (dataResponse.data && dataResponse.data.pageProps) {
          console.log('Found Next.js data, searching for media URLs...');
          // Debug: Save JSON data
          const fs = require('fs');
          fs.writeFileSync('./archive/debug_nextjs_data.json', JSON.stringify(dataResponse.data, null, 2));
          console.log('Saved Next.js data to ./archive/debug_nextjs_data.json');

          const mediaUrl = this.extractMediaUrlFromPlayerData(dataResponse.data);
          if (mediaUrl) {
            console.log(`Found stream URL from Next.js data: ${mediaUrl}`);
            return mediaUrl;
          }
        }
      } catch (nextError) {
        console.log('Next.js data endpoint failed, trying HTML scraping...');
      }

      // Fallback to HTML scraping (use already fetched page)
      const html = pageResponse.data;

      // Try to find embedded player data
      const playerDataMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/s);
      if (playerDataMatch) {
        try {
          const playerData = JSON.parse(playerDataMatch[1]);
          console.log('Found player data, searching for media URLs...');
          const mediaUrl = this.extractMediaUrlFromPlayerData(playerData);
          if (mediaUrl) {
            console.log(`Found stream URL from player data: ${mediaUrl}`);
            return mediaUrl;
          }
        } catch (e) {
          console.log('Failed to parse player data:', e.message);
        }
      }

      // Fallback: Look for various audio stream patterns in the HTML
      const patterns = [
        // HLS stream URLs
        /"hlsUrl":"([^"]+)"/,
        /"streamUrl":"([^"]+)"/,
        // Direct audio URLs
        /"audioUrl":"([^"]+)"/,
        /"src":"([^"]+\.m4a[^"]*)"/,
        /"src":"([^"]+\.mp3[^"]*)"/,
        // Media URLs in data attributes
        /data-media-url="([^"]+)"/,
        // JSON-LD structured data
        /"contentUrl":"([^"]+)"/
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          let url = match[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
          if (url.startsWith('//')) {
            url = 'https:' + url;
          } else if (url.startsWith('/')) {
            url = this.bbcBaseUrl + url;
          }
          console.log(`Found potential stream URL: ${url}`);
          return url;
        }
      }

      throw new Error('No audio stream URL found in page');
    } catch (error) {
      console.error(`Failed to extract stream URL: ${error.message}`);
      throw error;
    }
  }

  extractMediaUrlFromPlayerData(data) {
    // Recursively search for media URLs in player data
    const findMediaUrl = (obj, depth = 0) => {
      if (typeof obj !== 'object' || obj === null || depth > 20) return null;

      // Check for common BBC Sounds media URL keys
      if (obj.href && typeof obj.href === 'string' && (obj.href.includes('.m3u8') || obj.href.includes('.m4a') || obj.href.includes('.mp3'))) {
        return obj.href;
      }

      for (const key in obj) {
        const value = obj[key];

        if (typeof value === 'string') {
          // Look for HLS (.m3u8), m4a, mp3, or media server URLs
          if (value.includes('.m3u8') || value.includes('.m4a') || value.includes('.mp3') ||
              value.includes('hlsUrl') || value.includes('stream') || value.includes('media.')) {
            // Make sure it's a valid URL
            if (value.startsWith('http') || value.startsWith('//')) {
              return value;
            }
          }
        } else if (typeof value === 'object') {
          const result = findMediaUrl(value, depth + 1);
          if (result) return result;
        }
      }
      return null;
    };

    return findMediaUrl(data);
  }

  async extractProgramInfo(programUrl) {
    try {
      const response = await this.fetchWithProxy(programUrl);
      const html = response.data;

      // Extract title
      const titleMatch = html.match(/<title>([^<]+)<\/title>/) ||
                       html.match(/"title":"([^"]+)"/) ||
                       html.match(/data-title="([^"]+)"/);

      // Extract description
      const descMatch = html.match(/<meta name="description" content="([^"]+)"/) ||
                       html.match(/"synopsis":"([^"]+)"/);

      // Extract episode info
      const episodeMatch = html.match(/"episode":"([^"]+)"/) ||
                          html.match(/Episode\s+(\d+)/i);

      // Extract duration
      const durationMatch = html.match(/"duration":(\d+)/) ||
                           html.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

      return {
        title: titleMatch ? titleMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'BBC Audio',
        description: descMatch ? descMatch[1] : '',
        episode: episodeMatch ? episodeMatch[1] : '',
        duration: durationMatch ? durationMatch[0] : '',
        originalUrl: programUrl
      };
    } catch (error) {
      console.error(`Failed to extract program info: ${error.message}`);
      return {
        title: 'BBC Audio',
        description: '',
        episode: '',
        duration: '',
        originalUrl: programUrl
      };
    }
  }

  async downloadBBCAudio(programUrl, customFilename = null) {
    try {
      const programId = this.extractProgramId(programUrl);
      console.log(`Program ID: ${programId}`);

      // Get program information
      const programInfo = await this.extractProgramInfo(programUrl);
      console.log(`Program: ${programInfo.title}`);

      // Extract audio stream URL
      const streamUrl = await this.extractAudioStreamUrl(programUrl);
      console.log(`Stream URL found: ${streamUrl}`);

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const safeTitle = programInfo.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
      const filename = customFilename || `${safeTitle}_${programId}_${timestamp}.m4a`;

      // Download the audio
      const filePath = await this.downloadRadioShow(streamUrl, filename);

      // Save metadata
      const metadataFile = filename.replace(/\.(m4a|mp3)$/, '_metadata.json');
      const metadataPath = path.join(this.archiveDir, metadataFile);
      await fs.writeJson(metadataPath, {
        ...programInfo,
        programId,
        downloadDate: new Date().toISOString(),
        streamUrl,
        filename
      }, { spaces: 2 });

      console.log(`✓ Download completed: ${filename}`);
      console.log(`✓ Metadata saved: ${metadataFile}`);

      return {
        audioFile: filePath,
        metadataFile: metadataPath,
        programInfo
      };

    } catch (error) {
      console.error(`✗ BBC download failed: ${error.message}`);
      throw error;
    }
  }

  async downloadFromPlaylistUrl(playlistUrl) {
    try {
      // Handle HLS playlists
      const response = await this.fetchWithProxy(playlistUrl);
      const playlist = response.data;

      // Extract the highest quality stream
      const lines = playlist.split('\n');
      let bestStreamUrl = null;
      let bestBandwidth = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXT-X-STREAM-INF:')) {
          const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
          const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1]) : 0;

          if (bandwidth > bestBandwidth && i + 1 < lines.length) {
            bestBandwidth = bandwidth;
            bestStreamUrl = lines[i + 1].trim();
          }
        }
      }

      if (bestStreamUrl) {
        if (bestStreamUrl.startsWith('/')) {
          const baseUrl = playlistUrl.split('/').slice(0, -1).join('/');
          bestStreamUrl = baseUrl + bestStreamUrl;
        }
        return bestStreamUrl;
      }

      throw new Error('No suitable stream found in playlist');
    } catch (error) {
      console.error(`Playlist processing failed: ${error.message}`);
      throw error;
    }
  }
}

// CLI usage
if (require.main === module) {
  const downloader = new BBCDownloader();
  const command = process.argv[2];

  switch (command) {
    case 'download':
      const url = process.argv[3];
      const filename = process.argv[4];

      if (!url) {
        console.log('Usage: node bbc-downloader.js download <BBC-audio-URL> [filename]');
        console.log('Example: node bbc-downloader.js download "https://www.bbc.com/audio/play/m002kqfg"');
        break;
      }

      downloader.downloadBBCAudio(url, filename)
        .then(result => {
          console.log('\n✓ Download Summary:');
          console.log(`  Title: ${result.programInfo.title}`);
          console.log(`  Audio: ${result.audioFile}`);
          console.log(`  Metadata: ${result.metadataFile}`);
        })
        .catch(err => {
          console.error('\n✗ Download failed:', err.message);
          process.exit(1);
        });
      break;

    case 'info':
      const infoUrl = process.argv[3];
      if (!infoUrl) {
        console.log('Usage: node bbc-downloader.js info <BBC-audio-URL>');
        break;
      }

      downloader.extractProgramInfo(infoUrl)
        .then(info => {
          console.log('\nProgram Information:');
          console.log(`Title: ${info.title}`);
          console.log(`Description: ${info.description}`);
          console.log(`Episode: ${info.episode}`);
          console.log(`Duration: ${info.duration}`);
        })
        .catch(err => console.error('Info extraction failed:', err.message));
      break;

    default:
      console.log('BBC Audio Downloader');
      console.log('===================');
      console.log('Commands:');
      console.log('  download <url> [filename]    - Download BBC audio program');
      console.log('  info <url>                   - Show program information');
      console.log('');
      console.log('Example:');
      console.log('  node bbc-downloader.js download "https://www.bbc.com/audio/play/m002kqfg"');
  }
}

module.exports = BBCDownloader;