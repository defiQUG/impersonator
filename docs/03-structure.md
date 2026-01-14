# Project Structure

This document provides a detailed overview of the project's file structure and organization.

## Directory Structure

```
impersonator/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Home page component
│   ├── providers.tsx            # Global context providers
│   └── icon.png                # App icon
│
├── components/                   # React components
│   ├── Body/                    # Main body components
│   │   ├── index.tsx           # Main body orchestrator
│   │   ├── TabsSelect.tsx     # Tab navigation
│   │   ├── WalletConnectTab/  # WalletConnect integration
│   │   ├── IFrameConnectTab/  # iFrame integration
│   │   ├── BrowserExtensionTab.tsx
│   │   ├── TransactionRequests.tsx
│   │   ├── AddressInput/       # Address input with ENS
│   │   ├── NetworkInput.tsx    # Network selection
│   │   └── TenderlySettings.tsx
│   │
│   ├── SmartWallet/            # Smart wallet components
│   │   ├── WalletManager.tsx  # Wallet list and selection
│   │   ├── OwnerManagement.tsx # Owner and threshold management
│   │   └── DeployWallet.tsx   # New wallet deployment
│   │
│   ├── TransactionExecution/   # Transaction components
│   │   ├── TransactionBuilder.tsx    # Transaction creation
│   │   ├── TransactionApproval.tsx  # Approval interface
│   │   └── TransactionHistory.tsx   # Transaction list
│   │
│   ├── Balance/                 # Balance components
│   │   ├── WalletBalance.tsx   # Balance display
│   │   └── AddToken.tsx        # Add custom token
│   │
│   ├── layouts/                 # Layout components
│   ├── Navbar.tsx              # Navigation bar
│   ├── Footer.tsx              # Footer component
│   ├── ErrorBoundary.tsx       # Error boundary
│   └── CustomConnectButton.tsx
│
├── contexts/                     # React contexts
│   ├── SafeInjectContext.tsx   # iFrame communication context
│   ├── SmartWalletContext.tsx  # Smart wallet state
│   └── TransactionContext.tsx  # Transaction state
│
├── helpers/                      # Helper functions
│   ├── communicator.ts         # Message communication
│   ├── messageFormatter.ts     # Message formatting
│   ├── utils.ts                # General utilities
│   │
│   ├── smartWallet/            # Smart wallet helpers
│   │   ├── gnosisSafe.ts      # Gnosis Safe integration
│   │   └── erc4337.ts         # ERC-4337 (placeholder)
│   │
│   ├── transaction/            # Transaction helpers
│   │   └── execution.ts       # Transaction execution
│   │
│   └── balance/                # Balance helpers
│       └── index.ts           # Balance fetching
│
├── utils/                       # Utility functions
│   ├── security.ts             # Security utilities
│   ├── encryption.ts           # Encryption utilities
│   ├── monitoring.ts           # Monitoring service
│   └── constants.ts            # Application constants
│
├── __tests__/                   # Test files
│   ├── security.test.ts       # Security utility tests
│   ├── encryption.test.ts     # Encryption tests
│   ├── rateLimiter.test.ts    # Rate limiter tests
│   ├── nonceManager.test.ts   # Nonce manager tests
│   └── integration/           # Integration tests
│       ├── walletManagement.test.ts
│       ├── transactionFlow.test.ts
│       └── multisigApproval.test.ts
│
├── docs/                        # Documentation
│   ├── README.md              # Documentation index
│   ├── 01-overview.md         # Architecture overview
│   ├── 02-setup.md            # Setup guide
│   ├── 03-structure.md        # This file
│   └── ...                    # Other documentation
│
├── public/                      # Static assets
│   └── ...                    # Images, icons, etc.
│
├── style/                       # Styles and themes
│   └── theme.ts               # Chakra UI theme
│
├── types.ts                     # TypeScript type definitions
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── next.config.js               # Next.js configuration
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Jest setup
├── vercel.json                  # Vercel deployment config
└── README.md                    # Project README
```

## Key Files Explained

### Application Entry Points

#### `app/layout.tsx`
Root layout component that wraps all pages. Sets up metadata and global layout structure.

#### `app/page.tsx`
Main home page component. Renders the main application interface.

#### `app/providers.tsx`
Sets up all global React contexts:
- Chakra UI provider
- Wagmi configuration
- RainbowKit provider
- SafeInject provider
- SmartWallet provider
- Transaction provider
- Error boundary

### Core Components

#### `components/Body/index.tsx`
Main orchestrator component that:
- Manages connection methods (WalletConnect, iFrame, Extension)
- Handles address resolution
- Manages network selection
- Coordinates transaction creation
- Renders appropriate tabs

#### `components/SmartWallet/WalletManager.tsx`
Manages smart wallet list:
- Displays configured wallets
- Allows wallet selection
- Connects to existing wallets
- Opens deployment modal

