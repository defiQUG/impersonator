# Performance Benchmarking Guide

This guide explains how to run and interpret performance benchmarks.

## Running Benchmarks

### Run All Benchmarks

```bash
pnpm benchmark
```

This will:
1. Benchmark encryption operations (small, medium, large data)
2. Benchmark validation operations
3. Save results to `benchmark-results.json`
4. Check against performance thresholds

## Benchmark Results

### Encryption Benchmarks

- **Small (< 1KB):** Target < 10ms
- **Medium (1KB-100KB):** Target < 100ms
- **Large (> 100KB):** Target < 1000ms

### Validation Benchmarks

- **1000 addresses:** Target < 100ms

## Interpreting Results

### Good Performance

```
Encryption Benchmarks:
  Small (< 1KB): 5.23ms avg ✅
  Medium (1KB-100KB): 45.67ms avg ✅
  Large (> 100KB): 234.12ms avg ✅

Validation Benchmarks:
  1000 addresses: 67.89ms avg ✅

✅ All benchmarks passed!
```

### Poor Performance

```
Encryption Benchmarks:
  Small (< 1KB): 15.23ms avg ⚠️
  Medium (1KB-100KB): 150.67ms avg ⚠️
  Large (> 100KB): 2340.12ms avg ❌

Validation Benchmarks:
  1000 addresses: 200.89ms avg ⚠️

⚠️  Small encryption exceeds threshold: 15.23ms > 10ms
⚠️  Medium encryption exceeds threshold: 150.67ms > 100ms
❌ Large encryption exceeds threshold: 2340.12ms > 1000ms
⚠️  Validation exceeds threshold: 200.89ms > 100ms

❌ Some benchmarks failed!
```

## CI/CD Integration

Benchmarks run automatically:
- Weekly on Sunday (via cron)
- On pull requests to `main`
- Manual workflow dispatch

See `.github/workflows/performance.yml` for configuration.

## Customizing Benchmarks

### Adjust Thresholds

Edit `scripts/performance-benchmark.js`:

```javascript
const thresholds = {
  encryptionSmall: 10,    // Adjust as needed
  encryptionMedium: 100,  // Adjust as needed
  encryptionLarge: 1000,  // Adjust as needed
  validation: 100,        // Adjust as needed
};
```

### Add New Benchmarks

```javascript
function benchmarkNewFeature() {
  const results = { times: [], avg: 0 };
  
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    // Your code here
    const end = performance.now();
    results.times.push(end - start);
  }
  
  results.avg = results.times.reduce((a, b) => a + b, 0) / results.times.length;
  return results;
}
```

## Performance Optimization Tips

### Encryption

- Use Web Workers for large data
- Cache encryption keys
- Batch operations when possible

### Validation

- Use regex efficiently
- Cache validation results
- Batch validations

### General

- Profile before optimizing
- Measure real-world usage
- Set realistic targets

## Resources

- [Performance Benchmark Script](../scripts/performance-benchmark.js)
- [CI/CD Workflow](../.github/workflows/performance.yml)
