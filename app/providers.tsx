"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";
import {
  connectorsForWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { mainnet, optimism, base, arbitrum } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

import theme from "@/style/theme";
import { SafeInjectProvider } from "@/contexts/SafeInjectContext";
import { SmartWalletProvider } from "@/contexts/SmartWalletContext";
import { TransactionProvider } from "@/contexts/TransactionContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { monitoring } from "@/utils/monitoring";

// Initialize error tracking if Sentry is available
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  try {
    // Dynamic import to avoid bundling Sentry in client if not needed
    import("@sentry/nextjs").then((Sentry) => {
      monitoring.initErrorTracking(Sentry);
    }).catch(() => {
      // Sentry not available, continue without it
      console.warn("Sentry not available, continuing without error tracking");
    });
  } catch (error) {
    console.warn("Failed to initialize Sentry:", error);
  }
}

const { chains, publicClient } = configureChains(
  // the first chain is used by rainbowWallet to determine which chain to use
  [mainnet, optimism, base, arbitrum],
  [publicProvider()]
);

// WalletConnect projectId - required for WalletConnect v2
// Get one from https://cloud.walletconnect.com/
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "demo-project-id";

// Only include WalletConnect wallets if projectId is set (not demo)
const wallets = projectId && projectId !== "demo-project-id"
  ? [
      metaMaskWallet({ projectId, chains }),
      walletConnectWallet({ projectId, chains }),
      rainbowWallet({ projectId, chains }),
    ]
  : [
      metaMaskWallet({ projectId: "demo-project-id", chains }),
    ];

const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets,
  },
]);

export const wagmiConfig = createConfig({
  autoConnect: false,
  connectors,
  publicClient,
});

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider
            chains={chains}
            theme={darkTheme()}
            modalSize={"compact"}
          >
            <ErrorBoundary>
              <SafeInjectProvider>
                <SmartWalletProvider>
                  <TransactionProvider>
                    {children}
                  </TransactionProvider>
                </SmartWalletProvider>
              </SafeInjectProvider>
            </ErrorBoundary>
          </RainbowKitProvider>
        </WagmiConfig>
      </ChakraProvider>
    </CacheProvider>
  );
};
