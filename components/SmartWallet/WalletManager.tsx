"use client";

import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  useToast,
  Badge,
  IconButton,
  Tr,
  Td,
  Table,
  Thead,
  Th,
  Tbody,
} from "@chakra-ui/react";
import { DeleteIcon, AddIcon, EditIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { useSmartWallet } from "../../contexts/SmartWalletContext";
import { SmartWalletType } from "../../types";
import { validateAddress, validateNetworkId } from "../../utils/security";
import { ethers } from "ethers";
import DeployWallet from "./DeployWallet";

export default function WalletManager() {
  const {
    smartWallets,
    activeWallet,
    setActiveWallet,
    createWallet,
    deleteWallet,
    connectToWallet,
  } = useSmartWallet();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [walletAddress, setWalletAddress] = useState("");
  const [networkId, setNetworkId] = useState(1);
  const [walletType, setWalletType] = useState<SmartWalletType>(SmartWalletType.GNOSIS_SAFE);

  const handleConnect = async () => {
    // Validate address
    const addressValidation = validateAddress(walletAddress);
    if (!addressValidation.valid) {
      toast({
        title: "Invalid Address",
        description: addressValidation.error || "Please enter a valid Ethereum address",
        status: "error",
        isClosable: true,
      });
      return;
    }

    // Validate network ID
    const networkValidation = validateNetworkId(networkId);
    if (!networkValidation.valid) {
      toast({
        title: "Invalid Network",
        description: networkValidation.error || "Network not supported",
        status: "error",
        isClosable: true,
      });
      return;
    }

    try {
      const wallet = await connectToWallet(
        addressValidation.checksummed!,
        networkId,
        walletType
      );
      if (wallet) {
        setActiveWallet(wallet);
        toast({
          title: "Wallet Connected",
          description: `Connected to ${addressValidation.checksummed!.slice(0, 10)}...`,
          status: "success",
          isClosable: true,
        });
        onClose();
      } else {
        throw new Error("Failed to connect to wallet");
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to wallet",
        status: "error",
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <HStack mb={4} justify="space-between">
        <Heading size="md">Smart Wallets</Heading>
        <HStack>
          <DeployWallet />
          <Button leftIcon={<AddIcon />} onClick={onOpen} size="sm">
            Connect Wallet
          </Button>
        </HStack>
      </HStack>

      {activeWallet && (
        <Box mb={4} p={4} borderWidth="1px" borderRadius="md">
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <HStack>
                <Text fontWeight="bold">Active Wallet:</Text>
                <Badge>{activeWallet.type}</Badge>
              </HStack>
              <Text fontSize="sm" color="gray.400">
                {activeWallet.address}
              </Text>
              <Text fontSize="sm">
                {activeWallet.owners.length} owner(s), threshold: {activeWallet.threshold}
              </Text>
            </VStack>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveWallet(undefined)}
            >
              Disconnect
            </Button>
          </HStack>
        </Box>
      )}

      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Address</Th>
            <Th>Type</Th>
            <Th>Network</Th>
            <Th>Owners</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {smartWallets.map((wallet) => (
            <Tr key={wallet.id}>
              <Td>
                <Text fontSize="sm">{wallet.address.slice(0, 10)}...</Text>
              </Td>
              <Td>
                <Badge>{wallet.type}</Badge>
              </Td>
              <Td>{wallet.networkId}</Td>
              <Td>
                {wallet.owners.length} ({wallet.threshold})
              </Td>
              <Td>
                <HStack>
                  <IconButton
                    aria-label="Select wallet"
                    icon={<EditIcon />}
                    size="sm"
                    onClick={() => setActiveWallet(wallet)}
                    isDisabled={activeWallet?.id === wallet.id}
                  />
                  <IconButton
                    aria-label="Delete wallet"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => deleteWallet(wallet.id)}
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Connect Smart Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Wallet Type</FormLabel>
                <Select
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value as SmartWalletType)}
                >
                  <option value={SmartWalletType.GNOSIS_SAFE}>Gnosis Safe</option>
                  <option value={SmartWalletType.ERC4337}>ERC-4337 Account</option>
                  <option value={SmartWalletType.CUSTOM}>Custom</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Wallet Address</FormLabel>
                <Input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                />
              </FormControl>

              <FormControl>
                <FormLabel>Network ID</FormLabel>
                <NumberInput
                  value={networkId}
                  onChange={(_, value) => setNetworkId(value)}
                  min={1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <HStack>
                <Button onClick={onClose}>Cancel</Button>
                <Button colorScheme="blue" onClick={handleConnect}>
                  Connect
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
