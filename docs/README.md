# Impersonator Developer Documentation

Welcome to the Impersonator developer documentation! This comprehensive guide will help you understand, develop, and contribute to the Impersonator Smart Wallet system.

## 📚 Documentation Index

### Getting Started
- [Overview & Architecture](./01-overview.md) - System architecture and design principles
- [Installation & Setup](./02-setup.md) - Environment setup and installation guide
- [Project Structure](./03-structure.md) - Codebase organization and file structure

### Development Guides
- [Development Guide](./04-development.md) - Development workflow and best practices
- [API Reference](./05-api-reference.md) - Complete API documentation
- [Security Guide](./06-security.md) - Security features and best practices

### Testing & Quality
- [Testing Guide](./07-testing.md) - Testing strategies and test execution
- [Code Quality](./08-code-quality.md) - Linting, formatting, and code standards

### Deployment & Operations
- [Deployment Guide](./09-deployment.md) - Production deployment procedures
- [Monitoring & Logging](./10-monitoring.md) - Monitoring setup and error tracking

### Contributing
- [Contributing Guide](./11-contributing.md) - How to contribute to the project
- [Troubleshooting](./12-troubleshooting.md) - Common issues and solutions
- [Recommendations & Next Steps](./RECOMMENDATIONS_AND_NEXT_STEPS.md) - Complete list of recommendations and future enhancements

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## 📖 Key Concepts

### Smart Wallet Aggregation
Impersonator allows you to aggregate multiple wallets into a single smart wallet, enabling:
- Multi-signature transactions
- Owner management
- Threshold configuration
- Transaction approval workflows

### Connection Methods
The system supports three connection methods:
1. **WalletConnect** - Connect via WalletConnect protocol
2. **iFrame** - Embed dApps in iframe with Safe App SDK
3. **Browser Extension** - Connect via browser extension

### Security Features
- Encrypted storage for sensitive data
- Comprehensive input validation
- Rate limiting and nonce management
- Replay attack prevention
- Access control and authorization

## 🛠️ Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Library:** Chakra UI
- **Blockchain:** ethers.js, wagmi, viem
- **Wallet:** WalletConnect v2, Safe App SDK
- **Testing:** Jest, React Testing Library
- **CI/CD:** GitHub Actions

## 📞 Support

For questions or issues:
- Check the [Troubleshooting Guide](./12-troubleshooting.md)
- Review [Security Documentation](./06-security.md)
- Open an issue on GitHub

## 📄 License

See [LICENSE.md](../LICENSE.md) for license information.
