let episodes = [];
let currentEpisode = null;
let isCasting = false;

const audioPlayer = document.getElementById('audioPlayer');
const playerDiv = document.getElementById('player');
const currentTitle = document.getElementById('currentTitle');
const currentDate = document.getElementById('currentDate');
const downloadBtn = document.getElementById('downloadBtn');
const episodeList = document.getElementById('episodeList');

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
                    <span>${formatDate(ep.modified)}</span>
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

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
