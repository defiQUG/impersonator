import { providers, Contract, utils, ethers } from "ethers";
import { TokenBalance, WalletBalance } from "../../types";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

const COMMON_TOKENS: Record<number, Array<{ address: string; symbol: string; name: string; decimals: number }>> = {
  1: [
    {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
    {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0c3606eB48",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    {
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
    },
  ],
  137: [
    {
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
    {
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
  ],
  42161: [
    {
      address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
    {
      address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
  ],
};

export async function getNativeBalance(
  address: string,
  provider: providers.Provider
): Promise<string> {
  try {
    const balance = await provider.getBalance(address);
    return balance.toString();
  } catch (error) {
    console.error("Failed to get native balance", error);
    return "0";
  }
}

export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  provider: providers.Provider
): Promise<TokenBalance | null> {
  try {
    // Validate addresses
    if (!utils.isAddress(tokenAddress) || !utils.isAddress(walletAddress)) {
      throw new Error("Invalid address");
    }

    const checksummedTokenAddress = utils.getAddress(tokenAddress);
    const checksummedWalletAddress = utils.getAddress(walletAddress);

    const tokenContract = new Contract(checksummedTokenAddress, ERC20_ABI, provider);
    
    // Add timeout to prevent hanging
    const { SECURITY } = await import("@/utils/constants");
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Token balance fetch timeout")), SECURITY.TOKEN_BALANCE_TIMEOUT_MS)
    );

    const [balance, decimals, symbol, name] = await Promise.race([
      Promise.all([
        tokenContract.balanceOf(checksummedWalletAddress),
        tokenContract.decimals(),
        tokenContract.symbol(),
        tokenContract.name(),
      ]),
      timeoutPromise,
    ]) as [any, number, string, string];

    // Validate decimals
    const { VALIDATION } = await import("@/utils/constants");
    if (decimals < VALIDATION.TOKEN_DECIMALS_MIN || decimals > VALIDATION.TOKEN_DECIMALS_MAX) {
      throw new Error(`Invalid token decimals: ${decimals}`);
    }

    const balanceFormatted = ethers.utils.formatUnits(balance, decimals);

    return {
      tokenAddress: checksummedTokenAddress,
      symbol: symbol || "UNKNOWN",
      name: name || "Unknown Token",
      decimals,
      balance: balance.toString(),
      balanceFormatted,
    };
  } catch (error: any) {
    console.error(`Failed to get token balance for ${tokenAddress}`, error);
    return null;
  }
}

export async function getWalletBalance(
  address: string,
  networkId: number,
  provider: providers.Provider,
  tokenAddresses?: string[]
): Promise<WalletBalance> {
  // Get native balance
  const nativeBalance = await getNativeBalance(address, provider);
  const nativeFormatted = ethers.utils.formatEther(nativeBalance);

  // Get token balances
  const tokensToCheck = tokenAddresses || COMMON_TOKENS[networkId]?.map((t) => t.address) || [];
  const tokenBalances = await Promise.all(
    tokensToCheck.map((tokenAddress) => getTokenBalance(tokenAddress, address, provider))
  );

  const validTokenBalances = tokenBalances.filter((tb): tb is TokenBalance => tb !== null);

  return {
    native: nativeBalance,
    nativeFormatted,
    tokens: validTokenBalances,
  };
}
