import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { providers, ethers } from "ethers";
import {
  TransactionRequest,
  TransactionRequestStatus,
  TransactionStatus,
  TransactionExecutionMethod,
  GasEstimate,
  PendingTransaction,
  MultiSigApproval,
} from "../types";
import { useSmartWallet } from "./SmartWalletContext";
import { executeDirectTransaction, executeRelayerTransaction, simulateTransaction } from "../helpers/transaction/execution";
import { submitToRelayer, DEFAULT_RELAYERS } from "../helpers/relayers";
import { generateSecureId, validateTransactionRequest, RateLimiter, NonceManager, validateGasLimit } from "../utils/security";
import { SecureStorage } from "../utils/encryption";
import { SECURITY, STORAGE_KEYS, DEFAULTS } from "../utils/constants";

interface TransactionContextType {
  // Transaction state
  transactions: TransactionRequest[];
  pendingTransactions: PendingTransaction[];
  
  // Transaction operations
  createTransaction: (tx: Omit<TransactionRequest, "id" | "status" | "createdAt">) => Promise<TransactionRequest>;
  updateTransaction: (id: string, updates: Partial<TransactionRequest>) => void;
  approveTransaction: (transactionId: string, approver: string) => Promise<void>;
  rejectTransaction: (transactionId: string, approver: string) => Promise<void>;
  executeTransaction: (transactionId: string) => Promise<string | null>;
  
  // Gas estimation
  estimateGas: (tx: Partial<TransactionRequest>) => Promise<GasEstimate | null>;
  
  // Execution method
  defaultExecutionMethod: TransactionExecutionMethod;
  setDefaultExecutionMethod: (method: TransactionExecutionMethod) => void;
}

export const TransactionContext = createContext<TransactionContextType>({
  transactions: [],
  pendingTransactions: [],
  createTransaction: async () => ({} as TransactionRequest),
  updateTransaction: () => {},
  approveTransaction: async () => {},
  rejectTransaction: async () => {},
  executeTransaction: async () => null,
  estimateGas: async () => null,
  defaultExecutionMethod: TransactionExecutionMethod.DIRECT_ONCHAIN,
  setDefaultExecutionMethod: () => {},
});

export interface FCProps {
  children: React.ReactNode;
}

const secureStorage = new SecureStorage();

