# Overview & Architecture

## System Overview

Impersonator is a smart wallet aggregation system that allows users to:
- Impersonate any Ethereum address for dApp interaction
- Aggregate multiple wallets into a single smart wallet
- Manage multi-signature wallets (Gnosis Safe)
- Execute transactions with approval workflows
- Connect via WalletConnect, iframe, or browser extension

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ WalletConnect│  │   iFrame     │  │  Extension   │      │
│  │     Tab      │  │     Tab      │  │     Tab      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Context Layer (State Management)          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ SafeInjectContext│  │SmartWalletContext│                │
│  │  (iFrame Comm)   │  │  (Wallet Mgmt)   │                │
│  └──────────────────┘  └──────────────────┘                │
│  ┌──────────────────┐                                       │
│  │TransactionContext│                                       │
│  │  (Tx Management) │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Communicator│  │ Gnosis Safe  │  │ Transaction │      │
│  │   (Messages) │  │   Helpers    │  │  Execution   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Balance    │  │   Relayers   │  │   Security  │      │
│  │   Helpers    │  │   Helpers    │  │   Utils     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Utility Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Security   │  │  Encryption  │  │  Monitoring  │      │
│  │   Utils      │  │   Utils      │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Blockchain Layer                           │
│              ethers.js | wagmi | viem                        │
│              Ethereum Provider                               │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Context Providers

#### SafeInjectContext
Manages iframe communication and Safe App SDK integration.
- Handles postMessage communication
- Manages iframe state
- Integrates with Safe App SDK protocol

#### SmartWalletContext
Manages smart wallet configuration and state.
- Wallet creation and connection
- Owner management
- Threshold configuration
- Balance tracking

#### TransactionContext
Manages transaction lifecycle and approvals.
- Transaction creation
- Multi-sig approval workflow
- Transaction execution
- Transaction history

### 2. Helper Modules

#### Communicator (`helpers/communicator.ts`)
- Secure message passing between iframe and parent
- Replay attack prevention
- Origin validation
- Message routing

#### Gnosis Safe Helpers (`helpers/smartWallet/gnosisSafe.ts`)
- Safe contract interaction
- Safe SDK integration
- Safe deployment
- Safe info retrieval

#### Transaction Execution (`helpers/transaction/execution.ts`)
- Direct on-chain execution
- Relayer execution
- Transaction simulation
- Gas estimation

#### Balance Helpers (`helpers/balance/index.ts`)
- Native token balance
- ERC20 token balance
- Token metadata retrieval

### 3. Security Utilities

#### Security Utils (`utils/security.ts`)
- Address validation
- Transaction validation
- Rate limiting
- Nonce management
- Input sanitization

#### Encryption Utils (`utils/encryption.ts`)
- AES-GCM encryption
- PBKDF2 key derivation
- Secure storage wrapper
- Session-based keys

#### Monitoring Service (`utils/monitoring.ts`)
- Centralized logging
- Error tracking
- Security event tracking
- Performance metrics

### 4. UI Components

#### Smart Wallet Components
- `WalletManager` - Wallet list and selection
- `OwnerManagement` - Owner and threshold management
- `DeployWallet` - New wallet deployment
- `WalletBalance` - Balance display

#### Transaction Components
- `TransactionBuilder` - Transaction creation
- `TransactionApproval` - Approval interface
- `TransactionHistory` - Transaction list

#### Connection Components
- `WalletConnectTab` - WalletConnect integration
- `IFrameConnectTab` - iFrame dApp integration
- `BrowserExtensionTab` - Extension information

## Data Flow

### Wallet Connection Flow

```
User Input (Address/ENS)
    │
    ▼
Address Validation
    │
    ▼
Network Selection
    │
    ▼
Provider Creation
    │
    ▼
Wallet Connection
    │
    ▼
Balance Fetch
    │
    ▼
UI Update
```

### Transaction Flow

```
Transaction Request
    │
    ▼
Input Validation
    │
    ▼
Gas Estimation
    │
    ▼
Transaction Creation
    │
    ▼
Multi-Sig Approval
    │
    ▼
Threshold Check
    │
    ▼
Execution Method
    ├─► Simulation
    ├─► Direct On-Chain
    └─► Relayer
    │
    ▼
Transaction Status
```

### Multi-Sig Approval Flow

```
Transaction Created
    │
    ▼
Owner Approval Request
    │
    ▼
Approval Validation
    ├─► Owner Check
    ├─► Duplicate Check
    └─► Lock Check
    │
    ▼
Approval Count Update
    │
    ▼
Threshold Check
    │
    ├─► Insufficient → Wait for More
    └─► Sufficient → Mark as Approved
    │
    ▼
Ready for Execution
```

## Design Principles

### 1. Security First
- All sensitive data encrypted
- Comprehensive input validation
- Access control on all operations
- Replay attack prevention
- Rate limiting

### 2. Modular Architecture
- Separation of concerns
- Reusable components
- Clear interfaces
- Dependency injection

### 3. Type Safety
- Full TypeScript coverage
- Strict type checking
- Interface definitions
- Type guards

### 4. Error Handling
- Graceful error handling
- User-friendly messages
- Error boundaries
- Comprehensive logging

### 5. Performance
- Efficient algorithms
- Proper cleanup
- Memory management
- Timeout protection

## Technology Choices

### Why Next.js 14?
- Server-side rendering support
- App Router for modern routing
- Built-in optimizations
- Excellent TypeScript support

### Why ethers.js?
- Mature and stable
- Comprehensive API
- Good TypeScript support
- Active maintenance

### Why Chakra UI?
- Accessible components
- Theme customization
- Responsive design
- Good developer experience

### Why Jest?
- Fast execution
- Good mocking support
- Coverage reporting
- Active ecosystem

## Security Architecture

### Encryption Layer
- AES-GCM encryption for storage
- PBKDF2 key derivation
- Session-based keys
- Secure key management

### Validation Layer
- Input validation
- Address validation
- Transaction validation
- Network validation

### Access Control Layer
- Owner verification
- Threshold validation
- Caller authorization
- Operation locks

### Rate Limiting Layer
- Per-address rate limiting
- Request throttling
- Automatic cleanup
- Configurable limits

## Future Enhancements

### Planned Features
- ERC-4337 Account Abstraction support
- Hardware wallet integration
- Transaction batching
- Advanced analytics
- Multi-chain support expansion

### Architecture Improvements
- Service worker for offline support
- WebSocket for real-time updates
- GraphQL API layer
- Micro-frontend architecture
