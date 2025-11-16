// Configuration
const CONFIG = {
    // API endpoint for episode metadata (Railway)
    API_URL: 'https://gparchive-production.up.railway.app/api/episodes',
    // Cloudflare R2 public bucket URL
    R2_BUCKET_URL: 'https://pub-c7a65f7c81d04a2292a9597934dfd4a3.r2.dev'
};

let episodes = [];
let currentEpisode = null;

const audioPlayer = document.getElementById('audioPlayer');
const playerDiv = document.getElementById('player');
const currentTitle = document.getElementById('currentTitle');
const currentDate = document.getElementById('currentDate');
const episodeList = document.getElementById('episodeList');

// Load episodes on page load
window.addEventListener('DOMContentLoaded', loadEpisodes);

async function loadEpisodes() {
    try {
        const response = await fetch(CONFIG.API_URL);
        if (!response.ok) throw new Error('Failed to load episodes');

        episodes = await response.json();

        if (episodes.length === 0) {
            episodeList.innerHTML = '<div class="loading">No episodes available</div>';
            return;
        }

        renderEpisodes();

        // Auto-play most recent episode
        playEpisode(episodes[0]);
    } catch (error) {
        console.error('Error loading episodes:', error);
        episodeList.innerHTML = '<div class="error">Failed to load episodes. Please refresh the page.</div>';
    }
}

function renderEpisodes() {
    episodeList.innerHTML = episodes
        .map((ep, index) => `
            <div class="episode-item" data-index="${index}" onclick="playEpisode(episodes[${index}])">
                <div class="episode-item-title">${formatTitle(ep.name)}</div>
                <div class="episode-item-meta">
                    <span>${formatDate(ep.date)}</span>
                    <span>${formatSize(ep.size)}</span>
                </div>
            </div>
        `)
        .join('');
}

function playEpisode(episode) {
    currentEpisode = episode;

    // Build R2 URL for audio file
    const audioUrl = `${CONFIG.R2_BUCKET_URL}/${encodeURIComponent(episode.filename)}`;

    // Update player UI
    currentTitle.textContent = formatTitle(episode.name);
    currentDate.textContent = formatDate(episode.date);
    audioPlayer.src = audioUrl;
    playerDiv.style.display = 'block';

    // Update active state in list
    document.querySelectorAll('.episode-item').forEach((item, index) => {
        if (index === episodes.indexOf(episode)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Play audio
    audioPlayer.play().catch(err => {
        console.error('Error playing audio:', err);
    });

    // Save current episode to localStorage
    try {
        localStorage.setItem('lastEpisode', episode.filename);
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

// Helper functions
function formatTitle(name) {
    return name.replace(/\.mp3$/i, '').replace(/\s*\[.*?\]\s*/g, '');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatSize(bytes) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
