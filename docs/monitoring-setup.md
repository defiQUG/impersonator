# Monitoring Setup Guide

This guide explains how to set up monitoring and error tracking for the Impersonator application.

## Sentry Setup

### 1. Create Sentry Account

1. Go to [https://sentry.io/](https://sentry.io/)
2. Sign up for a free account
3. Create a new project (select Next.js)

### 2. Get DSN

1. In your Sentry project, go to Settings → Client Keys (DSN)
2. Copy your DSN (it looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)

### 3. Configure Environment Variables

Add to your `.env.local` (development) or production environment:

```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

### 4. Verify Setup

1. Start your development server: `pnpm dev`
2. Trigger an error (e.g., navigate to a non-existent page)
3. Check your Sentry dashboard for the error

## Monitoring Dashboard Setup

### Option 1: Grafana Cloud (Free Tier)

1. **Sign up** at [https://grafana.com/](https://grafana.com/)
2. **Create a new stack** (free tier available)
3. **Install Grafana Agent** or use their hosted solution
4. **Configure data sources:**
   - Add Sentry as a data source
   - Add application metrics

### Option 2: Datadog (Paid)

1. Sign up at [https://www.datadoghq.com/](https://www.datadoghq.com/)
2. Install Datadog agent
3. Configure application monitoring
4. Set up dashboards

### Option 3: Self-Hosted Grafana

1. Install Grafana on your server
2. Configure Prometheus for metrics collection
3. Set up dashboards
4. Configure alerting

## Key Metrics to Monitor

### Application Metrics
- Error rate
- Response time
- Request count
- Active users

### Security Metrics
- Failed validations
- Rate limit hits
- Suspicious transactions
- Provider verification failures

### Performance Metrics
- Page load time
- API response time
- Encryption operation time
- Validation operation time

## Alerting Configuration

### Critical Alerts
- Error rate > 1%
- Response time > 1s
- Any security event
- Encryption failures

### Warning Alerts
- Error rate > 0.5%
- Response time > 500ms
- High rate limit hits

## Example Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Impersonator Monitoring",
    "panels": [
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(sentry_errors_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

## Monitoring Service Integration

The application includes a monitoring service (`utils/monitoring.ts`) that:

- Logs all events with different levels (DEBUG, INFO, WARN, ERROR)
- Tracks security events
- Tracks rate limit hits
- Tracks validation failures
- Integrates with Sentry for error tracking

### Usage

```typescript
import { monitoring } from '@/utils/monitoring';

// Log info
monitoring.info('User connected wallet', { address });

// Log error
monitoring.error('Transaction failed', error, { txId });

// Track security event
monitoring.trackSecurityEvent('suspicious_activity', { details });

// Track rate limit
monitoring.trackRateLimit(userAddress);
```

## Production Checklist

- [ ] Sentry DSN configured
- [ ] Monitoring dashboard set up
- [ ] Alerting rules configured
- [ ] Key metrics being tracked
- [ ] Error tracking verified
- [ ] Performance monitoring active
- [ ] Security event tracking active

## Troubleshooting

### Sentry Not Receiving Events

1. Check DSN is correct
2. Verify environment variable is set
3. Check Sentry project settings
4. Review browser console for errors

### Dashboard Not Showing Data

1. Verify data source connection
2. Check query syntax
3. Verify time range
4. Check data retention settings

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Monitoring Service Code](../utils/monitoring.ts)
