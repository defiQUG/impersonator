import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { providers } from "ethers";
import {
  SmartWalletConfig,
  SmartWalletType,
  OwnerInfo,
  WalletBalance,
  TokenBalance,
} from "../types";
import { getWalletBalance } from "../helpers/balance";
import { SecureStorage } from "../utils/encryption";
import { validateAddress, isContractAddress, validateNetworkId } from "../utils/security";
import { STORAGE_KEYS } from "../utils/constants";

interface SmartWalletContextType {
  // Smart wallet state
  smartWallets: SmartWalletConfig[];
  activeWallet: SmartWalletConfig | undefined;
  setActiveWallet: (wallet: SmartWalletConfig | undefined) => void;
  
  // Wallet operations
  createWallet: (config: Omit<SmartWalletConfig, "id" | "createdAt" | "updatedAt">) => Promise<SmartWalletConfig>;
  updateWallet: (id: string, updates: Partial<SmartWalletConfig>) => void;
  deleteWallet: (id: string) => void;
  connectToWallet: (address: string, networkId: number, type: SmartWalletType) => Promise<SmartWalletConfig | null>;
  
  // Owner management
  addOwner: (walletId: string, owner: OwnerInfo, callerAddress?: string) => Promise<void>;
  removeOwner: (walletId: string, ownerAddress: string, callerAddress?: string) => Promise<void>;
  updateThreshold: (walletId: string, threshold: number, callerAddress?: string) => Promise<void>;
  
  // Balance management
  balance: WalletBalance | undefined;
  refreshBalance: () => Promise<void>;
  isLoadingBalance: boolean;
  
  // Provider
  provider: providers.Provider | undefined;
  setProvider: (provider: providers.Provider | undefined) => void;
}

export const SmartWalletContext = createContext<SmartWalletContextType>({
  smartWallets: [],
  activeWallet: undefined,
  setActiveWallet: () => {},
  createWallet: async () => ({} as SmartWalletConfig),
  updateWallet: () => {},
  deleteWallet: () => {},
  connectToWallet: async () => null,
  addOwner: async () => {},
  removeOwner: async () => {},
  updateThreshold: async () => {},
  balance: undefined,
  refreshBalance: async () => {},
  isLoadingBalance: false,
  provider: undefined,
  setProvider: () => {},
});

export interface FCProps {
  children: React.ReactNode;
}

const secureStorage = new SecureStorage();

