let episodes = [];
let currentEpisode = null;
let lastSaveTime = 0; // Track when we last saved position

const audioPlayer = document.getElementById('audioPlayer');
const playerDiv = document.getElementById('player');
const currentTitle = document.getElementById('currentTitle');
const currentDate = document.getElementById('currentDate');
const downloadBtn = document.getElementById('downloadBtn');
const episodeList = document.getElementById('episodeList');

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

        renderEpisodes();

        // Check for saved playback position
        const savedPosition = loadPlaybackPosition();

        if (savedPosition) {
            // Find the episode that was saved
            const savedEpisode = episodes.find(ep => ep.name === savedPosition.episodeName);

            if (savedEpisode) {
                // Auto-resume from saved position
                playEpisode(savedEpisode, savedPosition.currentTime);
            } else {
                // Episode not found, auto-play most recent
                playEpisode(episodes[0]);
            }
        } else {
            // No saved position, auto-play most recent episode
            playEpisode(episodes[0]);
        }
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
                    <span>${formatDate(ep.modified)}</span>
                    <span>${formatSize(ep.size)}</span>
                </div>
            </div>
        `)
        .join('');
}

function playEpisode(episode, startTime = 0) {
    currentEpisode = episode;

    // Update player UI
    currentTitle.textContent = formatTitle(episode.name);
    currentDate.textContent = formatDate(episode.modified);
    audioPlayer.src = episode.url;
    downloadBtn.style.display = 'block';
    playerDiv.style.display = 'block';

    // Update active state in list
    document.querySelectorAll('.episode-item').forEach((item, index) => {
        if (index === episodes.indexOf(episode)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Set start time if resuming
    if (startTime > 0) {
        audioPlayer.currentTime = startTime;
    }

    // Play audio
    audioPlayer.play().catch(err => {
        console.error('Error playing audio:', err);
    });
}

downloadBtn.addEventListener('click', () => {
    if (currentEpisode) {
        const link = document.createElement('a');
        link.href = currentEpisode.url;
        link.download = currentEpisode.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

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

// Playback position saving/loading functions
function savePlaybackPosition(episodeName, currentTime, duration) {
    // Don't save if too early (< 30 seconds) or too late (> 95%)
    if (currentTime < 30 || currentTime > duration * 0.95) {
        return;
    }

    const data = {
        episodeName: episodeName,
        currentTime: currentTime,
        duration: duration,
        savedAt: Date.now()
    };

    try {
        localStorage.setItem('gp_playback_position', JSON.stringify(data));
    } catch (e) {
        console.warn('Could not save playback position:', e);
    }
}

function loadPlaybackPosition() {
    try {
        const saved = localStorage.getItem('gp_playback_position');
        if (!saved) return null;

        const data = JSON.parse(saved);

        // Check if position is less than 1 day old
        const ageMs = Date.now() - data.savedAt;
        const oneDayMs = 24 * 60 * 60 * 1000;

        if (ageMs > oneDayMs) {
            // Too old, clear it
            localStorage.removeItem('gp_playback_position');
            return null;
        }

        return data;
    } catch (e) {
        console.warn('Could not load playback position:', e);
        return null;
    }
}

// Auto-save playback position while playing
audioPlayer.addEventListener('timeupdate', () => {
    if (!currentEpisode) return;

    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration;

    // Save every 10 seconds
    if (currentTime - lastSaveTime >= 10) {
        savePlaybackPosition(currentEpisode.name, currentTime, duration);
        lastSaveTime = currentTime;
    }
});

// Clear saved position when episode ends
audioPlayer.addEventListener('ended', () => {
    localStorage.removeItem('gp_playback_position');
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
