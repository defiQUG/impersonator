"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Code,
  Link,
  Select,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTransaction } from "../../contexts/TransactionContext";
import { TransactionRequestStatus, TransactionStatus, TransactionExecutionMethod } from "../../types";
import { utils } from "ethers";

const getStatusColor = (status: TransactionRequestStatus) => {
  switch (status) {
    case TransactionRequestStatus.SUCCESS:
      return "green";
    case TransactionRequestStatus.FAILED:
      return "red";
    case TransactionRequestStatus.EXECUTING:
      return "blue";
    case TransactionRequestStatus.APPROVED:
      return "yellow";
    case TransactionRequestStatus.REJECTED:
      return "red";
    default:
      return "gray";
  }
};

export default function TransactionHistory() {
  const { transactions } = useTransaction();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [filter, setFilter] = useState<TransactionRequestStatus | "ALL">("ALL");

  const selectedTransaction = transactions.find((tx) => tx.id === selectedTx);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "ALL") return true;
    return tx.status === filter;
  });

  const getExplorerUrl = (hash: string, networkId: number) => {
    const explorers: Record<number, string> = {
      1: `https://etherscan.io/tx/${hash}`,
      5: `https://goerli.etherscan.io/tx/${hash}`,
      137: `https://polygonscan.com/tx/${hash}`,
      42161: `https://arbiscan.io/tx/${hash}`,
      10: `https://optimistic.etherscan.io/tx/${hash}`,
      8453: `https://basescan.org/tx/${hash}`,
    };
    return explorers[networkId] || `https://etherscan.io/tx/${hash}`;
  };

  return (
    <Box>
      <HStack mb={4} justify="space-between">
        <Heading size="md">Transaction History</Heading>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as TransactionRequestStatus | "ALL")}
          width="200px"
        >
          <option value="ALL">All Status</option>
          <option value={TransactionRequestStatus.PENDING}>Pending</option>
          <option value={TransactionRequestStatus.APPROVED}>Approved</option>
          <option value={TransactionRequestStatus.SUCCESS}>Success</option>
          <option value={TransactionRequestStatus.FAILED}>Failed</option>
          <option value={TransactionRequestStatus.REJECTED}>Rejected</option>
        </Select>
      </HStack>

      {filteredTransactions.length === 0 ? (
        <Box p={4} textAlign="center" color="gray.400">
          <Text>No transactions found</Text>
        </Box>
      ) : (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>To</Th>
              <Th>Value</Th>
              <Th>Method</Th>
              <Th>Status</Th>
              <Th>Hash</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredTransactions.map((tx) => (
              <Tr key={tx.id}>
                <Td>
                  <Text fontSize="xs">{tx.id.slice(0, 10)}...</Text>
                </Td>
                <Td>
                  <Text fontSize="sm">{tx.to.slice(0, 10)}...</Text>
                </Td>
                <Td>
                  <Text fontSize="sm">
                    {parseFloat(utils.formatEther(tx.value || "0")).toFixed(4)} ETH
                  </Text>
                </Td>
                <Td>
                  <Badge>{tx.method}</Badge>
                </Td>
                <Td>
                  <Badge colorScheme={getStatusColor(tx.status)}>{tx.status}</Badge>
                </Td>
                <Td>
                  {tx.hash ? (
                    <Link
                      href={getExplorerUrl(tx.hash, 1)}
                      isExternal
                      fontSize="xs"
                      color="blue.400"
                    >
                      {tx.hash.slice(0, 10)}...
                    </Link>
                  ) : (
                    <Text fontSize="xs" color="gray.400">
                      -
                    </Text>
                  )}
                </Td>
                <Td>
                  <Button
                    size="xs"
                    onClick={() => {
                      setSelectedTx(tx.id);
                      onOpen();
                    }}
                  >
                    View
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transaction Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTransaction && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Transaction ID
                  </Text>
                  <Code>{selectedTransaction.id}</Code>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    From
                  </Text>
                  <Text>{selectedTransaction.from}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    To
                  </Text>
                  <Text>{selectedTransaction.to}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Value
                  </Text>
                  <Text>
                    {parseFloat(utils.formatEther(selectedTransaction.value || "0")).toFixed(6)} ETH
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Data
                  </Text>
                  <Code fontSize="xs" p={2} display="block" whiteSpace="pre-wrap">
                    {selectedTransaction.data || "0x"}
                  </Code>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Status
                  </Text>
                  <Badge colorScheme={getStatusColor(selectedTransaction.status)}>
                    {selectedTransaction.status}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Execution Method
                  </Text>
                  <Badge>{selectedTransaction.method}</Badge>
                </Box>
                {selectedTransaction.hash && (
                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Transaction Hash
                    </Text>
                    <Link
                      href={getExplorerUrl(selectedTransaction.hash, 1)}
                      isExternal
                      color="blue.400"
                    >
                      {selectedTransaction.hash}
                    </Link>
                  </Box>
                )}
                {selectedTransaction.error && (
                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Error
                    </Text>
                    <Text color="red.400">{selectedTransaction.error}</Text>
                  </Box>
                )}
                {selectedTransaction.executedAt && (
                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Executed At
                    </Text>
                    <Text>{new Date(selectedTransaction.executedAt).toLocaleString()}</Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
