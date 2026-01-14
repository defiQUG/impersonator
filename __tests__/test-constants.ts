/**
 * Test constants - Valid Ethereum addresses for testing
 */

// Valid Ethereum test addresses (checksummed)
export const TEST_ADDRESSES = {
  ADDRESS_1: "0xF10e6aC69eF0A03d9001C8C8B5263511072A77B0",
  ADDRESS_2: "0xCC1292E77d0a11353397915f8A2bCF67183701cc",
  ADDRESS_3: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  ADDRESS_4: "0x8ba1f109551bD432803012645ac136c22C9e8",
} as const;

// Helper to get a valid address (with fallback)
export function getTestAddress(index: number): string {
  const addresses = Object.values(TEST_ADDRESSES);
  return addresses[index % addresses.length];
}
