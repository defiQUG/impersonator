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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
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
} from "@chakra-ui/react";
import { useState } from "react";
import { useSmartWallet } from "../../contexts/SmartWalletContext";
import { SmartWalletType } from "../../types";
import { validateAddress, validateNetworkId } from "../../utils/security";
import { ethers } from "ethers";

export default function DeployWallet() {
  const { createWallet, setActiveWallet, provider } = useSmartWallet();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [walletType, setWalletType] = useState<SmartWalletType>(SmartWalletType.GNOSIS_SAFE);
  const [owners, setOwners] = useState<string[]>([""]);
  const [threshold, setThreshold] = useState(1);
  const [networkId, setNetworkId] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleAddOwner = () => {
    setOwners([...owners, ""]);
  };

  const handleRemoveOwner = (index: number) => {
    if (owners.length > 1) {
      const newOwners = owners.filter((_, i) => i !== index);
      setOwners(newOwners);
      if (threshold > newOwners.length) {
        setThreshold(newOwners.length);
      }
    }
  };

  const handleOwnerChange = (index: number, value: string) => {
    const newOwners = [...owners];
    newOwners[index] = value;
    setOwners(newOwners);
  };

  const handleDeploy = async () => {
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

    // Validate owners
    const validOwners: string[] = [];
    for (const owner of owners) {
      if (!owner) continue;
      const validation = validateAddress(owner);
      if (validation.valid && validation.checksummed) {
        validOwners.push(validation.checksummed);
      }
    }

    if (validOwners.length === 0) {
      toast({
        title: "Invalid Owners",
        description: "Please add at least one valid owner address",
        status: "error",
        isClosable: true,
      });
      return;
    }

    // Check for duplicate owners
    const uniqueOwners = Array.from(new Set(validOwners.map(o => o.toLowerCase())));
    if (uniqueOwners.length !== validOwners.length) {
      toast({
        title: "Duplicate Owners",
        description: "Each owner address must be unique",
        status: "error",
        isClosable: true,
      });
      return;
    }

    if (threshold < 1 || threshold > validOwners.length) {
      toast({
        title: "Invalid Threshold",
        description: `Threshold must be between 1 and ${validOwners.length}`,
        status: "error",
        isClosable: true,
      });
      return;
    }

    setIsDeploying(true);
    try {
      if (walletType === SmartWalletType.GNOSIS_SAFE && provider) {
        // For Gnosis Safe deployment, we would need a signer
        // This is a placeholder - full implementation would deploy the contract
        toast({
          title: "Deployment Not Available",
          description: "Gnosis Safe deployment requires a signer. Please connect a wallet first.",
          status: "info",
          isClosable: true,
        });

        // Create wallet config anyway for testing
        const wallet = await createWallet({
          type: walletType,
          address: ethers.Wallet.createRandom().address, // Placeholder address
          networkId,
          owners: validOwners.map(o => validateAddress(o).checksummed!),
          threshold,
        });

        setActiveWallet(wallet);
        toast({
          title: "Wallet Created",
          description: "Wallet configuration created (not deployed on-chain)",
          status: "success",
          isClosable: true,
        });
        onClose();
      } else {
        // For other wallet types
        const wallet = await createWallet({
          type: walletType,
          address: ethers.Wallet.createRandom().address,
          networkId,
          owners: validOwners,
          threshold,
        });

        setActiveWallet(wallet);
        toast({
          title: "Wallet Created",
          description: "Wallet configuration created",
          status: "success",
          isClosable: true,
        });
        onClose();
      }
    } catch (error: any) {
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to deploy wallet",
        status: "error",
        isClosable: true,
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Box>
      <Button onClick={onOpen} mb={4}>
        Deploy New Wallet
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Deploy Smart Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
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
                <FormLabel>Network ID</FormLabel>
                <NumberInput
                  value={networkId}
                  onChange={(_, val) => setNetworkId(val)}
                  min={1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <Box w="full">
                <HStack mb={2} justify="space-between">
                  <FormLabel>Owners</FormLabel>
                  <Button size="sm" onClick={handleAddOwner}>
                    Add Owner
                  </Button>
                </HStack>
                <VStack spacing={2} align="stretch">
                  {owners.map((owner, index) => (
                    <HStack key={index}>
                      <Input
                        value={owner}
                        onChange={(e) => handleOwnerChange(index, e.target.value)}
                        placeholder="0x..."
                      />
                      {owners.length > 1 && (
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleRemoveOwner(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </HStack>
                  ))}
                </VStack>
              </Box>

              <FormControl>
                <FormLabel>Threshold</FormLabel>
                <NumberInput
                  value={threshold}
                  onChange={(_, val) => setThreshold(val)}
                  min={1}
                  max={owners.filter((o) => ethers.utils.isAddress(o)).length || 1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.400" mt={1}>
                  {threshold} of {owners.filter((o) => ethers.utils.isAddress(o)).length || 0} owners required
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleDeploy}
                isLoading={isDeploying}
              >
                Deploy
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
