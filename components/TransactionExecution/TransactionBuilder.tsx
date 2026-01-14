"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  NumberInput,
  NumberInputField,
  Code,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTransaction } from "../../contexts/TransactionContext";
import { useSmartWallet } from "../../contexts/SmartWalletContext";
import { TransactionExecutionMethod } from "../../types";
import { validateAddress, validateTransactionData, validateTransactionValue, sanitizeInput } from "../../utils/security";
import { ethers } from "ethers";

const ERC20_TRANSFER_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
];

export default function TransactionBuilder() {
  const { createTransaction, estimateGas, defaultExecutionMethod, setDefaultExecutionMethod } =
    useTransaction();
  const { activeWallet, balance } = useSmartWallet();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [toAddress, setToAddress] = useState("");
  const [value, setValue] = useState("");
  const [data, setData] = useState("");
  const [isTokenTransfer, setIsTokenTransfer] = useState(false);
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const handleEstimateGas = async () => {
    if (!activeWallet || !toAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in required fields",
        status: "error",
        isClosable: true,
      });
      return;
    }

    // Validate to address
    const toValidation = validateAddress(toAddress);
    if (!toValidation.valid) {
      toast({
        title: "Invalid Address",
        description: toValidation.error || "Invalid 'to' address",
        status: "error",
        isClosable: true,
      });
      return;
    }

    // Validate transaction data
    if (data) {
      const dataValidation = validateTransactionData(data);
      if (!dataValidation.valid) {
        toast({
          title: "Invalid Data",
          description: dataValidation.error || "Invalid transaction data",
          status: "error",
          isClosable: true,
        });
        return;
      }
    }

    setIsEstimating(true);
    try {
      const valueHex = value
        ? ethers.utils.parseEther(value).toHexString()
        : "0x0";

      // Validate value
      const valueValidation = validateTransactionValue(valueHex);
      if (!valueValidation.valid) {
        throw new Error(valueValidation.error || "Invalid transaction value");
      }

      const estimate = await estimateGas({
        from: activeWallet.address,
        to: toValidation.checksummed!,
        value: valueHex,
        data: data || "0x",
      });
      setGasEstimate(estimate);
    } catch (error: any) {
      toast({
        title: "Estimation Failed",
        description: error.message || "Failed to estimate gas",
        status: "error",
        isClosable: true,
      });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleCreateTokenTransfer = () => {
    if (!tokenAddress || !toAddress || !tokenAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all token transfer fields",
        status: "error",
        isClosable: true,
      });
      return;
    }

    // Find token info
    const token = balance?.tokens.find(
      (t) => t.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (!token) {
      toast({
        title: "Token Not Found",
        description: "Token not found in balance. Please add it first.",
        status: "error",
        isClosable: true,
      });
      return;
    }

    // Encode transfer function
    const iface = new ethers.utils.Interface(ERC20_TRANSFER_ABI);
    const transferData = iface.encodeFunctionData("transfer", [
      toAddress,
      ethers.utils.parseUnits(tokenAmount, token.decimals),
    ]);

    setData(transferData);
    setValue("0");
    setIsTokenTransfer(false);
    toast({
      title: "Transfer Data Generated",
      description: "Token transfer data has been generated",
      status: "success",
      isClosable: true,
    });
  };

  const handleCreateTransaction = async () => {
    if (!activeWallet || !toAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in required fields",
        status: "error",
        isClosable: true,
      });
      return;
    }

    // Validate all inputs
    const toValidation = validateAddress(toAddress);
    if (!toValidation.valid) {
      toast({
        title: "Invalid Address",
        description: toValidation.error || "Invalid 'to' address",
        status: "error",
        isClosable: true,
      });
      return;
    }

    if (data) {
      const dataValidation = validateTransactionData(data);
      if (!dataValidation.valid) {
        toast({
          title: "Invalid Data",
          description: dataValidation.error || "Invalid transaction data",
          status: "error",
          isClosable: true,
        });
        return;
      }
    }

    try {
      const valueHex = value
        ? ethers.utils.parseEther(value).toHexString()
        : "0x0";

      const valueValidation = validateTransactionValue(valueHex);
      if (!valueValidation.valid) {
        toast({
          title: "Invalid Value",
          description: valueValidation.error || "Invalid transaction value",
          status: "error",
          isClosable: true,
        });
        return;
      }

      // Validate gas estimate if provided
      if (gasEstimate?.gasLimit) {
        const { validateGasLimit } = await import("../../utils/security");
        const gasValidation = validateGasLimit(gasEstimate.gasLimit);
        if (!gasValidation.valid) {
          toast({
            title: "Invalid Gas Limit",
            description: gasValidation.error || "Gas limit validation failed",
            status: "error",
            isClosable: true,
          });
          return;
        }
      }

      const tx = await createTransaction({
        from: activeWallet.address,
        to: toValidation.checksummed!,
        value: valueHex,
        data: sanitizeInput(data || "0x"),
        method: defaultExecutionMethod,
        gasLimit: gasEstimate?.gasLimit,
        gasPrice: gasEstimate?.gasPrice,
        maxFeePerGas: gasEstimate?.maxFeePerGas,
        maxPriorityFeePerGas: gasEstimate?.maxPriorityFeePerGas,
      });

      toast({
        title: "Transaction Created",
        description: `Transaction ${tx.id.slice(0, 10)}... created successfully`,
        status: "success",
        isClosable: true,
      });

      // Reset form
      setToAddress("");
      setValue("");
      setData("");
      setGasEstimate(null);
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Failed to create transaction",
        status: "error",
        isClosable: true,
      });
    }
  };

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
        <Heading size="md">Create Transaction</Heading>
        <Button onClick={onOpen}>New Transaction</Button>
      </HStack>

      <Box mb={4} p={4} borderWidth="1px" borderRadius="md">
        <FormControl>
          <FormLabel>Default Execution Method</FormLabel>
          <Select
            value={defaultExecutionMethod}
            onChange={(e) =>
              setDefaultExecutionMethod(e.target.value as TransactionExecutionMethod)
            }
          >
            <option value={TransactionExecutionMethod.DIRECT_ONCHAIN}>
              Direct On-Chain
            </option>
            <option value={TransactionExecutionMethod.RELAYER}>Relayer</option>
            <option value={TransactionExecutionMethod.SIMULATION}>Simulation</option>
          </Select>
        </FormControl>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Transaction</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>To Address</FormLabel>
                <Input
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="0x..."
                />
              </FormControl>

              <FormControl>
                <FormLabel>Native Value (ETH)</FormLabel>
                <NumberInput
                  value={value}
                  onChange={(_, val) => setValue(val.toString())}
                  precision={18}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <Box w="full" p={4} borderWidth="1px" borderRadius="md">
                <HStack mb={2}>
                  <Text fontWeight="bold">Token Transfer</Text>
                  <Button
                    size="sm"
                    onClick={() => setIsTokenTransfer(!isTokenTransfer)}
                  >
                    {isTokenTransfer ? "Cancel" : "Add Token Transfer"}
                  </Button>
                </HStack>

                {isTokenTransfer && (
                  <VStack spacing={3} align="stretch">
                    <FormControl>
                      <FormLabel>Token Address</FormLabel>
                      <Select
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                        placeholder="Select token"
                      >
                        {balance?.tokens.map((token) => (
                          <option key={token.tokenAddress} value={token.tokenAddress}>
                            {token.symbol} - {token.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Amount</FormLabel>
                      <Input
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(e.target.value)}
                        placeholder="0.0"
                        type="number"
                      />
                    </FormControl>

                    <Button onClick={handleCreateTokenTransfer} colorScheme="blue">
                      Generate Transfer Data
                    </Button>
                  </VStack>
                )}
              </Box>

              <FormControl>
                <FormLabel>Data (Hex)</FormLabel>
                <Code p={2} display="block" whiteSpace="pre-wrap" fontSize="xs">
                  <Input
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    placeholder="0x..."
                    fontFamily="mono"
                  />
                </Code>
              </FormControl>

              <HStack w="full">
                <Button
                  onClick={handleEstimateGas}
                  isDisabled={isEstimating || !toAddress}
                  isLoading={isEstimating}
                >
                  Estimate Gas
                </Button>
                {gasEstimate && (
                  <Text fontSize="sm" color="gray.400">
                    Gas: {gasEstimate.gasLimit} | Cost: ~
                    {ethers.utils.formatEther(gasEstimate.estimatedCost)} ETH
                  </Text>
                )}
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleCreateTransaction}>
                Create Transaction
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
