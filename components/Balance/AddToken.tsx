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
import { getTokenBalance } from "../../helpers/balance";
import { validateAddress } from "../../utils/security";
import { ethers } from "ethers";

export default function AddToken() {
  const { activeWallet, provider, refreshBalance } = useSmartWallet();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [tokenAddress, setTokenAddress] = useState("");

  const handleAddToken = async () => {
    if (!activeWallet || !provider) {
      toast({
        title: "Missing Requirements",
        description: "Wallet and provider must be available",
        status: "error",
        isClosable: true,
      });
      return;
    }

    // Validate address
    const addressValidation = validateAddress(tokenAddress);
    if (!addressValidation.valid) {
      toast({
        title: "Invalid Address",
        description: addressValidation.error || "Please enter a valid token contract address",
        status: "error",
        isClosable: true,
      });
      return;
    }

    const validatedAddress = addressValidation.checksummed!;

    try {
      // Verify token exists by fetching balance
      const tokenBalance = await getTokenBalance(
        validatedAddress,
        activeWallet.address,
        provider
      );

      if (!tokenBalance) {
        toast({
          title: "Token Not Found",
          description: "Could not fetch token information. Please verify the address.",
          status: "error",
          isClosable: true,
        });
        return;
      }

      // Refresh balance to include the new token
      await refreshBalance();

      toast({
        title: "Token Added",
        description: `${tokenBalance.symbol} (${tokenBalance.name}) added successfully`,
        status: "success",
        isClosable: true,
      });

      setTokenAddress("");
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Failed to add token",
        status: "error",
        isClosable: true,
      });
    }
  };

  if (!activeWallet) {
    return null;
  }

  return (
    <Box>
      <Button onClick={onOpen} size="sm" mb={4}>
        Add Custom Token
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Custom Token</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Token Contract Address</FormLabel>
                <Input
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="0x..."
                />
                <Text fontSize="xs" color="gray.400" mt={1}>
                  Enter the ERC20 token contract address
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleAddToken}>
                Add Token
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