export const SmartWalletProvider: React.FunctionComponent<FCProps> = ({
  children,
}) => {
  const [smartWallets, setSmartWallets] = useState<SmartWalletConfig[]>([]);
  const [activeWallet, setActiveWallet] = useState<SmartWalletConfig | undefined>();
  const [balance, setBalance] = useState<WalletBalance | undefined>();
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [provider, setProvider] = useState<providers.Provider>();

  // Load wallets from secure storage on mount
  useEffect(() => {
    const loadWallets = async () => {
      if (typeof window !== "undefined") {
        try {
          const stored = await secureStorage.getItem(STORAGE_KEYS.SMART_WALLETS);
          if (stored) {
            const wallets = JSON.parse(stored) as SmartWalletConfig[];
            setSmartWallets(wallets);
            
            // Restore active wallet if exists
            const activeId = await secureStorage.getItem(STORAGE_KEYS.ACTIVE_WALLET);
            if (activeId) {
              const wallet = wallets.find((w) => w.id === activeId);
              if (wallet) {
                setActiveWallet(wallet);
              }
            }
          }
        } catch (e) {
          console.error("Failed to load wallets from storage", e);
        }
      }
    };
    loadWallets();
  }, []);

  // Save wallets to secure storage whenever they change
  useEffect(() => {
    const saveWallets = async () => {
      if (typeof window !== "undefined") {
        try {
          await secureStorage.setItem(STORAGE_KEYS.SMART_WALLETS, JSON.stringify(smartWallets));
          if (activeWallet) {
            await secureStorage.setItem(STORAGE_KEYS.ACTIVE_WALLET, activeWallet.id);
          } else {
            secureStorage.removeItem(STORAGE_KEYS.ACTIVE_WALLET);
          }
        } catch (e) {
          console.error("Failed to save wallets to storage", e);
        }
      }
    };
    saveWallets();
  }, [smartWallets, activeWallet]);

  const createWallet = useCallback(
    async (config: Omit<SmartWalletConfig, "id" | "createdAt" | "updatedAt">): Promise<SmartWalletConfig> => {
      const newWallet: SmartWalletConfig = {
        ...config,
        id: `wallet_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setSmartWallets((prev) => [...prev, newWallet]);
      return newWallet;
    },
    []
  );

  const updateWallet = useCallback((id: string, updates: Partial<SmartWalletConfig>) => {
    setSmartWallets((prev) =>
      prev.map((wallet) =>
        wallet.id === id
          ? { ...wallet, ...updates, updatedAt: Date.now() }
          : wallet
      )
    );

    if (activeWallet?.id === id) {
      setActiveWallet((prev) => (prev ? { ...prev, ...updates, updatedAt: Date.now() } : undefined));
    }
  }, [activeWallet]);

  const deleteWallet = useCallback((id: string) => {
    setSmartWallets((prev) => prev.filter((wallet) => wallet.id !== id));
    if (activeWallet?.id === id) {
      setActiveWallet(undefined);
    }
  }, [activeWallet]);

  const connectToWallet = useCallback(
    async (
      address: string,
      networkId: number,
      type: SmartWalletType
    ): Promise<SmartWalletConfig | null> => {
      // Validate network ID
      const networkValidation = validateNetworkId(networkId);
      if (!networkValidation.valid) {
        throw new Error(networkValidation.error || "Invalid network ID");
      }

      // Validate address
      const addressValidation = validateAddress(address);
      if (!addressValidation.valid) {
        throw new Error(addressValidation.error || "Invalid address");
      }

      const validatedAddress = addressValidation.checksummed!;

      // Check if wallet already exists
      const existing = smartWallets.find(
        (w) => w.address.toLowerCase() === validatedAddress.toLowerCase() && w.networkId === networkId
      );

      if (existing) {
        setActiveWallet(existing);
        return existing;
      }

      // Connect based on wallet type
      if (type === SmartWalletType.GNOSIS_SAFE && provider) {
        const { connectToSafe } = await import("../helpers/smartWallet/gnosisSafe");
        const wallet = await connectToSafe(validatedAddress, networkId, provider);
        if (wallet) {
          setActiveWallet(wallet);
          setSmartWallets((prev) => {
            const exists = prev.find((w) => w.id === wallet.id);
            if (exists) return prev;
            return [...prev, wallet];
          });
          return wallet;
        }
      } else if (type === SmartWalletType.ERC4337 && provider) {
        const { connectToERC4337 } = await import("../helpers/smartWallet/erc4337");
        const wallet = await connectToERC4337(validatedAddress, networkId, provider);
        if (wallet) {
          setActiveWallet(wallet);
          setSmartWallets((prev) => {
            const exists = prev.find((w) => w.id === wallet.id);
            if (exists) return prev;
            return [...prev, wallet];
          });
          return wallet;
        }
      }

      // Fallback: create a placeholder wallet config
      const newWallet = await createWallet({
        type,
        address: validatedAddress,
        networkId,
        owners: [validatedAddress],
        threshold: 1,
      });

      setActiveWallet(newWallet);
      return newWallet;
    },
    [smartWallets, createWallet, provider]
  );

  const addOwner = useCallback(async (
    walletId: string,
    owner: OwnerInfo,
    callerAddress?: string
  ) => {
    const wallet = smartWallets.find((w) => w.id === walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Validate address
    const addressValidation = validateAddress(owner.address);
    if (!addressValidation.valid) {
      throw new Error(addressValidation.error || "Invalid owner address");
    }

    const checksummedAddress = addressValidation.checksummed!;

    // Check if contract (cannot add contracts as owners)
    if (provider) {
      const isContract = await isContractAddress(checksummedAddress, provider);
      if (isContract) {
        throw new Error("Cannot add contract address as owner");
      }
    }

    // Check for duplicates
    if (wallet.owners.some(
      o => o.toLowerCase() === checksummedAddress.toLowerCase()
    )) {
      throw new Error("Owner already exists");
    }

    // Verify caller is owner (if caller address provided)
    if (callerAddress && wallet.type === SmartWalletType.GNOSIS_SAFE && provider) {
      const { getSafeInfo } = await import("../helpers/smartWallet/gnosisSafe");
      const safeInfo = await getSafeInfo(wallet.address, provider);
      if (safeInfo && (safeInfo as any).owners && !(safeInfo as any).owners.some(
        (o: string) => o.toLowerCase() === callerAddress.toLowerCase()
      )) {
        throw new Error("Unauthorized: Caller is not a wallet owner");
      }
    }

    updateWallet(walletId, {
      owners: [...wallet.owners, checksummedAddress],
    });
  }, [smartWallets, provider, updateWallet]);

  const removeOwner = useCallback(
    async (walletId: string, ownerAddress: string, callerAddress?: string) => {
      const wallet = smartWallets.find((w) => w.id === walletId);
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Validate address
      const addressValidation = validateAddress(ownerAddress);
      if (!addressValidation.valid) {
        throw new Error(addressValidation.error || "Invalid owner address");
      }

      const checksummedAddress = addressValidation.checksummed!;

      // Cannot remove last owner
      if (wallet.owners.length <= 1) {
        throw new Error("Cannot remove last owner");
      }

      const newOwners = wallet.owners.filter(
        (o) => o.toLowerCase() !== checksummedAddress.toLowerCase()
      );
      
      if (newOwners.length < wallet.threshold) {
        throw new Error("Cannot remove owner: threshold would exceed owner count");
      }

      // Verify caller is owner (if caller address provided)
      if (callerAddress && wallet.type === SmartWalletType.GNOSIS_SAFE && provider) {
        const { getSafeInfo } = await import("../helpers/smartWallet/gnosisSafe");
        const safeInfo = await getSafeInfo(wallet.address, provider);
      if (safeInfo && (safeInfo as any).owners && !(safeInfo as any).owners.some(
        (o: string) => o.toLowerCase() === callerAddress.toLowerCase()
      )) {
          throw new Error("Unauthorized: Caller is not a wallet owner");
        }
      }

      updateWallet(walletId, { owners: newOwners });
    },
    [smartWallets, provider, updateWallet]
  );

  const updateThreshold = useCallback(
    async (walletId: string, threshold: number, callerAddress?: string) => {
      const wallet = smartWallets.find((w) => w.id === walletId);
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (threshold < 1) {
        throw new Error("Threshold must be at least 1");
      }

      if (threshold > wallet.owners.length) {
        throw new Error("Threshold cannot exceed owner count");
      }

      // Verify caller is owner (if caller address provided)
      if (callerAddress && wallet.type === SmartWalletType.GNOSIS_SAFE && provider) {
        const { getSafeInfo } = await import("../helpers/smartWallet/gnosisSafe");
        const safeInfo = await getSafeInfo(wallet.address, provider);
      if (safeInfo && (safeInfo as any).owners && !(safeInfo as any).owners.some(
        (o: string) => o.toLowerCase() === callerAddress.toLowerCase()
      )) {
          throw new Error("Unauthorized: Caller is not a wallet owner");
        }
      }

      updateWallet(walletId, { threshold });
    },
    [smartWallets, provider, updateWallet]
  );

  const refreshBalance = useCallback(async () => {
    if (!activeWallet || !provider) {
      setBalance(undefined);
      return;
    }

    setIsLoadingBalance(true);
    try {
      const network = await provider.getNetwork();
      const balance = await getWalletBalance(
        activeWallet.address,
        network.chainId,
        provider
      );
      setBalance(balance);
    } catch (error) {
      console.error("Failed to fetch balance", error);
      setBalance(undefined);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [activeWallet, provider]);

  // Refresh balance when active wallet or provider changes
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return (
    <SmartWalletContext.Provider
      value={{
        smartWallets,
        activeWallet,
        setActiveWallet,
        createWallet,
        updateWallet,
        deleteWallet,
        connectToWallet,
        addOwner,
        removeOwner,
        updateThreshold,
        balance,
        refreshBalance,
        isLoadingBalance,
        provider,
        setProvider,
      }}
    >
      {children}
    </SmartWalletContext.Provider>
  );
};

export const useSmartWallet = () => useContext(SmartWalletContext);