#### `components/TransactionExecution/TransactionBuilder.tsx`
Transaction creation interface:
- Native token transfers
- ERC20 token transfers
- Raw transaction data
- Gas estimation

### Context Providers

#### `contexts/SafeInjectContext.tsx`
Manages iframe communication:
- Safe App SDK integration
- postMessage handling
- Transaction forwarding
- Safe info retrieval

#### `contexts/SmartWalletContext.tsx`
Manages smart wallet state:
- Wallet configuration
- Owner management
- Threshold configuration
- Balance tracking
- Encrypted storage

#### `contexts/TransactionContext.tsx`
Manages transaction lifecycle:
- Transaction creation
- Approval workflow
- Execution methods
- Transaction history
- Rate limiting
- Nonce management

### Helper Modules

#### `helpers/communicator.ts`
Secure message communication:
- Message validation
- Replay protection
- Origin validation
- Message routing

#### `helpers/smartWallet/gnosisSafe.ts`
Gnosis Safe integration:
- Safe contract interaction
- Safe SDK usage
- Safe deployment
- Safe info retrieval

#### `helpers/transaction/execution.ts`
Transaction execution:
- Direct on-chain execution
- Relayer execution
- Transaction simulation
- Gas estimation

### Utility Modules

#### `utils/security.ts`
Security utilities:
- Address validation
- Transaction validation
- Rate limiting
- Nonce management
- Input sanitization

#### `utils/encryption.ts`
Encryption utilities:
- AES-GCM encryption
- PBKDF2 key derivation
- Secure storage wrapper
- Session key management

#### `utils/monitoring.ts`
Monitoring service:
- Centralized logging
- Error tracking
- Security event tracking
- Performance metrics

#### `utils/constants.ts`
Application constants:
- Security constants
- Network constants
- Storage keys
- Error messages
- Default values

## Type Definitions

### `types.ts`
Central type definitions including:
- `SmartWalletConfig` - Wallet configuration
- `TransactionRequest` - Transaction data
- `SafeInfo` - Safe contract info
- `WalletBalance` - Balance information
- `TransactionStatus` - Transaction states
- SDK message types
- Network types

## Configuration Files

### `package.json`
- Dependencies
- Scripts
- Project metadata

### `tsconfig.json`
TypeScript configuration:
- Compiler options
- Path aliases
- Type definitions

### `next.config.js`
Next.js configuration:
- Webpack settings
- Environment variables
- Build optimizations

### `jest.config.js`
Jest test configuration:
- Test environment
- Coverage settings
- Module resolution

## File Naming Conventions

### Components
- PascalCase: `WalletManager.tsx`
- One component per file
- Descriptive names

### Utilities
- camelCase: `security.ts`
- Descriptive names
- Grouped by functionality

### Tests
- Same name as source file: `security.test.ts`
- Located in `__tests__/` directory
- Integration tests in `__tests__/integration/`

### Types
- PascalCase interfaces: `SmartWalletConfig`
- Enums: `TransactionStatus`
- Centralized in `types.ts`

## Import Patterns

### Absolute Imports
```typescript
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { validateAddress } from "@/utils/security";
```

### Relative Imports
```typescript
import WalletManager from "../SmartWallet/WalletManager";
import { getSafeInfo } from "../../helpers/smartWallet/gnosisSafe";
```

## Code Organization Principles

### 1. Separation of Concerns
- UI components separate from business logic
- Helpers separate from contexts
- Utilities separate from components

### 2. Single Responsibility
- Each file has one clear purpose
- Functions do one thing well
- Components are focused

### 3. Reusability
- Shared utilities in `utils/`
- Reusable components in `components/`
- Common helpers in `helpers/`

### 4. Type Safety
- All functions typed
- Interfaces for data structures
- Type guards where needed

## Adding New Features

### Adding a New Component
1. Create file in appropriate `components/` subdirectory
2. Export component
3. Add to parent component or page
4. Add tests in `__tests__/`

### Adding a New Helper
1. Create file in appropriate `helpers/` subdirectory
2. Export functions
3. Add JSDoc comments
4. Add tests

### Adding a New Utility
1. Create file in `utils/`
2. Export functions/classes
3. Add to constants if needed
4. Add tests

### Adding a New Context
1. Create file in `contexts/`
2. Export provider and hook
3. Add to `app/providers.tsx`
4. Add tests

## Best Practices

1. **Keep files focused** - One responsibility per file
2. **Use TypeScript** - Leverage type safety
3. **Add JSDoc** - Document public APIs
4. **Write tests** - Test new functionality
5. **Follow naming** - Use established conventions
6. **Group related code** - Keep related files together
7. **Avoid deep nesting** - Keep structure flat
8. **Use constants** - Extract magic numbers
