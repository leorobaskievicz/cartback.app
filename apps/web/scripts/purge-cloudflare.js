#!/usr/bin/env node

/**
 * Script para fazer purge do cache do Cloudflare após deploy
 * Executado automaticamente no final do build
 */

const https = require('https');

const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!CLOUDFLARE_ZONE_ID || !CLOUDFLARE_API_TOKEN) {
  console.log('⚠️  Cloudflare credentials not found, skipping cache purge');
  process.exit(0); // Exit success, não é erro crítico
}

console.log('🔄 Purging Cloudflare cache...');

const data = JSON.stringify({
  purge_everything: true,
});

const options = {
  hostname: 'api.cloudflare.com',
  port: 443,
  path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Cloudflare cache purged successfully!');
      process.exit(0);
    } else {
      console.error(`❌ Failed to purge cache: ${res.statusCode}`);
      console.error(responseData);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error purging Cloudflare cache:', error.message);
  process.exit(1);
});

req.write(data);
req.end();