export const TransactionProvider: React.FunctionComponent<FCProps> = ({
  children,
}) => {
  const { activeWallet, provider } = useSmartWallet();
  const [transactions, setTransactions] = useState<TransactionRequest[]>([]);
  const [approvals, setApprovals] = useState<Record<string, MultiSigApproval[]>>({});
  const [defaultExecutionMethod, setDefaultExecutionMethod] = useState<TransactionExecutionMethod>(
    TransactionExecutionMethod.SIMULATION as TransactionExecutionMethod // Safer default
  );
  const approvalLocks = new Map<string, boolean>();
  const rateLimiter = new RateLimiter();
  const nonceManager = provider ? new NonceManager(provider) : null;

  // Load transactions from secure storage
  useEffect(() => {
    const loadTransactions = async () => {
      if (typeof window !== "undefined") {
        try {
          const stored = await secureStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
          if (stored) {
            const parsed = JSON.parse(stored) as TransactionRequest[];
            // Filter expired transactions
            const now = Date.now();
            const valid = parsed.filter(tx => !tx.expiresAt || tx.expiresAt > now);
            setTransactions(valid);
          }

          const method = await secureStorage.getItem(STORAGE_KEYS.DEFAULT_EXECUTION_METHOD);
          if (method && Object.values(TransactionExecutionMethod).includes(method as TransactionExecutionMethod)) {
            setDefaultExecutionMethod(method as TransactionExecutionMethod);
          }
        } catch (e) {
          console.error("Failed to load transactions from storage", e);
        }
      }
    };
    loadTransactions();
  }, []);

  // Save transactions to secure storage
  useEffect(() => {
    const saveTransactions = async () => {
      if (typeof window !== "undefined") {
        try {
          await secureStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
        } catch (e) {
          console.error("Failed to save transactions to storage", e);
        }
      }
    };
    saveTransactions();
  }, [transactions]);

  // Save default execution method
  useEffect(() => {
    const saveMethod = async () => {
      if (typeof window !== "undefined") {
        try {
          await secureStorage.setItem(STORAGE_KEYS.DEFAULT_EXECUTION_METHOD, defaultExecutionMethod);
        } catch (e) {
          console.error("Failed to save execution method", e);
        }
      }
    };
    saveMethod();
  }, [defaultExecutionMethod]);

  // Compute pending transactions
  const pendingTransactions = transactions
    .filter((tx) => tx.status === TransactionRequestStatus.PENDING || tx.status === TransactionRequestStatus.APPROVED)
    .map((tx) => {
      const txApprovals = approvals[tx.id] || [];
      const approvalCount = txApprovals.filter((a) => a.approved).length;
      const requiredApprovals = activeWallet?.threshold || 1;
      const canExecute = approvalCount >= requiredApprovals;

      return {
        id: tx.id,
        transaction: tx,
        approvals: txApprovals,
        approvalCount,
        requiredApprovals,
        canExecute,
      };
    });

  const createTransaction = useCallback(
    async (tx: Omit<TransactionRequest, "id" | "status" | "createdAt">): Promise<TransactionRequest> => {
      // Validate transaction request
      const validation = validateTransactionRequest(tx);
      if (!validation.valid) {
        throw new Error(`Invalid transaction: ${validation.errors.join(", ")}`);
      }

      // Rate limiting
      const rateLimitKey = tx.from || "anonymous";
      if (!rateLimiter.checkLimit(rateLimitKey)) {
        throw new Error("Rate limit exceeded. Please wait before creating another transaction.");
      }

      // Get nonce if provider available
      let nonce: number | undefined;
      if (nonceManager && tx.from) {
        try {
          nonce = await nonceManager.getNextNonce(tx.from);
        } catch (e) {
          console.error("Failed to get nonce:", e);
        }
      }

      // Generate transaction hash for deduplication
      const txHash = tx.from && tx.to
        ? ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ["address", "address", "uint256", "bytes", "uint256"],
              [tx.from, tx.to, tx.value || "0", tx.data || "0x", nonce || 0]
            )
          )
        : null;

      // Check for duplicates
      if (txHash) {
        const existing = transactions.find(t => {
          if (!t.from || !t.to) return false;
          const existingHash = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ["address", "address", "uint256", "bytes", "uint256"],
              [t.from, t.to, t.value || "0", t.data || "0x", t.nonce || 0]
            )
          );
          return existingHash === txHash;
        });

        if (existing) {
          throw new Error("Duplicate transaction detected");
        }
      }

      const newTx: TransactionRequest = {
        ...tx,
        id: `tx_${Date.now()}_${generateSecureId()}`,
        status: TransactionRequestStatus.PENDING,
        createdAt: Date.now(),
        method: (tx.method as TransactionExecutionMethod) || defaultExecutionMethod,
        nonce,
        expiresAt: Date.now() + SECURITY.TRANSACTION_EXPIRATION_MS,
      };

      setTransactions((prev) => [...prev, newTx]);
      return newTx;
    },
    [defaultExecutionMethod, transactions, rateLimiter, nonceManager]
  );

  const updateTransaction = useCallback((id: string, updates: Partial<TransactionRequest>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );
  }, []);

  const approveTransaction = useCallback(
    async (transactionId: string, approver: string) => {
      // Check lock
      if (approvalLocks.get(transactionId)) {
        throw new Error("Approval already in progress for this transaction");
      }

      const tx = transactions.find((t) => t.id === transactionId);
      if (!tx) {
        throw new Error("Transaction not found");
      }

      // Validate approver address
      const { validateAddress } = await import("../utils/security");
      const approverValidation = validateAddress(approver);
      if (!approverValidation.valid) {
        throw new Error(approverValidation.error || "Invalid approver address");
      }

      const validatedApprover = approverValidation.checksummed!;

      // Verify approver is a wallet owner
      if (activeWallet) {
        const isOwner = activeWallet.owners.some(
          o => o.toLowerCase() === validatedApprover.toLowerCase()
        );
        if (!isOwner) {
          throw new Error("Unauthorized: Approver is not a wallet owner");
        }
      }

      // Set lock
      approvalLocks.set(transactionId, true);

      try {
        // Add approval atomically
        setApprovals((prev) => {
          const existing = prev[transactionId] || [];
          
          // Check if already approved by this address
          const alreadyApproved = existing.some(
            (a) => a.approver.toLowerCase() === validatedApprover.toLowerCase() && a.approved
          );
          
          if (alreadyApproved) {
            return prev; // No change needed
          }

          const newApproval: MultiSigApproval = {
            transactionId,
            approver: validatedApprover,
            approved: true,
            timestamp: Date.now(),
          };

          const updated = {
            ...prev,
            [transactionId]: [...existing, newApproval],
          };

          // Check threshold atomically
          const approvalCount = [...existing, newApproval].filter((a) => a.approved).length;
          const requiredApprovals = activeWallet?.threshold || 1;

          if (approvalCount >= requiredApprovals) {
            // Update transaction status in next tick to avoid state update issues
            setTimeout(() => {
              updateTransaction(transactionId, {
                status: TransactionRequestStatus.APPROVED,
              });
            }, 0);
          }

          return updated;
        });
      } finally {
        // Release lock after a short delay
        setTimeout(() => {
          approvalLocks.delete(transactionId);
        }, 100);
      }
    },
    [transactions, activeWallet, updateTransaction]
  );

  const rejectTransaction = useCallback(
    async (transactionId: string, approver: string) => {
      // Add rejection
      setApprovals((prev) => {
        const existing = prev[transactionId] || [];
        const alreadyRejected = existing.some(
          (a) => a.approver.toLowerCase() === approver.toLowerCase() && !a.approved
        );
        
        if (alreadyRejected) {
          return prev;
        }

        const newRejection: MultiSigApproval = {
          transactionId,
          approver,
          approved: false,
          timestamp: Date.now(),
        };

        return {
          ...prev,
          [transactionId]: [...existing, newRejection],
        };
      });

      updateTransaction(transactionId, {
        status: TransactionRequestStatus.REJECTED,
      });
    },
    [updateTransaction]
  );

  const executeTransaction = useCallback(
    async (transactionId: string): Promise<string | null> => {
      const tx = transactions.find((t) => t.id === transactionId);
      if (!tx || !provider || !activeWallet) {
        throw new Error("Transaction, provider, or wallet not available");
      }

      // Check if transaction is expired
      if (tx.expiresAt && tx.expiresAt < Date.now()) {
        updateTransaction(transactionId, {
          status: TransactionRequestStatus.FAILED,
          error: "Transaction expired",
        });
        throw new Error("Transaction has expired");
      }

      // Verify transaction is approved (if multi-sig)
      if (activeWallet.threshold > 1) {
        const txApprovals = approvals[transactionId] || [];
        const approvalCount = txApprovals.filter((a) => a.approved).length;
        if (approvalCount < activeWallet.threshold) {
          throw new Error(`Insufficient approvals: ${approvalCount}/${activeWallet.threshold}`);
        }
      }

      updateTransaction(transactionId, {
        status: TransactionRequestStatus.EXECUTING,
      });

      try {
        // For simulation method
        if (tx.method === TransactionExecutionMethod.SIMULATION) {
          const simulation = await simulateTransaction(tx, provider, activeWallet.address);
          if (simulation.success) {
            updateTransaction(transactionId, {
              status: TransactionRequestStatus.SUCCESS,
              executedAt: Date.now(),
            });
            return `simulated_${transactionId}`;
          } else {
            updateTransaction(transactionId, {
              status: TransactionRequestStatus.FAILED,
              error: simulation.error || "Simulation failed",
            });
            return null;
          }
        }

        // For direct on-chain execution
        if (tx.method === TransactionExecutionMethod.DIRECT_ONCHAIN) {
          // Verify provider
          const verifyProvider = (provider: any): boolean => {
            return !!(provider.isMetaMask || provider.isCoinbaseWallet || provider.isWalletConnect);
          };

          let signer: ethers.Signer | null = null;
          
          // Try to get signer from provider
          if ((provider as any).getSigner) {
            signer = (provider as any).getSigner();
          }
          
          // Fallback: try window.ethereum
          if (!signer && typeof window !== "undefined" && (window as any).ethereum) {
            const ethereum = (window as any).ethereum;
            
            if (!verifyProvider(ethereum)) {
              throw new Error("Unverified provider detected");
            }
            
            const web3Provider = new ethers.providers.Web3Provider(ethereum);
            const accounts = await web3Provider.listAccounts();
            
            // Verify account matches wallet
            if (accounts[0]?.toLowerCase() !== activeWallet.address.toLowerCase()) {
              throw new Error("Provider account does not match wallet address");
            }
            
            signer = web3Provider.getSigner();
          }

          if (!signer) {
            throw new Error("No signer available for direct execution");
          }

          const txHash = await executeDirectTransaction(tx, provider, signer);
          
          updateTransaction(transactionId, {
            status: TransactionRequestStatus.SUCCESS,
            hash: txHash,
            executedAt: Date.now(),
          });

          // Refresh nonce after execution
          if (nonceManager && tx.from) {
            await nonceManager.refreshNonce(tx.from);
          }

          return txHash;
        }

        // For relayer method
        if (tx.method === TransactionExecutionMethod.RELAYER) {
          const relayer = DEFAULT_RELAYERS.find((r) => r.enabled);
          if (!relayer) {
            throw new Error("No enabled relayer available");
          }

          const txHash = await submitToRelayer(tx, relayer);
          
          updateTransaction(transactionId, {
            status: TransactionRequestStatus.SUCCESS,
            hash: txHash,
            executedAt: Date.now(),
          });
          return txHash;
        }

        return null;
      } catch (error: any) {
        updateTransaction(transactionId, {
          status: TransactionRequestStatus.FAILED,
          error: error.message || "Transaction execution failed",
        });
        throw error;
      }
    },
    [transactions, provider, activeWallet, updateTransaction, approvals, nonceManager]
  );

  const estimateGas = useCallback(
    async (tx: Partial<TransactionRequest>): Promise<GasEstimate | null> => {
      if (!provider || !tx.to) {
        return null;
      }

      try {
        const gasLimit = await provider.estimateGas({
          to: tx.to,
          value: tx.value ? ethers.BigNumber.from(tx.value) : undefined,
          data: tx.data || "0x",
        });

        // Validate gas limit
        const MAX_GAS_LIMIT = ethers.BigNumber.from("10000000"); // 10M
        if (gasLimit.gt(MAX_GAS_LIMIT)) {
          throw new Error(`Gas limit ${gasLimit.toString()} exceeds maximum ${MAX_GAS_LIMIT.toString()}`);
        }

        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.BigNumber.from(0);
        const estimatedCost = gasLimit.mul(gasPrice);

        return {
          gasLimit: gasLimit.toString(),
          gasPrice: gasPrice.toString(),
          maxFeePerGas: feeData.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
          estimatedCost: estimatedCost.toString(),
        };
      } catch (error: any) {
        console.error("Failed to estimate gas", error);
        throw new Error(error.message || "Gas estimation failed");
      }
    },
    [provider]
  );

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        pendingTransactions,
        createTransaction,
        updateTransaction,
        approveTransaction,
        rejectTransaction,
        executeTransaction,
        estimateGas,
        defaultExecutionMethod,
        setDefaultExecutionMethod,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => useContext(TransactionContext);
