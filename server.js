const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration for Cloudflare R2
const R2_CONFIG = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL || `https://${process.env.R2_BUCKET_NAME}.r2.cloudflarestorage.com`
};

/**
 * Episode metadata from R2 bucket
 * Auto-generated - last updated: 2025-11-16
 */
const episodes = [
    {
        "filename": "Gilles Peterson, Zakia Sewell sits in.mp3",
        "name": "Gilles Peterson, Zakia Sewell sits in",
        "date": "2025-11-16T21:15:30.340000+00:00",
        "size": 431602703,
        "episodeId": "unknown"
    },
    {
        "filename": "Gilles Peterson, Zakia Sewell sits in [m002m2gm].mp3",
        "name": "Gilles Peterson, Zakia Sewell sits in",
        "date": "2025-11-16T21:15:22.713000+00:00",
        "size": 171410951,
        "episodeId": "m002m2gm"
    },
    {
        "filename": "Gilles Peterson, D'Angelo Tribute (1).mp3",
        "name": "Gilles Peterson, D'Angelo Tribute (1)",
        "date": "2025-11-16T21:15:19.451000+00:00",
        "size": 431602459,
        "episodeId": "unknown"
    },
    {
        "filename": "Gilles Peterson, Charlotte Dos Santos.mp3",
        "name": "Gilles Peterson, Charlotte Dos Santos",
        "date": "2025-11-16T21:15:11.995000+00:00",
        "size": 431602703,
        "episodeId": "unknown"
    },
    {
        "filename": "Gilles Peterson, 01⧸11⧸2025.mp3",
        "name": "Gilles Peterson, 01⧸11⧸2025",
        "date": "2025-11-16T21:15:04.544000+00:00",
        "size": 431602703,
        "episodeId": "unknown"
    }
];

// API Endpoints

/**
 * GET /api/episodes
 * Returns list of available episodes with metadata
 */
app.get('/api/episodes', (req, res) => {
    try {
        // Sort by date descending (most recent first)
        const sortedEpisodes = [...episodes].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        res.json(sortedEpisodes);
    } catch (error) {
        console.error('Error fetching episodes:', error);
        res.status(500).json({ error: 'Failed to fetch episodes' });
    }
});

/**
 * GET /api/episode/:id
 * Returns single episode metadata
 */
app.get('/api/episode/:id', (req, res) => {
    try {
        const episode = episodes.find(ep => ep.episodeId === req.params.id);

        if (!episode) {
            return res.status(404).json({ error: 'Episode not found' });
        }

        res.json(episode);
    } catch (error) {
        console.error('Error fetching episode:', error);
        res.status(500).json({ error: 'Failed to fetch episode' });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        episodeCount: episodes.length
    });
});

/**
 * GET /
 * Basic info endpoint
 */
app.get('/', (req, res) => {
    res.json({
        name: 'GP Archive API',
        version: '1.0.0',
        endpoints: {
            episodes: '/api/episodes',
            episode: '/api/episode/:id',
            health: '/api/health'
        }
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`GP Archive API running on port ${PORT}`);
    console.log(`Episodes available: ${episodes.length}`);
});
