# Installation & Setup

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **pnpm** 9.x or higher (or npm/yarn)
- **Git** for version control
- A code editor (VS Code recommended)

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd impersonator
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# WalletConnect Project ID
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id

# Optional: Tenderly API Key (for fork simulation)
TENDERLY_API_KEY=your_tenderly_api_key

# Optional: Sentry DSN (for error tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

#### Getting a WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID
4. Add it to your `.env.local` file

### 4. Verify Installation

```bash
# Check Node version
node --version  # Should be 18.x or higher

# Check pnpm version
pnpm --version  # Should be 9.x or higher

# Verify dependencies
pnpm list
```

## Development Setup

### Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### Development Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run security tests
pnpm test:security

# Run integration tests
pnpm test:integration

# Run all tests
pnpm test:all
```

## IDE Setup

### VS Code Recommended Extensions

Install the following VS Code extensions for the best development experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "orta.vscode-jest"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Project Structure

```
impersonator/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── providers.tsx      # Context providers
├── components/            # React components
│   ├── Body/              # Main body components
│   ├── SmartWallet/       # Smart wallet components
│   ├── TransactionExecution/ # Transaction components
│   └── Balance/           # Balance components
├── contexts/              # React contexts
│   ├── SafeInjectContext.tsx
│   ├── SmartWalletContext.tsx
│   └── TransactionContext.tsx
├── helpers/               # Helper functions
│   ├── communicator.ts   # Message communication
│   ├── smartWallet/      # Smart wallet helpers
│   ├── transaction/      # Transaction helpers
│   └── balance/          # Balance helpers
├── utils/                 # Utility functions
│   ├── security.ts       # Security utilities
│   ├── encryption.ts     # Encryption utilities
│   ├── monitoring.ts     # Monitoring service
│   └── constants.ts      # Application constants
├── __tests__/            # Test files
│   ├── security.test.ts
│   ├── encryption.test.ts
│   └── integration/      # Integration tests
├── docs/                 # Documentation
├── public/               # Static assets
├── style/                # Styles and themes
├── types.ts              # TypeScript type definitions
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── next.config.js        # Next.js configuration
└── jest.config.js        # Jest configuration
```

## Configuration Files

### TypeScript Configuration (`tsconfig.json`)

The project uses strict TypeScript configuration:
- Strict mode enabled
- Path aliases configured (`@/` for root)
- Next.js types included

### Next.js Configuration (`next.config.js`)

Key configurations:
- Webpack fallbacks for Node.js modules
- Styled-components support
- Environment variable handling

### Jest Configuration (`jest.config.js`)

Test configuration:
- jsdom environment
- Path aliases
- Coverage thresholds
- Test file patterns

## Database/Storage

The application uses browser storage:
- **localStorage** - Encrypted storage for wallet configs and transactions
- **sessionStorage** - Encryption keys and session data

No external database is required for basic functionality.

## Network Configuration

### Supported Networks

The application supports the following networks:
- Ethereum Mainnet (1)
- Goerli Testnet (5)
- Polygon (137)
- Arbitrum (42161)
- Optimism (10)
- Base (8453)
- Gnosis Chain (100)
- BSC (56)
- Fantom (250)
- Avalanche (43114)

### RPC Endpoints

RPC endpoints are configured per network. You can:
- Use default public RPCs
- Configure custom RPCs via environment variables
- Use Tenderly forks for testing

## Troubleshooting Setup

### Common Issues

#### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

#### Dependency Installation Issues

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### TypeScript Errors

```bash
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

#### Environment Variables Not Loading

- Ensure `.env.local` is in the root directory
- Restart the development server
- Variables must start with `NEXT_PUBLIC_` for client-side access

### Verification Checklist

- [ ] Node.js 18+ installed
- [ ] pnpm 9+ installed
- [ ] Dependencies installed successfully
- [ ] `.env.local` file created with required variables
- [ ] Development server starts without errors
- [ ] Tests run successfully
- [ ] Linter passes

## Next Steps

Once setup is complete:
1. Read the [Development Guide](./04-development.md)
2. Review the [API Reference](./05-api-reference.md)
3. Check the [Security Guide](./06-security.md)
4. Explore the [Testing Guide](./07-testing.md)

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Chakra UI Documentation](https://chakra-ui.com/)
- [ethers.js Documentation](https://docs.ethers.org/)
