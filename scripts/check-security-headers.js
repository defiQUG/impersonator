#!/usr/bin/env node

/**
 * Security Headers Check Script
 * Verifies that security headers are properly configured
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const REQUIRED_HEADERS = {
  'strict-transport-security': 'HSTS',
  'x-frame-options': 'X-Frame-Options',
  'x-content-type-options': 'X-Content-Type-Options',
  'x-xss-protection': 'X-XSS-Protection',
  'referrer-policy': 'Referrer-Policy',
  'content-security-policy': 'Content-Security-Policy',
  'permissions-policy': 'Permissions-Policy',
};

const OPTIONAL_HEADERS = {
  'x-dns-prefetch-control': 'X-DNS-Prefetch-Control',
};

function checkHeaders(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'HEAD',
      timeout: 5000,
    };

    const req = client.request(options, (res) => {
      const headers = res.headers;
      const results = {
        url,
        present: {},
        missing: [],
        warnings: [],
      };

      // Check required headers
      for (const [header, name] of Object.entries(REQUIRED_HEADERS)) {
        if (headers[header] || headers[name]) {
          results.present[header] = headers[header] || headers[name];
        } else {
          results.missing.push(name);
        }
      }

      // Check optional headers
      for (const [header, name] of Object.entries(OPTIONAL_HEADERS)) {
        if (!headers[header] && !headers[name]) {
          results.warnings.push(`${name} (optional)`);
        }
      }

      resolve(results);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function main() {
  const url = process.argv[2] || 'http://localhost:3000';
  console.log(`Checking security headers for ${url}...\n`);

  try {
    const results = await checkHeaders(url);

    console.log('Security Headers Status:');
    console.log('='.repeat(50));

    if (results.missing.length === 0) {
      console.log('✅ All required headers present:');
      for (const [header] of Object.entries(REQUIRED_HEADERS)) {
        if (results.present[header]) {
          console.log(`   ✓ ${REQUIRED_HEADERS[header]}`);
        }
      }
    } else {
      console.log('❌ Missing required headers:');
      results.missing.forEach(header => {
        console.log(`   ✗ ${header}`);
      });
    }

    if (results.warnings.length > 0) {
      console.log('\n⚠️  Optional headers not present:');
      results.warnings.forEach(header => {
        console.log(`   - ${header}`);
      });
    }

    console.log('\n' + '='.repeat(50));

    if (results.missing.length === 0) {
      console.log('✅ Security headers check passed!');
      process.exit(0);
    } else {
      console.log('❌ Security headers check failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error checking headers:', error.message);
    console.log('\nNote: Make sure the server is running at the specified URL');
    process.exit(1);
  }
}

main();
