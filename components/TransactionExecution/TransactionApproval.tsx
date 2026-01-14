"use client";

import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Badge,
  Progress,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Code,
} from "@chakra-ui/react";
import { useTransaction } from "../../contexts/TransactionContext";
import { TransactionRequestStatus } from "../../types";
import { formatEther } from "ethers/lib/utils";

export default function TransactionApproval() {
  const { pendingTransactions, approveTransaction, rejectTransaction, executeTransaction } =
    useTransaction();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTx, setSelectedTx] = React.useState<string | null>(null);

  const selectedTransaction = pendingTransactions.find((ptx) => ptx.id === selectedTx);

  const handleApprove = async () => {
    if (!selectedTx) return;
    // Get approver address from active wallet or use a placeholder
    // In production, this would get from the connected wallet
    const approver = typeof window !== "undefined" && (window as any).ethereum
      ? await (window as any).ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => accounts[0])
      : "0x0000000000000000000000000000000000000000";
    
    await approveTransaction(selectedTx, approver || "0x0000000000000000000000000000000000000000");
    onClose();
  };

  const handleReject = async () => {
    if (!selectedTx) return;
    const approver = typeof window !== "undefined" && (window as any).ethereum
      ? await (window as any).ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => accounts[0])
      : "0x0000000000000000000000000000000000000000";
    
    await rejectTransaction(selectedTx, approver || "0x0000000000000000000000000000000000000000");
    onClose();
  };

  const handleExecute = async () => {
    if (!selectedTx) return;
    const hash = await executeTransaction(selectedTx);
    if (hash) {
      // Transaction executed successfully
    }
    onClose();
  };

  return (
    <Box>
      <Heading size="md" mb={4}>
        Pending Transactions
      </Heading>

      {pendingTransactions.length === 0 ? (
        <Box p={4} textAlign="center" color="gray.400">
          <Text>No pending transactions</Text>
        </Box>
      ) : (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>To</Th>
              <Th>Value</Th>
              <Th>Approvals</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {pendingTransactions.map((ptx) => (
              <Tr key={ptx.id}>
                <Td>
                  <Text fontSize="xs">{ptx.id.slice(0, 10)}...</Text>
                </Td>
                <Td>
                  <Text fontSize="sm">{ptx.transaction.to.slice(0, 10)}...</Text>
                </Td>
                <Td>
                  <Text fontSize="sm">
                    {parseFloat(formatEther(ptx.transaction.value || "0")).toFixed(4)} ETH
                  </Text>
                </Td>
                <Td>
                  <Text fontSize="sm">
                    {ptx.approvalCount} / {ptx.requiredApprovals}
                  </Text>
                  <Progress
                    value={(ptx.approvalCount / ptx.requiredApprovals) * 100}
                    size="sm"
                    colorScheme="green"
                    mt={1}
                  />
                </Td>
                <Td>
                  <Badge
                    colorScheme={
                      ptx.transaction.status === TransactionRequestStatus.APPROVED
                        ? "green"
                        : "yellow"
                    }
                  >
                    {ptx.transaction.status}
                  </Badge>
                </Td>
                <Td>
                  <HStack>
                    <Button
                      size="xs"
                      onClick={() => {
                        setSelectedTx(ptx.id);
                        onOpen();
                      }}
                    >
                      View
                    </Button>
                    {ptx.canExecute && (
                      <Button
                        size="xs"
                        colorScheme="green"
                        onClick={() => handleExecute()}
                      >
                        Execute
                      </Button>
                    )}
                  </HStack>
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
                    To
                  </Text>
                  <Text>{selectedTransaction.transaction.to}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Value
                  </Text>
                  <Text>
                    {parseFloat(formatEther(selectedTransaction.transaction.value || "0")).toFixed(
                      6
                    )}{" "}
                    ETH
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Data
                  </Text>
                  <Code fontSize="xs" p={2} display="block" whiteSpace="pre-wrap">
                    {selectedTransaction.transaction.data || "0x"}
                  </Code>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Approvals
                  </Text>
                  <Text>
                    {selectedTransaction.approvalCount} / {selectedTransaction.requiredApprovals}
                  </Text>
                  <Progress
                    value={
                      (selectedTransaction.approvalCount /
                        selectedTransaction.requiredApprovals) *
                      100
                    }
                    size="sm"
                    colorScheme="green"
                    mt={2}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Execution Method
                  </Text>
                  <Badge>{selectedTransaction.transaction.method}</Badge>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              {selectedTransaction && !selectedTransaction.canExecute && (
                <>
                  <Button colorScheme="red" onClick={handleReject}>
                    Reject
                  </Button>
                  <Button colorScheme="blue" onClick={handleApprove}>
                    Approve
                  </Button>
                </>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
