const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { Client } = require('node-ssdp');
const MediaRendererClient = require('upnp-mediarenderer-client');
const os = require('os');
const r2Client = require('./r2-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ARCHIVE_DIR = process.env.ARCHIVE_DIR || './archive';

// Casting state
let discoveredDevices = [];
let activeRenderer = null;
let castingState = {
  isActive: false,
  device: null,
  episode: null,
  position: 0
};

// Basic authentication middleware
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Audio Player"');
    return res.status(401).send('Authentication required');
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  const validUsername = process.env.PLAYER_USERNAME || 'admin';
  const validPassword = process.env.PLAYER_PASSWORD || 'changeme';

  if (username === validUsername && password === validPassword) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Audio Player"');
    res.status(401).send('Invalid credentials');
  }
};

// Parse JSON before applying auth
app.use(express.json());

// Serve audio files WITHOUT authentication (for DLNA/UPnP devices)
// MUST be before auth middleware
app.get('/audio/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);

    // Try R2 first if enabled
    if (r2Client.isEnabled()) {
      try {
        console.log(`Streaming from R2: ${filename}`);

        const range = req.headers.range;
        let r2Range = null;

        if (range) {
          // Parse range header for R2
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : '';
          r2Range = `bytes=${start}-${end}`;
        }

        const fileData = await r2Client.getFileStream(filename, r2Range);

        if (range && fileData.contentRange) {
          // Partial content response
          res.writeHead(206, {
            'Content-Range': fileData.contentRange,
            'Accept-Ranges': 'bytes',
            'Content-Length': fileData.contentLength,
            'Content-Type': fileData.contentType,
          });
        } else {
          // Full content response
          res.writeHead(200, {
            'Content-Length': fileData.contentLength,
            'Content-Type': fileData.contentType,
            'Accept-Ranges': 'bytes',
          });
        }

        fileData.stream.pipe(res);
        return;
      } catch (r2Error) {
        console.error('R2 streaming failed, falling back to local:', r2Error.message);
      }
    }

    // Fallback to local filesystem
    const filePath = path.join(ARCHIVE_DIR, filename);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).send('File not found');
    }

    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      });

      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error serving audio:', error);
    res.status(500).send('Error serving audio file');
  }
});

// Apply auth to all OTHER routes
app.use(auth);

// Serve static files (HTML, CSS, JS, manifest, icons)
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Get server's local IP address
function getServerIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Device discovery function
function discoverDevices() {
  return new Promise((resolve) => {
    const client = new Client();
    const devices = [];
    const timeout = setTimeout(() => {
      client.stop();
      resolve(devices);
    }, 5000); // 5 second scan

    client.on('response', (headers, statusCode, rinfo) => {
      if (headers.ST && headers.ST.includes('MediaRenderer')) {
        const device = {
          id: headers.USN,
          name: headers.SERVER || 'Unknown Device',
          location: headers.LOCATION,
          address: rinfo.address,
          type: 'DLNA'
        };

        // Avoid duplicates
        if (!devices.find(d => d.id === device.id)) {
          devices.push(device);
          console.log(`Discovered device: ${device.name} at ${device.address}`);
        }
      }
    });

    client.search('urn:schemas-upnp-org:device:MediaRenderer:1');
  });
}

// API endpoint to list audio files
app.get('/api/episodes', async (req, res) => {
  try {
    let mp3Files = [];

    // Try R2 first if enabled
    if (r2Client.isEnabled()) {
      try {
        console.log('Fetching episode list from R2...');
        const r2Files = await r2Client.listFiles();

        mp3Files = r2Files
          .filter(file => file.key.endsWith('.mp3'))
          .map(file => ({
            name: file.key,
            size: file.size,
            modified: file.modified,
            url: `/audio/${encodeURIComponent(file.key)}`,
            source: 'r2'
          }))
          .sort((a, b) => b.modified - a.modified); // Most recent first

        console.log(`Found ${mp3Files.length} episodes in R2`);
        return res.json(mp3Files);
      } catch (r2Error) {
        console.error('R2 listing failed, falling back to local:', r2Error.message);
      }
    }

    // Fallback to local filesystem
    console.log('Fetching episode list from local filesystem...');
    const files = await fs.readdir(ARCHIVE_DIR);
    mp3Files = files
      .filter(file => file.endsWith('.mp3'))
      .map(file => {
        const stats = fs.statSync(path.join(ARCHIVE_DIR, file));
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime,
          url: `/audio/${encodeURIComponent(file)}`,
          source: 'local'
        };
      })
      .sort((a, b) => b.modified - a.modified); // Most recent first

    res.json(mp3Files);
  } catch (error) {
    console.error('Error reading archive:', error);
    res.status(500).json({ error: 'Failed to read episodes' });
  }
});

