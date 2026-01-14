import { providers, ethers } from "ethers";
import { TransactionRequest, TransactionExecutionMethod } from "../../types";
import { validateAddress, validateTransactionValue, validateGasLimit } from "../../utils/security";
import { SECURITY } from "../../utils/constants";

export async function executeDirectTransaction(
  tx: TransactionRequest,
  provider: providers.Provider,
  signer: ethers.Signer
): Promise<string> {
  // Validate addresses
  if (!tx.to) {
    throw new Error("Missing 'to' address");
  }

  const toValidation = validateAddress(tx.to);
  if (!toValidation.valid) {
    throw new Error(`Invalid 'to' address: ${toValidation.error}`);
  }

  // Validate value
  if (tx.value) {
    const valueValidation = validateTransactionValue(tx.value);
    if (!valueValidation.valid) {
      throw new Error(`Invalid transaction value: ${valueValidation.error}`);
    }
  }

    // Validate gas limit if provided
    if (tx.gasLimit) {
      const gasValidation = validateGasLimit(tx.gasLimit);
      if (!gasValidation.valid) {
        throw new Error(`Invalid gas limit: ${gasValidation.error}`);
      }
    }

    // Validate gas estimate if provided
    if (tx.gasLimit) {
      const MAX_GAS_LIMIT = ethers.BigNumber.from(SECURITY.MAX_GAS_LIMIT);
      const gasLimitBN = ethers.BigNumber.from(tx.gasLimit);
      if (gasLimitBN.gt(MAX_GAS_LIMIT)) {
        throw new Error(`Gas limit ${gasLimitBN.toString()} exceeds maximum ${MAX_GAS_LIMIT.toString()}`);
      }
    }

  const txParams: any = {
    to: toValidation.checksummed!,
    value: tx.value ? ethers.BigNumber.from(tx.value) : 0,
    data: tx.data || "0x",
  };

  if (tx.gasLimit) {
    txParams.gasLimit = ethers.BigNumber.from(tx.gasLimit);
  }

  if (tx.maxFeePerGas && tx.maxPriorityFeePerGas) {
    txParams.maxFeePerGas = ethers.BigNumber.from(tx.maxFeePerGas);
    txParams.maxPriorityFeePerGas = ethers.BigNumber.from(tx.maxPriorityFeePerGas);
  } else if (tx.gasPrice) {
    txParams.gasPrice = ethers.BigNumber.from(tx.gasPrice);
  }

  if (tx.nonce !== undefined) {
    txParams.nonce = tx.nonce;
  }

  const transaction = await signer.sendTransaction(txParams);
  return transaction.hash;
}

export async function executeRelayerTransaction(
  tx: TransactionRequest,
  relayerUrl: string,
  apiKey?: string
): Promise<string> {
  // Validate relayer URL
  try {
    const url = new URL(relayerUrl);
    if (url.protocol !== "https:") {
      throw new Error("Relayer URL must use HTTPS");
    }
  } catch {
    throw new Error("Invalid relayer URL");
  }

  // Validate addresses
  if (!tx.to) {
    throw new Error("Missing 'to' address");
  }

  const toValidation = validateAddress(tx.to);
  if (!toValidation.valid) {
    throw new Error(`Invalid 'to' address: ${toValidation.error}`);
  }

  // Validate value
  if (tx.value) {
    const valueValidation = validateTransactionValue(tx.value);
    if (!valueValidation.valid) {
      throw new Error(`Invalid transaction value: ${valueValidation.error}`);
    }
  }

  const payload: any = {
    to: toValidation.checksummed!,
    value: tx.value || "0",
    data: tx.data || "0x",
  };

  if (tx.gasLimit) {
    const gasValidation = validateGasLimit(tx.gasLimit);
    if (!gasValidation.valid) {
      throw new Error(`Invalid gas limit: ${gasValidation.error}`);
    }
    payload.gasLimit = tx.gasLimit;
  }

  if (tx.maxFeePerGas && tx.maxPriorityFeePerGas) {
    payload.maxFeePerGas = tx.maxFeePerGas;
    payload.maxPriorityFeePerGas = tx.maxPriorityFeePerGas;
  } else if (tx.gasPrice) {
    payload.gasPrice = tx.gasPrice;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SECURITY.RELAYER_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(relayerUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Relayer request failed: ${errorText || response.statusText}`);
    }

    const result = await response.json();
    const txHash = result.txHash || result.hash || result.transactionHash;
    
    if (!txHash) {
      throw new Error("Relayer did not return transaction hash");
    }

    return txHash;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Relayer request timeout");
    }
    throw error;
  }
}

export async function simulateTransaction(
  tx: TransactionRequest,
  provider: providers.Provider,
  from: string
): Promise<{ success: boolean; gasUsed: string; error?: string }> {
  try {
    // Validate addresses
    const fromValidation = validateAddress(from);
    if (!fromValidation.valid) {
      return {
        success: false,
        gasUsed: "0",
        error: `Invalid 'from' address: ${fromValidation.error}`,
      };
    }

    if (!tx.to) {
      return {
        success: false,
        gasUsed: "0",
        error: "Missing 'to' address",
      };
    }

    const toValidation = validateAddress(tx.to);
    if (!toValidation.valid) {
      return {
        success: false,
        gasUsed: "0",
        error: `Invalid 'to' address: ${toValidation.error}`,
      };
    }

    // Validate value
    if (tx.value) {
      const valueValidation = validateTransactionValue(tx.value);
      if (!valueValidation.valid) {
        return {
          success: false,
          gasUsed: "0",
          error: `Invalid transaction value: ${valueValidation.error}`,
        };
      }
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gas estimation timeout")), SECURITY.GAS_ESTIMATION_TIMEOUT_MS)
    );

    const gasEstimate = await Promise.race([
      provider.estimateGas({
        from: fromValidation.checksummed!,
        to: toValidation.checksummed!,
        value: tx.value ? ethers.BigNumber.from(tx.value) : undefined,
        data: tx.data || "0x",
      }),
      timeoutPromise,
    ]) as ethers.BigNumber;

    // Validate gas estimate
    const MAX_GAS_LIMIT = ethers.BigNumber.from(SECURITY.MAX_GAS_LIMIT);
    if (gasEstimate.gt(MAX_GAS_LIMIT)) {
      return {
        success: false,
        gasUsed: "0",
        error: `Gas estimate ${gasEstimate.toString()} exceeds maximum ${MAX_GAS_LIMIT.toString()}`,
      };
    }

    return {
      success: true,
      gasUsed: gasEstimate.toString(),
    };
  } catch (error: any) {
    return {
      success: false,
      gasUsed: "0",
      error: error.message || "Simulation failed",
    };
  }
}
