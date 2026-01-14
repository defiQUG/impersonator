import { TransactionRequest } from "../../types";

export interface RelayerService {
  id: string;
  name: string;
  apiUrl: string;
  apiKey?: string;
  enabled: boolean;
}

export const DEFAULT_RELAYERS: RelayerService[] = [
  {
    id: "openrelay",
    name: "OpenRelay",
    apiUrl: "https://api.openrelay.xyz/v1/relay",
    enabled: true,
  },
  {
    id: "gelato",
    name: "Gelato",
    apiUrl: "https://relay.gelato.digital",
    enabled: true,
  },
  {
    id: "custom",
    name: "Custom Relayer",
    apiUrl: "",
    enabled: false,
  },
];

export async function submitToRelayer(
  tx: TransactionRequest,
  relayer: RelayerService
): Promise<string> {
  if (!relayer.enabled || !relayer.apiUrl) {
    throw new Error(`Relayer ${relayer.name} is not configured`);
  }

  const payload = {
    to: tx.to,
    value: tx.value || "0",
    data: tx.data || "0x",
    gasLimit: tx.gasLimit,
    gasPrice: tx.gasPrice,
    maxFeePerGas: tx.maxFeePerGas,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (relayer.apiKey) {
    headers["Authorization"] = `Bearer ${relayer.apiKey}`;
  }

  const response = await fetch(relayer.apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Relayer request failed: ${error}`);
  }

  const result = await response.json();
  return result.txHash || result.hash || result.transactionHash;
}

export async function getRelayerStatus(
  txHash: string,
  relayer: RelayerService
): Promise<{ status: string; confirmed: boolean }> {
  if (!relayer.enabled || !relayer.apiUrl) {
    throw new Error(`Relayer ${relayer.name} is not configured`);
  }

  const statusUrl = `${relayer.apiUrl}/status/${txHash}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (relayer.apiKey) {
    headers["Authorization"] = `Bearer ${relayer.apiKey}`;
  }

  const response = await fetch(statusUrl, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    return { status: "unknown", confirmed: false };
  }

  const result = await response.json();
  return {
    status: result.status || "pending",
    confirmed: result.confirmed || false,
  };
}