// API endpoint to discover casting devices
app.get('/api/cast/devices', async (req, res) => {
  try {
    console.log('Scanning for casting devices...');
    const devices = await discoverDevices();
    discoveredDevices = devices;
    res.json(devices);
  } catch (error) {
    console.error('Error discovering devices:', error);
    res.status(500).json({ error: 'Failed to discover devices' });
  }
});

// API endpoint to start casting
app.post('/api/cast/play', async (req, res) => {
  try {
    const { deviceLocation, episodeName } = req.body;

    if (!deviceLocation || !episodeName) {
      return res.status(400).json({ error: 'Device location and episode name required' });
    }

    // Build the audio URL that the device will access
    const serverIP = getServerIP();
    const audioUrl = `http://${serverIP}:${PORT}/audio/${encodeURIComponent(episodeName)}`;

    console.log(`Starting cast to device at ${deviceLocation}`);
    console.log(`Audio URL: ${audioUrl}`);

    // Create renderer client
    activeRenderer = new MediaRendererClient(deviceLocation);

    // Load the audio file
    await new Promise((resolve, reject) => {
      activeRenderer.load(audioUrl, {
        autoplay: true,
        contentType: 'audio/mpeg',
        metadata: {
          title: episodeName.replace('.mp3', ''),
          type: 'audio'
        }
      }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    castingState = {
      isActive: true,
      device: deviceLocation,
      episode: episodeName,
      position: 0
    };

    console.log('Cast started successfully');
    res.json({ success: true, message: 'Casting started' });
  } catch (error) {
    console.error('Error starting cast:', error);
    res.status(500).json({ error: 'Failed to start casting', details: error.message });
  }
});

// API endpoint to pause casting
app.post('/api/cast/pause', async (req, res) => {
  try {
    if (!activeRenderer) {
      return res.status(400).json({ error: 'No active cast session' });
    }

    await new Promise((resolve, reject) => {
      activeRenderer.pause((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true, message: 'Playback paused' });
  } catch (error) {
    console.error('Error pausing cast:', error);
    res.status(500).json({ error: 'Failed to pause', details: error.message });
  }
});

// API endpoint to resume casting
app.post('/api/cast/resume', async (req, res) => {
  try {
    if (!activeRenderer) {
      return res.status(400).json({ error: 'No active cast session' });
    }

    await new Promise((resolve, reject) => {
      activeRenderer.play((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true, message: 'Playback resumed' });
  } catch (error) {
    console.error('Error resuming cast:', error);
    res.status(500).json({ error: 'Failed to resume', details: error.message });
  }
});

// API endpoint to stop casting
app.post('/api/cast/stop', async (req, res) => {
  try {
    if (!activeRenderer) {
      return res.status(400).json({ error: 'No active cast session' });
    }

    await new Promise((resolve, reject) => {
      activeRenderer.stop((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    activeRenderer = null;
    castingState = {
      isActive: false,
      device: null,
      episode: null,
      position: 0
    };

    res.json({ success: true, message: 'Casting stopped' });
  } catch (error) {
    console.error('Error stopping cast:', error);
    res.status(500).json({ error: 'Failed to stop', details: error.message });
  }
});

// API endpoint to get current cast status
app.get('/api/cast/status', (req, res) => {
  res.json(castingState);
});

app.listen(PORT, () => {
  console.log(`Audio player server running at http://localhost:${PORT}`);
  console.log(`Username: ${process.env.PLAYER_USERNAME || 'admin'}`);
  console.log(`Password: ${process.env.PLAYER_PASSWORD || 'changeme'}`);
  console.log('\nIMPORTANT: Change default credentials in .env file!');
});
