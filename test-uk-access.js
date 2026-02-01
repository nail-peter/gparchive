const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();

async function testUKAccess() {
  console.log('Testing UK access to BBC...\n');

  // Setup proxy if not using VPN
  let axiosConfig = {};
  if (process.env.USE_VPN !== 'true') {
    const proxyUrl = `http://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
    const proxyAgent = new HttpsProxyAgent(proxyUrl);
    axiosConfig.httpsAgent = proxyAgent;
    axiosConfig.httpAgent = proxyAgent;
    console.log(`Using proxy: ${process.env.PROXY_HOST}:${process.env.PROXY_PORT}\n`);
  } else {
    console.log('Using VPN mode (no proxy configured)\n');
  }

  // Test 1: Check your current IP location
  try {
    console.log('1. Checking your IP location...');
    const ipResponse = await axios.get('https://ipapi.co/json/', axiosConfig);
    console.log(`   Your IP: ${ipResponse.data.ip}`);
    console.log(`   Country: ${ipResponse.data.country_name} (${ipResponse.data.country})`);
    console.log(`   City: ${ipResponse.data.city}`);

    if (ipResponse.data.country !== 'GB') {
      console.log('   ⚠️  WARNING: You are not appearing as UK! BBC content will be blocked.\n');
    } else {
      console.log('   ✓ You appear to be in the UK!\n');
    }
  } catch (error) {
    console.log('   ✗ Failed to check IP location:', error.message, '\n');
  }

  // Test 2: Try accessing BBC Sounds
  try {
    console.log('2. Testing BBC Sounds access...');
    const bbcResponse = await axios.get('https://www.bbc.co.uk/sounds', axiosConfig);
    console.log('   ✓ BBC Sounds is accessible\n');
  } catch (error) {
    console.log('   ✗ Failed to access BBC Sounds:', error.message, '\n');
  }

  // Test 3: Check if we can get program data
  try {
    console.log('3. Testing program data access...');
    const programResponse = await axios.get('https://www.bbc.co.uk/sounds/_next/data/ee69821/play/m002l17p.json', axiosConfig);
    const isInUK = programResponse.data?.pageProps?.isInUK;
    console.log(`   BBC thinks you are in UK: ${isInUK ? '✓ YES' : '✗ NO'}`);

    if (!isInUK) {
      console.log('   ⚠️  You need a UK VPN or UK proxy to download BBC content!\n');
    } else {
      console.log('   ✓ You should be able to download BBC content!\n');
    }
  } catch (error) {
    console.log('   ✗ Failed to check program data:', error.message, '\n');
  }

  console.log('\n=== SUMMARY ===');
  console.log('To download BBC Sounds content, you need:');
  console.log('1. Connect to a UK VPN server (NordVPN, ExpressVPN, etc.)');
  console.log('   - OR -');
  console.log('2. Use a UK HTTP proxy (see .env file for services)');
  console.log('\nAfter connecting to UK, run this test again to verify.');
}

testUKAccess().catch(console.error);
