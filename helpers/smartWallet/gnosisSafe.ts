import { ethers, providers } from "ethers";
import Safe, { SafeFactory, SafeAccountConfig } from "@safe-global/safe-core-sdk";
import EthersAdapter from "@safe-global/safe-ethers-lib";
import { SafeInfo, SmartWalletConfig, OwnerInfo, SmartWalletType } from "../../types";

// Gnosis Safe Factory contract addresses per network
// Note: These are the Safe Factory addresses, not the Safe contract itself
// The Safe SDK handles the correct addresses internally
const SAFE_FACTORY_ADDRESSES: Record<number, string> = {
  1: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2", // Mainnet - Safe Factory v1.3.0
  5: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2", // Goerli - Safe Factory v1.3.0
  100: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2", // Gnosis Chain
  137: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2", // Polygon
  42161: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2", // Arbitrum
  10: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2", // Optimism
  8453: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2", // Base
};

// Note: The Safe SDK uses its own internal address resolution
// These addresses are for reference only

export async function getSafeInfo(
  safeAddress: string,
  provider: providers.Provider
): Promise<SafeInfo | null> {
  try {
    // Validate address
    if (!ethers.utils.isAddress(safeAddress)) {
      throw new Error("Invalid Safe address");
    }

    const network = await provider.getNetwork();
    
    // Verify this is actually a Safe contract by checking for Safe-specific functions
    const safeContract = new ethers.Contract(
      safeAddress,
      [
        "function getOwners() view returns (address[])",
        "function getThreshold() view returns (uint256)",
        "function nonce() view returns (uint256)",
        "function VERSION() view returns (string)",
      ],
      provider
    );

    // Try to get VERSION to verify it's a Safe
    let isSafe = false;
    try {
      await safeContract.VERSION();
      isSafe = true;
    } catch {
      // Not a Safe contract
      isSafe = false;
    }

    if (!isSafe) {
      throw new Error("Address is not a valid Safe contract");
    }

    const [owners, threshold] = await Promise.all([
      safeContract.getOwners(),
      safeContract.getThreshold(),
    ]);

    // Validate owners array
    if (!Array.isArray(owners) || owners.length === 0) {
      throw new Error("Invalid Safe configuration: no owners");
    }

    // Validate threshold
    const thresholdNum = threshold.toNumber();
    if (thresholdNum < 1 || thresholdNum > owners.length) {
      throw new Error("Invalid Safe configuration: invalid threshold");
    }

    const balance = await provider.getBalance(safeAddress);

    return {
      safeAddress: ethers.utils.getAddress(safeAddress), // Ensure checksummed
      network: network.name as any,
      ethBalance: balance.toString(),
      owners: owners.map((o: string) => ethers.utils.getAddress(o)), // Checksum all owners
      threshold: thresholdNum,
    };
  } catch (error: any) {
    console.error("Failed to get Safe info", error);
    return null;
  }
}

export async function connectToSafe(
  safeAddress: string,
  networkId: number,
  provider: providers.Provider
): Promise<SmartWalletConfig | null> {
  // Validate address
  if (!ethers.utils.isAddress(safeAddress)) {
    throw new Error("Invalid Safe address");
  }

  const checksummedAddress = ethers.utils.getAddress(safeAddress);
  const safeInfo = await getSafeInfo(checksummedAddress, provider);
  if (!safeInfo) {
    return null;
  }

  return {
    id: `safe_${checksummedAddress}_${networkId}`,
    type: SmartWalletType.GNOSIS_SAFE,
    address: checksummedAddress,
    networkId,
    owners: (safeInfo as any).owners || [],
    threshold: (safeInfo as any).threshold || 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export async function deploySafe(
  owners: string[],
  threshold: number,
  provider: providers.Provider,
  signer: ethers.Signer
): Promise<string | null> {
  try {
    // Validate inputs
    if (!owners || owners.length === 0) {
      throw new Error("At least one owner is required");
    }

    if (threshold < 1 || threshold > owners.length) {
      throw new Error("Threshold must be between 1 and owner count");
    }

    // Validate and checksum all owner addresses
    const validatedOwners = owners.map((owner) => {
      if (!ethers.utils.isAddress(owner)) {
        throw new Error(`Invalid owner address: ${owner}`);
      }
      return ethers.utils.getAddress(owner);
    });

    // Check for duplicate owners
    const uniqueOwners = new Set(validatedOwners.map(o => o.toLowerCase()));
    if (uniqueOwners.size !== validatedOwners.length) {
      throw new Error("Duplicate owner addresses are not allowed");
    }

    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer,
    });

    const safeFactory = await (SafeFactory as any).init({ ethAdapter });
    const safeAccountConfig: SafeAccountConfig = {
      owners: validatedOwners,
      threshold,
    };

    const safeSdk = await safeFactory.deploySafe({ safeAccountConfig });
    const safeAddress = safeSdk.getAddress();

    return safeAddress;
  } catch (error: any) {
    console.error("Failed to deploy Safe", error);
    throw error;
  }
}

export async function getSafeSDK(
  safeAddress: string,
  provider: providers.Provider,
  signer?: ethers.Signer
): Promise<Safe | null> {
  try {
    // Validate address
    if (!ethers.utils.isAddress(safeAddress)) {
      throw new Error("Invalid Safe address");
    }

    const checksummedAddress = ethers.utils.getAddress(safeAddress);
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer || provider,
    });

    const safeSdk = await (Safe as any).init({ ethAdapter, safeAddress: checksummedAddress });
    return safeSdk;
  } catch (error: any) {
    console.error("Failed to initialize Safe SDK", error);
    return null;
  }
}
