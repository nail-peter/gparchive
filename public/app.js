let episodes = [];
let gpEpisodes = [];
let mfdoomEpisodes = [];
let currentEpisode = null;
let lastSaveTime = 0;
let currentView = 'gp';

const audioPlayer = document.getElementById('audioPlayer');
const playerDiv = document.getElementById('player');
const currentTitle = document.getElementById('currentTitle');
const currentDate = document.getElementById('currentDate');
const episodeList = document.getElementById('episodeList');
const mfdoomList = document.getElementById('mfdoomList');
const gpSection = document.getElementById('gpSection');
const mfdoomSection = document.getElementById('mfdoomSection');
const viewToggle = document.getElementById('viewToggle');
const toggleIcon = document.getElementById('toggleIcon');
const pageTitle = document.getElementById('pageTitle');

// Load episodes on page load
window.addEventListener('DOMContentLoaded', loadEpisodes);

async function loadEpisodes() {
    try {
        const response = await fetch('/api/episodes');
        if (!response.ok) throw new Error('Failed to load episodes');

        episodes = await response.json();

        if (episodes.length === 0) {
            episodeList.innerHTML = '<div class="loading">No episodes available</div>';
            return;
        }

        // Split episodes into GP and MF DOOM
        gpEpisodes = episodes.filter(ep => !ep.name.startsWith('MF DOOM'));
        mfdoomEpisodes = episodes.filter(ep => ep.name.startsWith('MF DOOM')).reverse();

        renderEpisodes();

        // Render MF DOOM episodes but keep section hidden
        if (mfdoomEpisodes.length > 0) {
            renderMFDoomEpisodes();
        }

        // Check for saved playback position
        const savedPosition = loadPlaybackPosition();

        if (savedPosition) {
            const savedEpisode = episodes.find(ep => ep.name === savedPosition.episodeName);
            if (savedEpisode) {
                playEpisode(savedEpisode, savedPosition.currentTime);
            } else {
                playEpisode(gpEpisodes[0]);
            }
        } else {
            playEpisode(gpEpisodes[0]);
        }
    } catch (error) {
        console.error('Error loading episodes:', error);
        episodeList.innerHTML = '<div class="error">Failed to load episodes. Please refresh the page.</div>';
    }
}

function renderEpisodes() {
    episodeList.innerHTML = gpEpisodes
        .map((ep, index) => `
            <div class="episode-item gp-episode" data-index="${index}" onclick="playEpisode(gpEpisodes[${index}])">
                <div class="episode-item-title">${formatTitle(ep.name)}</div>
                <div class="episode-item-meta">
                    <span>${formatDate(ep.modified)}</span>
                    <span>${formatSize(ep.size)}</span>
                </div>
            </div>
        `)
        .join('');
}

function renderMFDoomEpisodes() {
    mfdoomList.innerHTML = mfdoomEpisodes
        .map((ep, index) => `
            <div class="episode-item mfdoom-episode" data-index="${index}" onclick="playEpisode(mfdoomEpisodes[${index}])">
                <div class="episode-item-title">${formatTitle(ep.name)}</div>
                <div class="episode-item-meta">
                    <span>${formatSize(ep.size)}</span>
                </div>
            </div>
        `)
        .join('');
}

function playEpisode(episode, startTime = 0) {
    currentEpisode = episode;

    currentTitle.textContent = formatTitle(episode.name);
    currentDate.textContent = formatDate(episode.modified);
    audioPlayer.src = episode.url;
    playerDiv.style.display = 'block';

    // Update active state in list
    document.querySelectorAll('.episode-item').forEach((item) => {
        const isGp = item.classList.contains('gp-episode');
        const isMfdoom = item.classList.contains('mfdoom-episode');
        const itemIndex = parseInt(item.getAttribute('data-index'));

        if ((isGp && gpEpisodes[itemIndex] === episode) ||
            (isMfdoom && mfdoomEpisodes[itemIndex] === episode)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    if (startTime > 0) {
        audioPlayer.currentTime = startTime;
    }

    audioPlayer.play().catch(err => {
        console.error('Error playing audio:', err);
    });
}

// Helper functions
function formatTitle(filename) {
    return filename.replace(/\.mp3$/i, '');
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

// Playback position saving/loading
function savePlaybackPosition(episodeName, currentTime, duration) {
    if (currentTime < 30 || currentTime > duration * 0.95) return;

    try {
        localStorage.setItem('gp_playback_position', JSON.stringify({
            episodeName,
            currentTime,
            duration,
            savedAt: Date.now()
        }));
    } catch (e) {
        console.warn('Could not save playback position:', e);
    }
}

function loadPlaybackPosition() {
    try {
        const saved = localStorage.getItem('gp_playback_position');
        if (!saved) return null;

        const data = JSON.parse(saved);
        const ageMs = Date.now() - data.savedAt;

        if (ageMs > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('gp_playback_position');
            return null;
        }

        return data;
    } catch (e) {
        console.warn('Could not load playback position:', e);
        return null;
    }
}

audioPlayer.addEventListener('timeupdate', () => {
    if (!currentEpisode) return;
    const t = audioPlayer.currentTime;
    if (t - lastSaveTime >= 10) {
        savePlaybackPosition(currentEpisode.name, t, audioPlayer.duration);
        lastSaveTime = t;
    }
});

audioPlayer.addEventListener('ended', () => {
    localStorage.removeItem('gp_playback_position');
});

// Series toggle
viewToggle.addEventListener('click', () => {
    if (currentView === 'gp') {
        currentView = 'mfdoom';
        gpSection.style.display = 'none';
        mfdoomSection.style.display = 'block';
        toggleIcon.style.display = 'none';
        if (!document.getElementById('gpIcon')) {
            toggleIcon.insertAdjacentHTML('afterend', '<span id="gpIcon" style="font-size: 24px;">🎵</span>');
        }
        viewToggle.setAttribute('title', 'Switch to GP');
        pageTitle.textContent = 'MF DOOM: Long Island to Leeds';
    } else {
        currentView = 'gp';
        gpSection.style.display = 'block';
        mfdoomSection.style.display = 'none';
        const gpIcon = document.getElementById('gpIcon');
        if (gpIcon) gpIcon.remove();
        toggleIcon.style.display = 'block';
        viewToggle.setAttribute('title', 'Switch to MF DOOM');
        pageTitle.textContent = 'GP Archive';
    }
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
