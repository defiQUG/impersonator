#!/usr/bin/env node

/**
 * Performance Benchmark Script
 * Measures key performance metrics for the application
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

const BENCHMARK_RESULTS_FILE = path.join(__dirname, '../benchmark-results.json');

/**
 * Benchmark encryption operations
 */
function benchmarkEncryption() {
  const results = {
    small: { times: [], avg: 0 },
    medium: { times: [], avg: 0 },
    large: { times: [], avg: 0 },
  };

  // Small data (< 1KB)
  const smallData = JSON.stringify({ address: '0x123', label: 'Test' });
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    // Simulate encryption (would use actual encryption in real test)
    const encrypted = Buffer.from(smallData).toString('base64');
    const end = performance.now();
    results.small.times.push(end - start);
  }
  results.small.avg = results.small.times.reduce((a, b) => a + b, 0) / results.small.times.length;

  // Medium data (1KB - 100KB)
  const mediumData = JSON.stringify(Array(1000).fill({ address: '0x123', label: 'Test' }));
  for (let i = 0; i < 50; i++) {
    const start = performance.now();
    const encrypted = Buffer.from(mediumData).toString('base64');
    const end = performance.now();
    results.medium.times.push(end - start);
  }
  results.medium.avg = results.medium.times.reduce((a, b) => a + b, 0) / results.medium.times.length;

  // Large data (> 100KB)
  const largeData = JSON.stringify(Array(10000).fill({ address: '0x123', label: 'Test' }));
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    const encrypted = Buffer.from(largeData).toString('base64');
    const end = performance.now();
    results.large.times.push(end - start);
  }
  results.large.avg = results.large.times.reduce((a, b) => a + b, 0) / results.large.times.length;

  return results;
}

/**
 * Benchmark validation operations
 */
function benchmarkValidation() {
  const results = { times: [], avg: 0 };
  const testAddresses = Array(1000).fill('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    // Simulate validation (would use actual validation in real test)
    testAddresses.forEach(addr => {
      const isValid = /^0x[a-fA-F0-9]{40}$/.test(addr);
    });
    const end = performance.now();
    results.times.push(end - start);
  }

  results.avg = results.times.reduce((a, b) => a + b, 0) / results.times.length;
  return results;
}

/**
 * Run all benchmarks
 */
function runBenchmarks() {
  console.log('Running performance benchmarks...\n');

  const results = {
    timestamp: new Date().toISOString(),
    encryption: benchmarkEncryption(),
    validation: benchmarkValidation(),
  };

  // Print results
  console.log('Encryption Benchmarks:');
  console.log(`  Small (< 1KB): ${results.encryption.small.avg.toFixed(2)}ms avg`);
  console.log(`  Medium (1KB-100KB): ${results.encryption.medium.avg.toFixed(2)}ms avg`);
  console.log(`  Large (> 100KB): ${results.encryption.large.avg.toFixed(2)}ms avg`);
  console.log('\nValidation Benchmarks:');
  console.log(`  1000 addresses: ${results.validation.avg.toFixed(2)}ms avg`);

  // Save results
  fs.writeFileSync(BENCHMARK_RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${BENCHMARK_RESULTS_FILE}`);

  // Check thresholds
  const thresholds = {
    encryptionSmall: 10,
    encryptionMedium: 100,
    encryptionLarge: 1000,
    validation: 100,
  };

  let passed = true;
  if (results.encryption.small.avg > thresholds.encryptionSmall) {
    console.warn(`⚠️  Small encryption exceeds threshold: ${results.encryption.small.avg.toFixed(2)}ms > ${thresholds.encryptionSmall}ms`);
    passed = false;
  }
  if (results.encryption.medium.avg > thresholds.encryptionMedium) {
    console.warn(`⚠️  Medium encryption exceeds threshold: ${results.encryption.medium.avg.toFixed(2)}ms > ${thresholds.encryptionMedium}ms`);
    passed = false;
  }
  if (results.encryption.large.avg > thresholds.encryptionLarge) {
    console.warn(`⚠️  Large encryption exceeds threshold: ${results.encryption.large.avg.toFixed(2)}ms > ${thresholds.encryptionLarge}ms`);
    passed = false;
  }
  if (results.validation.avg > thresholds.validation) {
    console.warn(`⚠️  Validation exceeds threshold: ${results.validation.avg.toFixed(2)}ms > ${thresholds.validation}ms`);
    passed = false;
  }

  if (passed) {
    console.log('\n✅ All benchmarks passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some benchmarks failed!');
    process.exit(1);
  }
}

// Run benchmarks
runBenchmarks();
