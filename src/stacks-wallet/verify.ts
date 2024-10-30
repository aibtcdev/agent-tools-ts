import { bytesToHex } from "@stacks/common";
import {
  publicKeyFromSignatureRsv,
  getAddressFromPublicKey,
  stringAsciiCV,
  tupleCV,
  uintCV,
  encodeStructuredData,
} from "@stacks/transactions";
import { sha256 } from "@noble/hashes/sha256";
import { verifyMessageSignatureRsv } from "@stacks/encryption";
import { getNetwork, getTxVersion, CONFIG } from "../utilities.js"; // Adjust the path as needed

/**
 * Verifies a signed message against an address by:
 * - Reconstructing the expected domain and message structure.
 * - Hashing the message.
 * - Extracting the public key from the signature.
 * - Deriving the address from the public key.
 * - Validating the signature with the recovered public key.
 *
 * @param {string} signedMessageData - The RSV signature of the message.
 * @param {string} address - The expected address to verify against.
 */
async function verifyMessage(signedMessageData: string, address: string) {
  try {
    const network = CONFIG.NETWORK; // Get network configuration
    const networkObj = getNetwork(network); // Fetch network details (e.g., chain ID)
    const txVersion = getTxVersion(network); // Determine tx version (mainnet/testnet)

    // Create the domain object used in the original signing process
    const domain = tupleCV({
      name: stringAsciiCV("aibtcdev"), // Name of the domain (can be customized)
      version: stringAsciiCV("0.0.2"), // Version used during signing
      "chain-id": uintCV(networkObj.chainId), // Chain ID for network specificity
    });

    // Encode the structured data message with the provided address
    const encodedMessage = encodeStructuredData({
      message: stringAsciiCV(address),
      domain,
    });

    // Hash the encoded message using SHA-256
    const messageHash = sha256(encodedMessage);

    // Recover the public key from the signature and hashed message
    const publicKey = publicKeyFromSignatureRsv(bytesToHex(messageHash), {
      type: 10, // Signature type (RSV format)
      data: signedMessageData, // Signed data input
    });

    // Derive the address from the recovered public key
    const derivedAddress = getAddressFromPublicKey(publicKey, txVersion);

    // Ensure the derived address matches the expected address
    if (address !== derivedAddress) {
      throw new Error("Derived address does not match the signing address.");
    }

    // Verify the signature with the recovered public key
    const isValid = verifyMessageSignatureRsv({
      signature: signedMessageData,
      publicKey,
      message: messageHash,
    });

    console.log(`Signature Verified: ${isValid}`);
    process.exit(isValid ? 0 : 1); // Exit with code 0 if valid, 1 if not
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Verification failed: ${errorMessage}`);
    process.exit(1); // Exit with error code on failure
  }
}

/**
 * Collects command-line input and triggers verification.
 */
const [, , signedMessageData, address] = process.argv;

if (!signedMessageData || !address) {
  console.error("Usage: verifyMessage <signedMessageData> <address>");
  process.exit(1);
}

verifyMessage(signedMessageData, address);
