# Monitoring & Logging

Guide for monitoring, logging, and error tracking in the Impersonator system.

## Monitoring Service

The project includes a centralized monitoring service for logging and error tracking.

### Usage

```typescript
import { monitoring } from "@/utils/monitoring";

// Log messages
monitoring.debug("Debug message", { context });
monitoring.info("Info message", { context });
monitoring.warn("Warning message", { context });
monitoring.error("Error message", error, { context });

// Track events
monitoring.trackSecurityEvent("rate_limit_hit", { key: "address" });
monitoring.trackTransaction("created", "tx_123", { method: "direct" });
```

## Error Tracking Setup

### Sentry Integration

```typescript
// In app/providers.tsx or app/layout.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Initialize monitoring service
import { monitoring } from "@/utils/monitoring";
monitoring.initErrorTracking(Sentry);
```

## Log Levels

- **DEBUG:** Development debugging
- **INFO:** General information
- **WARN:** Warnings
- **ERROR:** Errors requiring attention

## Security Event Tracking

Track security-related events:
- Rate limit hits
- Validation failures
- Encryption failures
- Unauthorized access attempts

## Performance Monitoring

Monitor:
- Page load times
- API response times
- Transaction execution times
- Error rates
