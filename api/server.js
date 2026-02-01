const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

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
 * Auto-generated - last updated: 2026-02-01
 */
const episodes = [
    {
        "filename": "2026-02-01 Gilles Peterson - Stewart Lee in conversation.mp3",
        "name": "2026-02-01 Gilles Peterson - Stewart Lee in conversation",
        "date": "2026-02-01T17:45:27.498000+00:00",
        "size": 175684895,
        "episodeId": "unknown"
    },
    {
        "filename": "2026-01-25 Gilles Peterson - Dusty grooves from Chicago and words from Jill Scott.mp3",
        "name": "2026-01-25 Gilles Peterson - Dusty grooves from Chicago and words from Jill Scott",
        "date": "2026-01-25T14:26:37.429000+00:00",
        "size": 173732879,
        "episodeId": "unknown"
    },
    {
        "filename": "2025-10-18 Gilles Peterson - D'Angelo Tribute.mp3",
        "name": "2025-10-18 Gilles Peterson - D'Angelo Tribute",
        "date": "2026-01-23T09:19:41.283000+00:00",
        "size": 431602459,
        "episodeId": "unknown"
    },
    {
        "filename": "2025-10-25 Gilles Peterson - Charlotte Dos Santos.mp3",
        "name": "2025-10-25 Gilles Peterson - Charlotte Dos Santos",
        "date": "2026-01-23T09:19:15.890000+00:00",
        "size": 431602703,
        "episodeId": "unknown"
    },
    {
        "filename": "2025-11-01 Gilles Peterson.mp3",
        "name": "2025-11-01 Gilles Peterson",
        "date": "2026-01-23T09:18:40.302000+00:00",
        "size": 431602703,
        "episodeId": "unknown"
    },
    {
        "filename": "2025-11-08 Gilles Peterson - Zakia Sewell sits in.mp3",
        "name": "2025-11-08 Gilles Peterson - Zakia Sewell sits in",
        "date": "2026-01-23T09:18:16.401000+00:00",
        "size": 431602703,
        "episodeId": "unknown"
    },
    {
        "filename": "2025-11-15 Gilles Peterson - Zakia Sewell sits in.mp3",
        "name": "2025-11-15 Gilles Peterson - Zakia Sewell sits in",
        "date": "2026-01-23T09:17:59.549000+00:00",
        "size": 171410951,
        "episodeId": "unknown"
    },
    {
        "filename": "2025-11-29 Gilles Peterson - Femi Koleoso sits in.mp3",
        "name": "2025-11-29 Gilles Peterson - Femi Koleoso sits in",
        "date": "2026-01-23T09:17:38.722000+00:00",
        "size": 208666624,
        "episodeId": "unknown"
    },
    {
        "filename": "2025-12-06 Gilles Peterson - Jamie Woon at Maida Vale.mp3",
        "name": "2025-12-06 Gilles Peterson - Jamie Woon at Maida Vale",
        "date": "2026-01-23T09:17:32.134000+00:00",
        "size": 431602703,
        "episodeId": "unknown"
    },
    {
        "filename": "2025-12-13 Gilles Peterson.mp3",
        "name": "2025-12-13 Gilles Peterson",
        "date": "2026-01-23T09:17:17.869000+00:00",
        "size": 431602703,
        "episodeId": "unknown"
    },
    {
        "filename": "2025-12-20 Gilles Peterson - keiyaA Best of 2025 Part 1.mp3",
        "name": "2025-12-20 Gilles Peterson - keiyaA Best of 2025 Part 1",
        "date": "2026-01-23T09:17:03.460000+00:00",
        "size": 431602703,
        "episodeId": "unknown"
    },
    {
        "filename": "2025-12-27 Gilles Peterson - Best of 2025 Part 2.mp3",
        "name": "2025-12-27 Gilles Peterson - Best of 2025 Part 2",
        "date": "2026-01-23T09:16:39.868000+00:00",
        "size": 431602703,
        "episodeId": "unknown"
    },
    {
        "filename": "2026-01-03 Gilles Peterson - Best of 2025 Part 3.mp3",
        "name": "2026-01-03 Gilles Peterson - Best of 2025 Part 3",
        "date": "2026-01-23T09:16:13.599000+00:00",
        "size": 431602703,
        "episodeId": "unknown"
    },
    {
        "filename": "2026-01-10 Gilles Peterson.mp3",
        "name": "2026-01-10 Gilles Peterson",
        "date": "2026-01-23T09:15:59.223000+00:00",
        "size": 431602703,
        "episodeId": "unknown"
    },
    {
        "filename": "2026-01-18 Gilles Peterson - Gary Bartz in conversation.mp3",
        "name": "2026-01-18 Gilles Peterson - Gary Bartz in conversation",
        "date": "2026-01-23T09:15:29.304000+00:00",
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
