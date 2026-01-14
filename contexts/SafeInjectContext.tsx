import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { providers, utils, ethers } from "ethers";
import { useAppCommunicator } from "../helpers/communicator";
import { useSmartWallet } from "./SmartWalletContext";
import { useTransaction } from "./TransactionContext";
import { getWalletBalance } from "../helpers/balance";
import {
  InterfaceMessageIds,
  InterfaceMessageProps,
  Methods,
  MethodToResponse,
  RequestId,
  RPCPayload,
  SignMessageParams,
  SignTypedMessageParams,
  Transaction,
} from "../types";

interface TransactionWithId extends Transaction {
  id: number;
}

type SafeInjectContextType = {
  address: string | undefined;
  appUrl: string | undefined;
  rpcUrl: string | undefined;
  iframeRef: React.RefObject<HTMLIFrameElement> | null;
  latestTransaction: TransactionWithId | undefined;
  setAddress: React.Dispatch<React.SetStateAction<string | undefined>>;
  setAppUrl: React.Dispatch<React.SetStateAction<string | undefined>>;
  setRpcUrl: React.Dispatch<React.SetStateAction<string | undefined>>;
  sendMessageToIFrame: Function;
};

export const SafeInjectContext = createContext<SafeInjectContextType>({
  address: undefined,
  appUrl: undefined,
  rpcUrl: undefined,
  iframeRef: null,
  latestTransaction: undefined,
  setAddress: () => {},
  setAppUrl: () => {},
  setRpcUrl: () => {},
  sendMessageToIFrame: () => {},
});

export interface FCProps {
  children: React.ReactNode;
}

