let episodes = [];
let gpEpisodes = [];
let mfdoomEpisodes = [];
let currentEpisode = null;
let isCasting = false;
let currentView = 'gp';
let lastSaveTime = 0;

const audioPlayer = document.getElementById('audioPlayer');
const playerDiv = document.getElementById('player');
const currentTitle = document.getElementById('currentTitle');
const currentDate = document.getElementById('currentDate');
const downloadBtn = document.getElementById('downloadBtn');
const episodeList = document.getElementById('episodeList');
const mfdoomList = document.getElementById('mfdoomList');
const gpSection = document.getElementById('gpSection');
const mfdoomSection = document.getElementById('mfdoomSection');
const viewToggle = document.getElementById('viewToggle');
const toggleIcon = document.getElementById('toggleIcon');
const pageTitle = document.getElementById('pageTitle');

// Casting UI elements
const menuBtn = document.getElementById('menuBtn');
const optionsMenu = document.getElementById('optionsMenu');
const downloadMenuBtn = document.getElementById('downloadMenuBtn');
const castMenuBtn = document.getElementById('castMenuBtn');
const castModal = document.getElementById('castModal');
const closeCastModalBtn = document.getElementById('closeCastModalBtn');
const scanDevicesBtn = document.getElementById('scanDevicesBtn');
const deviceListContent = document.getElementById('deviceListContent');
const castControls = document.getElementById('castControls');
const castingStatus = document.getElementById('castingStatus');
const activeCastDevice = document.getElementById('activeCastDevice');
const castingDevice = document.getElementById('castingDevice');
const pauseCastBtn = document.getElementById('pauseCastBtn');
const resumeCastBtn = document.getElementById('resumeCastBtn');
const stopCastBtn = document.getElementById('stopCastBtn');

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

        gpEpisodes = episodes.filter(ep => !ep.name.startsWith('MF DOOM'));
        mfdoomEpisodes = episodes.filter(ep => ep.name.startsWith('MF DOOM')).reverse();

        renderEpisodes();
        if (mfdoomEpisodes.length > 0) renderMFDoomEpisodes();

        // Resume saved position or auto-play most recent
        const savedPosition = loadPlaybackPosition();
        if (savedPosition) {
            const savedEpisode = episodes.find(ep => ep.name === savedPosition.episodeName);
            playEpisode(savedEpisode || gpEpisodes[0], savedEpisode ? savedPosition.currentTime : 0);
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

function playEpisode(episode) {
    currentEpisode = episode;

    // Update player UI
    currentTitle.textContent = formatTitle(episode.name);
    currentDate.textContent = formatDate(episode.modified);
    audioPlayer.src = episode.url;
    downloadBtn.style.display = 'block';
    playerDiv.style.display = 'block';

    // Update active state in list
    document.querySelectorAll('.episode-item').forEach((item) => {
        const isGp = item.classList.contains('gp-episode');
        const isMfdoom = item.classList.contains('mfdoom-episode');
        const itemIndex = parseInt(item.getAttribute('data-index'));
        const matches = (isGp && gpEpisodes[itemIndex] === episode) ||
                        (isMfdoom && mfdoomEpisodes[itemIndex] === episode);
        item.classList.toggle('active', matches);
    });

    // Play audio
    audioPlayer.play().catch(err => {
        console.error('Error playing audio:', err);
    });

    // Save current episode to localStorage
    try {
        localStorage.setItem('lastEpisode', episode.name);
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
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

// Casting functionality
// Three-dots menu (first level)
menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('Menu button clicked');
    optionsMenu.style.display = optionsMenu.style.display === 'none' ? 'block' : 'none';
});

// Download option
downloadMenuBtn.addEventListener('click', () => {
    optionsMenu.style.display = 'none';
    if (currentEpisode) {
        const link = document.createElement('a');
        link.href = currentEpisode.url;
        link.download = currentEpisode.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

// Cast option - opens modal
castMenuBtn.addEventListener('click', () => {
    optionsMenu.style.display = 'none';
    castModal.style.display = 'flex';
});

// Close modal button
closeCastModalBtn.addEventListener('click', () => {
    castModal.style.display = 'none';
});

// Click outside to close modal
castModal.addEventListener('click', (e) => {
    if (e.target === castModal) {
        castModal.style.display = 'none';
    }
});

// Click outside to close options menu
document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !optionsMenu.contains(e.target)) {
        optionsMenu.style.display = 'none';
    }
});

scanDevicesBtn.addEventListener('click', async () => {
    scanDevicesBtn.disabled = true;
    scanDevicesBtn.textContent = '🔍 Scanning...';
    deviceListContent.innerHTML = '<div class="loading">Scanning for devices...</div>';

    try {
        const response = await fetch('/api/cast/devices');
        if (!response.ok) throw new Error('Failed to scan devices');

        const devices = await response.json();

        if (devices.length === 0) {
            deviceListContent.innerHTML = '<div class="loading">No devices found. Make sure your devices are on the same network.</div>';
        } else {
            deviceListContent.innerHTML = devices.map(device => `
                <div class="device-item" data-location="${device.location}" data-name="${device.name}">
                    <div class="device-name">${device.name}</div>
                    <div class="device-type">${device.type} • ${device.address}</div>
                </div>
            `).join('');

            // Add click handlers to device items
            document.querySelectorAll('.device-item').forEach(item => {
                item.addEventListener('click', () => {
                    const location = item.dataset.location;
                    const name = item.dataset.name;
                    startCasting(location, name);
                });
            });
        }
    } catch (error) {
        console.error('Error scanning devices:', error);
        deviceListContent.innerHTML = '<div class="error">Failed to scan for devices. Please try again.</div>';
    } finally {
        scanDevicesBtn.disabled = false;
        scanDevicesBtn.textContent = '🔍 Scan for Devices';
    }
});

async function startCasting(deviceLocation, deviceName) {
    if (!currentEpisode) {
        alert('Please select an episode first');
        return;
    }

    console.log('Starting cast to:', deviceName, deviceLocation);

    try {
        const response = await fetch('/api/cast/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deviceLocation: deviceLocation,
                episodeName: currentEpisode.name
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cast failed:', errorText);
            throw new Error(`Failed to start casting: ${errorText}`);
        }

        const result = await response.json();
        console.log('Cast response:', result);

        isCasting = true;
        audioPlayer.pause();

        // Update UI
        castingStatus.style.display = 'flex';
        castingDevice.textContent = `Casting to ${deviceName}`;
        activeCastDevice.textContent = deviceName;
        castControls.style.display = 'block';
        deviceListContent.innerHTML = '';
        scanDevicesBtn.style.display = 'none';

        console.log('Casting started successfully');
    } catch (error) {
        console.error('Error starting cast:', error);
        alert(`Failed to start casting: ${error.message}`);
    }
}

pauseCastBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/cast/pause', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to pause');

        pauseCastBtn.style.display = 'none';
        resumeCastBtn.style.display = 'block';
    } catch (error) {
        console.error('Error pausing cast:', error);
        alert('Failed to pause. Please try again.');
    }
});

resumeCastBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/cast/resume', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to resume');

        resumeCastBtn.style.display = 'none';
        pauseCastBtn.style.display = 'block';
    } catch (error) {
        console.error('Error resuming cast:', error);
        alert('Failed to resume. Please try again.');
    }
});

stopCastBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/cast/stop', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to stop');

        isCasting = false;
        castingStatus.style.display = 'none';
        castControls.style.display = 'none';
        scanDevicesBtn.style.display = 'block';
        pauseCastBtn.style.display = 'block';
        resumeCastBtn.style.display = 'none';
        castModal.style.display = 'none';

        console.log('Casting stopped');
    } catch (error) {
        console.error('Error stopping cast:', error);
        alert('Failed to stop casting. Please try again.');
    }
});

// Playback position save/load
function savePlaybackPosition(episodeName, currentTime, duration) {
    if (currentTime < 30 || currentTime > duration * 0.95) return;
    try {
        localStorage.setItem('gp_playback_position', JSON.stringify({
            episodeName, currentTime, duration, savedAt: Date.now()
        }));
    } catch (e) {}
}

function loadPlaybackPosition() {
    try {
        const saved = localStorage.getItem('gp_playback_position');
        if (!saved) return null;
        const data = JSON.parse(saved);
        if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('gp_playback_position');
            return null;
        }
        return data;
    } catch (e) { return null; }
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
            toggleIcon.insertAdjacentHTML('afterend', '<span id="gpIcon" style="font-size:24px;">🎵</span>');
        }
        viewToggle.title = 'Switch to GP';
        pageTitle.textContent = 'MF DOOM: Long Island to Leeds';
    } else {
        currentView = 'gp';
        gpSection.style.display = 'block';
        mfdoomSection.style.display = 'none';
        const gpIcon = document.getElementById('gpIcon');
        if (gpIcon) gpIcon.remove();
        toggleIcon.style.display = 'block';
        viewToggle.title = 'Switch to MF DOOM';
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
