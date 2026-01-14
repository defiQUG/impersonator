"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Spinner,
  Badge,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from "@chakra-ui/react";
import { useSmartWallet } from "../../contexts/SmartWalletContext";
import { utils } from "ethers";
import AddToken from "./AddToken";

export default function WalletBalance() {
  const { activeWallet, balance, isLoadingBalance, refreshBalance } = useSmartWallet();

  if (!activeWallet) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="md">
        <Text color="gray.400">No active wallet selected</Text>
      </Box>
    );
  }

  return (
    <Box>
      <HStack mb={4} justify="space-between">
        <Heading size="md">Balance</Heading>
        <HStack>
          <AddToken />
          <Button size="sm" onClick={refreshBalance} isDisabled={isLoadingBalance}>
            {isLoadingBalance ? <Spinner size="sm" /> : "Refresh"}
          </Button>
        </HStack>
      </HStack>

      {isLoadingBalance ? (
        <Box p={8} textAlign="center">
          <Spinner size="lg" />
        </Box>
      ) : balance ? (
        <VStack align="stretch" spacing={4}>
          <Box p={4} borderWidth="1px" borderRadius="md" bg="brand.lightBlack">
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="gray.400">
                  Native Balance
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {parseFloat(balance.nativeFormatted).toFixed(6)} ETH
                </Text>
              </VStack>
            </HStack>
          </Box>

          {balance.tokens.length > 0 && (
            <Box>
              <Heading size="sm" mb={2}>
                Tokens
              </Heading>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Token</Th>
                    <Th>Balance</Th>
                    <Th>Symbol</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {balance.tokens.map((token) => (
                    <Tr key={token.tokenAddress}>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold">{token.name}</Text>
                          <Text fontSize="xs" color="gray.400">
                            {token.tokenAddress.slice(0, 10)}...
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Text>{parseFloat(token.balanceFormatted).toFixed(4)}</Text>
                      </Td>
                      <Td>
                        <Badge>{token.symbol}</Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}

          {balance.tokens.length === 0 && (
            <Box p={4} textAlign="center" color="gray.400">
              <Text>No token balances found</Text>
            </Box>
          )}
        </VStack>
      ) : (
        <Box p={4} textAlign="center" color="gray.400">
          <Text>Failed to load balance</Text>
        </Box>
      )}
    </Box>
  );
}