export const SafeInjectProvider: React.FunctionComponent<FCProps> = ({
  children,
}) => {
  const [address, setAddress] = useState<string>();
  const [appUrl, setAppUrl] = useState<string>();
  const [rpcUrl, setRpcUrl] = useState<string>();
  const [provider, setProvider] = useState<providers.StaticJsonRpcProvider>();
  const [latestTransaction, setLatestTransaction] =
    useState<TransactionWithId>();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const communicator = useAppCommunicator(iframeRef);
  const { activeWallet, setProvider: setSmartWalletProvider } = useSmartWallet();
  const { createTransaction } = useTransaction();

  // Set allowed origin for iframe communication
  useEffect(() => {
    if (appUrl && communicator) {
      try {
        const url = new URL(appUrl);
        communicator.setAllowedOrigin(url.origin);
      } catch (e) {
        console.error("Invalid app URL:", e);
      }
    }
  }, [appUrl, communicator]);

  const sendMessageToIFrame = useCallback(
    function <T extends InterfaceMessageIds>(
      message: InterfaceMessageProps<T>,
      requestId?: RequestId
    ) {
      const requestWithMessage = {
        ...message,
        requestId: requestId || Math.trunc(window.performance.now()),
        version: "0.4.2",
      };

      if (iframeRef) {
        iframeRef.current?.contentWindow?.postMessage(
          requestWithMessage,
          appUrl!
        );
      }
    },
    [iframeRef, appUrl]
  );

  useEffect(() => {
    if (!rpcUrl) return;

    const newProvider = new providers.StaticJsonRpcProvider(rpcUrl);
    setProvider(newProvider);
    setSmartWalletProvider(newProvider);
  }, [rpcUrl, setSmartWalletProvider]);

  useEffect(() => {
    if (!provider) return;

    communicator?.on(Methods.getSafeInfo, async () => {
      // Use active smart wallet if available, otherwise fall back to impersonated address
      if (activeWallet && provider) {
        const network = await provider.getNetwork();
        const balance = await provider.getBalance(activeWallet.address);
        return {
          safeAddress: activeWallet.address,
          network: network.name as any,
          ethBalance: balance.toString(),
        };
      }
      
      // Fallback to impersonated address
      const network = await provider.getNetwork();
      const balance = address ? await provider.getBalance(address) : ethers.BigNumber.from(0);
      return {
        safeAddress: address || "0x0000000000000000000000000000000000000000",
        network: network.name as any,
        ethBalance: balance.toString(),
      };
    });

    communicator?.on(Methods.getEnvironmentInfo, async () => ({
      origin: document.location.origin,
    }));

    communicator?.on(Methods.rpcCall, async (msg) => {
      const params = msg.data.params as RPCPayload;

      try {
        const response = (await provider.send(
          params.call,
          params.params
        )) as MethodToResponse["rpcCall"];
        return response;
      } catch (err) {
        return err;
      }
    });

    communicator?.on(Methods.sendTransactions, async (msg) => {
      // @ts-expect-error explore ways to fix this
      const transactions = (msg.data.params.txs as Transaction[]).map(
        ({ to, ...rest }) => ({
          to: utils.getAddress(to), // checksummed
          ...rest,
        })
      );
      
      const tx = transactions[0];
      setLatestTransaction({
        id: parseInt(msg.data.id.toString()),
        ...tx,
      });

      // Create transaction in transaction context for approval/execution
      if (activeWallet) {
        try {
          // Validate transaction data
          const { validateTransactionRequest } = await import("../utils/security");
          const validation = validateTransactionRequest({
            from: activeWallet.address,
            to: tx.to,
            value: tx.value || "0",
            data: tx.data || "0x",
          });

          if (!validation.valid) {
            console.error("Invalid transaction from iframe:", validation.errors);
            return;
          }

          await createTransaction({
            from: activeWallet.address,
            to: tx.to,
            value: tx.value || "0",
            data: tx.data || "0x",
            method: "DIRECT_ONCHAIN" as any,
          });
        } catch (error: any) {
          console.error("Failed to create transaction from iframe:", error);
        }
      }
    });

    communicator?.on(Methods.signMessage, async (msg) => {
      const { message } = msg.data.params as SignMessageParams;

      // openSignMessageModal(message, msg.data.id, Methods.signMessage)
    });

    communicator?.on(Methods.signTypedMessage, async (msg) => {
      const { typedData } = msg.data.params as SignTypedMessageParams;

      // openSignMessageModal(typedData, msg.data.id, Methods.signTypedMessage)
    });

    communicator?.on(Methods.getSafeBalances, async () => {
      if (!activeWallet || !provider) {
        return [];
      }

      try {
        const network = await provider.getNetwork();
        const balance = await getWalletBalance(
          activeWallet.address,
          network.chainId,
          provider
        );

        return [
          {
            fiatTotal: "0",
            items: [
              {
                tokenInfo: {
                  type: "NATIVE_TOKEN" as any,
                  address: "0x0000000000000000000000000000000000000000",
                  decimals: 18,
                  symbol: "ETH",
                  name: "Ether",
                  logoUri: "",
                },
                balance: balance.native,
                fiatBalance: "0",
                fiatConversion: "0",
              },
              ...balance.tokens.map((token) => ({
                tokenInfo: {
                  type: "ERC20" as any,
                  address: token.tokenAddress,
                  decimals: token.decimals,
                  symbol: token.symbol,
                  name: token.name,
                  logoUri: token.logoUri || "",
                },
                balance: token.balance,
                fiatBalance: "0",
                fiatConversion: "0",
              })),
            ],
          },
        ];
      } catch (error) {
        console.error("Failed to get Safe balances", error);
        return [];
      }
    });
  }, [communicator, address, provider, activeWallet, createTransaction]);

  return (
    <SafeInjectContext.Provider
      value={{
        address,
        appUrl,
        rpcUrl,
        iframeRef,
        latestTransaction,
        setAddress,
        setAppUrl,
        setRpcUrl,
        sendMessageToIFrame,
      }}
    >
      {children}
    </SafeInjectContext.Provider>
  );
};

export const useSafeInject = () => useContext(SafeInjectContext);
