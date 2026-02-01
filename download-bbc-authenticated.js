const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

async function downloadWithAuth(episodeUrl) {
  const email = process.env.BBC_EMAIL;
  const password = process.env.BBC_PASSWORD;
  const archiveDir = process.env.ARCHIVE_DIR || './archive';

  if (!email || !password) {
    console.error('Error: BBC_EMAIL and BBC_PASSWORD must be set in .env file');
    process.exit(1);
  }

  console.log('Starting authenticated BBC Sounds download...');
  console.log(`Email: ${email}`);
  console.log(`Episode: ${episodeUrl}\n`);

  try {
    const command = `python -m yt_dlp --username "${email}" --password "${password}" -x --audio-format mp3 --audio-quality 320K -o "${archiveDir}/%(title)s.%(ext)s" "${episodeUrl}"`;

    console.log('Downloading...\n');
    const output = execSync(command, {
      stdio: 'inherit',
      maxBuffer: 1024 * 1024 * 100
    });

    console.log('\n✓ Download completed!');
  } catch (error) {
    console.error('\n✗ Download failed:', error.message);
    process.exit(1);
  }
}

const episodeUrl = process.argv[2] || 'https://www.bbc.co.uk/sounds/play/m002l17p';
downloadWithAuth(episodeUrl);
