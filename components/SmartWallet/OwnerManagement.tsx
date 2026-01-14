"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Badge,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from "@chakra-ui/react";
import { DeleteIcon, AddIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { useSmartWallet } from "../../contexts/SmartWalletContext";
import { validateAddress, isContractAddress } from "../../utils/security";
import { ethers, providers } from "ethers";
import networksList from "evm-rpcs-list";

export default function OwnerManagement() {
  const { activeWallet, addOwner, removeOwner, updateThreshold, provider } = useSmartWallet();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [newThreshold, setNewThreshold] = useState(activeWallet?.threshold || 1);

  if (!activeWallet) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="md">
        <Text color="gray.400">No active wallet selected</Text>
      </Box>
    );
  }

  const handleAddOwner = async () => {
    // Validate address format
    const addressValidation = validateAddress(newOwnerAddress);
    if (!addressValidation.valid) {
      toast({
        title: "Invalid Address",
        description: addressValidation.error || "Please enter a valid Ethereum address",
        status: "error",
        isClosable: true,
      });
      return;
    }

    const checksummedAddress = addressValidation.checksummed!;

    // Check if contract (cannot add contracts as owners)
    if (activeWallet && provider) {
      try {
        const isContract = await isContractAddress(checksummedAddress, provider);
        if (isContract) {
          toast({
            title: "Cannot Add Contract",
            description: "Contract addresses cannot be added as owners",
            status: "error",
            isClosable: true,
          });
          return;
        }
      } catch (error) {
        console.error("Failed to check if contract:", error);
      }
    }

    // Check for duplicates (case-insensitive)
    if (activeWallet.owners.some(
      o => o.toLowerCase() === checksummedAddress.toLowerCase()
    )) {
      toast({
        title: "Owner Exists",
        description: "This address is already an owner",
        status: "error",
        isClosable: true,
      });
      return;
    }

    try {
      // Get caller address (in production, this would come from connected wallet)
      const callerAddress = typeof window !== "undefined" && (window as any).ethereum
        ? await (window as any).ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => accounts[0])
        : undefined;

      await addOwner(activeWallet.id, { address: checksummedAddress }, callerAddress);
      toast({
        title: "Owner Added",
        description: "Owner added successfully",
        status: "success",
        isClosable: true,
      });
      setNewOwnerAddress("");
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Failed to add owner",
        status: "error",
        isClosable: true,
      });
    }
  };

  const handleRemoveOwner = async (address: string) => {
    if (activeWallet.owners.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "Wallet must have at least one owner",
        status: "error",
        isClosable: true,
      });
      return;
    }

    // Validate address
    const addressValidation = validateAddress(address);
    if (!addressValidation.valid) {
      toast({
        title: "Invalid Address",
        description: addressValidation.error || "Invalid address format",
        status: "error",
        isClosable: true,
      });
      return;
    }

    try {
      // Get caller address
      const callerAddress = typeof window !== "undefined" && (window as any).ethereum
        ? await (window as any).ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => accounts[0])
        : undefined;

      await removeOwner(activeWallet.id, addressValidation.checksummed!, callerAddress);
      toast({
        title: "Owner Removed",
        description: "Owner removed successfully",
        status: "success",
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Failed to remove owner",
        status: "error",
        isClosable: true,
      });
    }
  };

  const handleUpdateThreshold = async () => {
    if (newThreshold < 1 || newThreshold > activeWallet.owners.length) {
      toast({
        title: "Invalid Threshold",
        description: `Threshold must be between 1 and ${activeWallet.owners.length}`,
        status: "error",
        isClosable: true,
      });
      return;
    }

    try {
      // Get caller address
      const callerAddress = typeof window !== "undefined" && (window as any).ethereum
        ? await (window as any).ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => accounts[0])
        : undefined;

      await updateThreshold(activeWallet.id, newThreshold, callerAddress);
      toast({
        title: "Threshold Updated",
        description: "Threshold updated successfully",
        status: "success",
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Failed to update threshold",
        status: "error",
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <HStack mb={4} justify="space-between">
        <Heading size="md">Owners</Heading>
        <Button leftIcon={<AddIcon />} onClick={onOpen} size="sm">
          Add Owner
        </Button>
      </HStack>

      <VStack align="stretch" spacing={2}>
        {activeWallet.owners.map((owner, index) => (
          <HStack
            key={index}
            p={3}
            borderWidth="1px"
            borderRadius="md"
            justify="space-between"
          >
            <HStack>
              <Text fontSize="sm">{owner}</Text>
              {index < activeWallet.threshold && (
                <Badge colorScheme="green">Required</Badge>
              )}
            </HStack>
            <IconButton
              aria-label="Remove owner"
              icon={<DeleteIcon />}
              size="sm"
              colorScheme="red"
              onClick={() => handleRemoveOwner(owner)}
              isDisabled={activeWallet.owners.length <= 1}
            />
          </HStack>
        ))}
      </VStack>

      <Box mt={4} p={4} borderWidth="1px" borderRadius="md">
        <HStack>
          <FormControl>
            <FormLabel>Threshold</FormLabel>
            <Input
              type="number"
              value={newThreshold}
              onChange={(e) => setNewThreshold(parseInt(e.target.value) || 1)}
              min={1}
              max={activeWallet.owners.length}
            />
          </FormControl>
          <Button onClick={handleUpdateThreshold} mt={6}>
            Update Threshold
          </Button>
        </HStack>
        <Text fontSize="sm" color="gray.400" mt={2}>
          Current: {activeWallet.threshold} of {activeWallet.owners.length}
        </Text>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Owner</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Owner Address</FormLabel>
                <Input
                  value={newOwnerAddress}
                  onChange={(e) => setNewOwnerAddress(e.target.value)}
                  placeholder="0x..."
                />
              </FormControl>
              <HStack>
                <Button onClick={onClose}>Cancel</Button>
                <Button colorScheme="blue" onClick={handleAddOwner}>
                  Add Owner
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
