# 🎭 Impersonator 🕵️‍♂️

### Smart Wallet Aggregation System - Login into DApps by impersonating any Ethereum address via WalletConnect, iFrame, or Browser Extension!

<hr />

## 🌐 Website

**[https://www.impersonator.xyz/](https://www.impersonator.xyz/)**

## ✨ Features

- **Smart Wallet Aggregation** - Aggregate multiple wallets into a single smart wallet
- **Multi-Signature Support** - Gnosis Safe integration with owner management
- **Transaction Management** - Create, approve, and execute transactions with multi-sig workflows
- **Multiple Connection Methods** - WalletConnect, iFrame (Safe App SDK), Browser Extension
- **Secure Storage** - Encrypted storage for sensitive wallet data
- **Comprehensive Security** - Input validation, rate limiting, replay protection

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 9+ (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- [Getting Started](./docs/02-setup.md) - Installation and setup
- [Architecture Overview](./docs/01-overview.md) - System design
- [Development Guide](./docs/04-development.md) - Development workflow
- [API Reference](./docs/05-api-reference.md) - Complete API docs
- [Security Guide](./docs/06-security.md) - Security features
- [Testing Guide](./docs/07-testing.md) - Testing strategies

## 🔒 Security

The system implements comprehensive security measures:
- Encrypted storage (AES-GCM)
- Input validation and sanitization
- Access control and authorization
- Rate limiting and nonce management
- Replay attack prevention

See [Security Documentation](./docs/security/) for details.

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run security tests
pnpm test:security

# Run integration tests
pnpm test:integration
```

## 📖 Key Concepts

### Smart Wallet Aggregation
Aggregate multiple wallets into a single smart wallet with multi-signature capabilities.

### Connection Methods
- **WalletConnect** - Connect via WalletConnect protocol
- **iFrame** - Embed dApps with Safe App SDK
- **Browser Extension** - Connect via browser extension

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

## 📝 License

See [LICENSE.md](./LICENSE.md) for license information.

## 🤝 Contributing

See [Contributing Guide](./docs/11-contributing.md) for how to contribute.

## 📞 Support

- [Documentation](./docs/)
- [Troubleshooting](./docs/12-troubleshooting.md)
- [Security Guide](./docs/06-security.md)
