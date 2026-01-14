# Deployment Guide

Complete guide for deploying the Impersonator Smart Wallet system to production.

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] Code coverage >80%
- [ ] Linter passes
- [ ] No TypeScript errors
- [ ] Code review completed

### Security
- [ ] Security audit completed
- [ ] All vulnerabilities addressed
- [ ] Environment variables configured
- [ ] HTTPS enforced
- [ ] Security headers set

### Configuration
- [ ] Environment variables set
- [ ] API keys configured
- [ ] RPC endpoints configured
- [ ] Error tracking setup
- [ ] Monitoring configured

## Environment Setup

### Production Environment Variables

Create `.env.production`:

```env
# WalletConnect
NEXT_PUBLIC_WC_PROJECT_ID=your_production_project_id

# Error Tracking (Sentry)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_FEATURE_X=true
```

### Build Configuration

Update `next.config.js` for production:

```javascript
module.exports = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};
```

## Build Process

### Local Build

```bash
# Build for production
pnpm build

# Test production build locally
pnpm start
```

### Build Verification

```bash
# Check build output
ls -la .next/

# Verify no errors
# Check bundle size
# Test production build
```

## Deployment Options

### Vercel (Recommended)

#### Setup

1. Connect GitHub repository
2. Configure environment variables
3. Set build command: `pnpm build`
4. Set output directory: `.next`
5. Deploy

#### Configuration

`vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

#### Environment Variables

Set in Vercel dashboard:
- `NEXT_PUBLIC_WC_PROJECT_ID`
- `NEXT_PUBLIC_SENTRY_DSN`
- Other production variables

### Other Platforms

#### Netlify

```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

## Post-Deployment

### Verification

1. **Functionality Check**
   - Test wallet connection
   - Test transaction creation
   - Test multi-sig approval
   - Test all features

2. **Performance Check**
   - Page load times
   - API response times
   - Bundle sizes
   - Lighthouse score

3. **Security Check**
   - HTTPS enforced
   - Security headers present
   - No console errors
   - No sensitive data exposed

### Monitoring Setup

#### Error Tracking (Sentry)

```typescript
// Initialize in app
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### Analytics

- Set up Google Analytics
- Configure event tracking
- Monitor user behavior
- Track errors

### Monitoring Checklist

- [ ] Error tracking active
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Alerts configured
- [ ] Dashboard setup

## Rollback Procedure

### Quick Rollback

1. Revert to previous deployment
2. Verify functionality
3. Check error logs
4. Notify team

### Rollback Steps

```bash
# Vercel
vercel rollback

# Or redeploy previous version
git checkout previous-version
pnpm build
# Deploy
```

## Maintenance

### Regular Updates

- **Dependencies:** Weekly
- **Security Patches:** Immediately
- **Feature Updates:** As needed
- **Performance:** Monthly review

### Update Process

1. Test in development
2. Run all tests
3. Security audit
4. Deploy to staging
5. Test staging
6. Deploy to production
7. Monitor closely

### Backup Strategy

- **Code:** Git repository
- **Configuration:** Environment variables documented
- **Data:** User data in encrypted storage (client-side)

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache
rm -rf .next node_modules
pnpm install
pnpm build
```

#### Runtime Errors

1. Check error logs
2. Verify environment variables
3. Check network connectivity
4. Review recent changes

#### Performance Issues

1. Check bundle size
2. Review network requests
3. Analyze performance metrics
4. Optimize slow operations

## Security Considerations

### Production Security

- **HTTPS:** Always enforced
- **Security Headers:** Configured
- **CSP:** Content Security Policy
- **HSTS:** HTTP Strict Transport Security
- **XSS Protection:** Enabled

### Data Protection

- **Encryption:** All sensitive data encrypted
- **Storage:** Secure storage used
- **Transmission:** HTTPS only
- **Keys:** Session-based keys

## Performance Optimization

### Build Optimizations

- Code splitting
- Tree shaking
- Minification
- Compression
- Image optimization

### Runtime Optimizations

- Caching strategies
- Lazy loading
- Memoization
- Debouncing
- Throttling

## Scaling Considerations

### Horizontal Scaling

- Stateless application
- CDN for static assets
- Load balancing
- Multiple regions

### Vertical Scaling

- Optimize bundle size
- Reduce memory usage
- Optimize database queries (if added)
- Cache aggressively

## Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Security Best Practices](https://nextjs.org/docs/going-to-production#security)
