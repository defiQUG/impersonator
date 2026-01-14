import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  HStack,
  ModalCloseButton,
  ModalBody,
  Text,
  Input,
  Center,
  Button,
  Box,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import { slicedText } from "../../TransactionRequests";
import { SecureStorage } from "@/utils/encryption";
import { validateAddress } from "@/utils/security";
import { STORAGE_KEYS } from "@/utils/constants";

const secureStorage = new SecureStorage();

interface SavedAddressInfo {
  address: string;
  label: string;
}

interface AddressBookParams {
  isAddressBookOpen: boolean;
  closeAddressBook: () => void;
  showAddress: string;
  setShowAddress: (value: string) => void;
  setAddress: (value: string) => void;
}

function AddressBook({
  isAddressBookOpen,
  closeAddressBook,
  showAddress,
  setShowAddress,
  setAddress,
}: AddressBookParams) {
  const [newAddressInput, setNewAddressInput] = useState<string>("");
  const [newLableInput, setNewLabelInput] = useState<string>("");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressInfo[]>([]);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const stored = await secureStorage.getItem(STORAGE_KEYS.ADDRESS_BOOK);
        if (stored) {
          const parsed = JSON.parse(stored) as SavedAddressInfo[];
          setSavedAddresses(parsed);
        }
      } catch (error) {
        console.error("Failed to load address book:", error);
        // Try to migrate from plain localStorage
        try {
          const legacy = localStorage.getItem("address-book");
          if (legacy) {
            const parsed = JSON.parse(legacy) as SavedAddressInfo[];
            await secureStorage.setItem(STORAGE_KEYS.ADDRESS_BOOK, legacy);
            localStorage.removeItem("address-book");
            setSavedAddresses(parsed);
          }
        } catch (migrationError) {
          console.error("Failed to migrate address book:", migrationError);
        }
      }
    };
    loadAddresses();
  }, []);

  useEffect(() => {
    setNewAddressInput(showAddress);
  }, [showAddress]);

  useEffect(() => {
    const saveAddresses = async () => {
      if (savedAddresses.length > 0) {
        try {
          await secureStorage.setItem(
            STORAGE_KEYS.ADDRESS_BOOK,
            JSON.stringify(savedAddresses)
          );
        } catch (error) {
          console.error("Failed to save address book:", error);
        }
      } else {
        secureStorage.removeItem(STORAGE_KEYS.ADDRESS_BOOK);
      }
    };
    saveAddresses();
  }, [savedAddresses]);

  // reset label when modal is reopened
  useEffect(() => {
    setNewLabelInput("");
  }, [isAddressBookOpen]);

  return (
    <Modal isOpen={isAddressBookOpen} onClose={closeAddressBook} isCentered>
      <ModalOverlay bg="none" backdropFilter="auto" backdropBlur="5px" />
      <ModalContent
        minW={{
          base: 0,
          sm: "30rem",
          md: "40rem",
          lg: "60rem",
        }}
        pb="6"
        bg={"brand.lightBlack"}
      >
        <ModalHeader>Address Book</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <HStack>
            <Input
              placeholder="address / ens"
              value={newAddressInput}
              onChange={(e) => setNewAddressInput(e.target.value)}
            />
            <Input
              placeholder="label"
              value={newLableInput}
              onChange={(e) => setNewLabelInput(e.target.value)}
            />
          </HStack>
          <Center mt="3">
            <Button
              colorScheme={"blue"}
              isDisabled={
                newAddressInput.length === 0 || newLableInput.length === 0
              }
              onClick={async () => {
                // Validate address
                const validation = validateAddress(newAddressInput);
                if (!validation.valid) {
                  // Show error (would use toast in production)
                  console.error("Invalid address:", validation.error);
                  return;
                }

                const checksummedAddress = validation.checksummed!;
                
                // Check for duplicates
                const isDuplicate = savedAddresses.some(
                  (a) => a.address.toLowerCase() === checksummedAddress.toLowerCase()
                );
                if (isDuplicate) {
                  console.error("Address already exists in address book");
                  return;
                }

                setSavedAddresses([
                  ...savedAddresses,
                  {
                    address: checksummedAddress,
                    label: newLableInput,
                  },
                ]);
              }}
            >
              <HStack>
                <FontAwesomeIcon icon={faSave} />
                <Text>Save</Text>
              </HStack>
            </Button>
          </Center>
          {savedAddresses.length > 0 && (
            <Box mt="6" px="20">
              <Text fontWeight={"bold"}>Select from saved addresses:</Text>
              <Box mt="3" px="10">
                {savedAddresses.map(({ address, label }, i) => (
                  <HStack key={i} mt="2">
                    <Button
                      key={i}
                      w="100%"
                      onClick={() => {
                        setShowAddress(address);
                        setAddress(address);
                        closeAddressBook();
                      }}
                    >
                      {label} (
                      {address.indexOf(".eth") >= 0
                        ? address
                        : slicedText(address)}
                      )
                    </Button>
                    <Button
                      ml="2"
                      _hover={{
                        bg: "red.500",
                      }}
                      onClick={() => {
                        const _savedAddresses = savedAddresses;
                        _savedAddresses.splice(i, 1);

                        // using spread operator, else useEffect doesn't detect state change
                        setSavedAddresses([..._savedAddresses]);
                      }}
                    >
                      <DeleteIcon />
                    </Button>
                  </HStack>
                ))}
              </Box>
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default AddressBook;
