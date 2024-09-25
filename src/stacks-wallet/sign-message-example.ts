import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@stacks/common";
import {
  getPublicKeyFromPrivate,
  verifyMessageSignatureRsv,
} from "@stacks/encryption";
import {
  createStacksPrivateKey,
  cvToJSON,
  cvToValue,
  encodeStructuredData,
  getAddressFromPublicKey,
  publicKeyFromSignatureRsv,
  signStructuredData,
  stringAsciiCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getTxVersion,
} from "../utilities";

// MAIN SCRIPT (DO NOT EDIT BELOW)

async function main() {
  // ACCOUNT INFO

  // get account info from env
  const network = CONFIG.NETWORK;
  const mnemonic = CONFIG.MNEMONIC;
  const accountIndex = CONFIG.ACCOUNT_INDEX;
  // check that values exist for each
  if (!network) {
    throw new Error("No network provided in environment variables");
  }
  if (!mnemonic) {
    throw new Error("No mnemonic provided in environment variables");
  }
  if (!accountIndex) {
    throw new Error("No account index provided in environment variables");
  }
  // get network object
  const networkObj = getNetwork(network);
  // get tx version object
  const txVersion = getTxVersion(network);
  // get account address and private key
  const { address, key: privateKeyString } = await deriveChildAccount(
    network,
    mnemonic,
    accountIndex
  );

  console.log(`===== ACCOUNT INFO =====`);
  console.log(`Network: ${network}`);
  console.log(`Chain ID: ${networkObj.chainId}`);
  console.log(`Tx version: ${txVersion}`);
  console.log(`Account index: ${accountIndex}`);
  console.log(`Account address: ${address}`);

  // SIGNING THE MESSAGE

  // create private key obj for signature function
  const privateKey = createStacksPrivateKey(privateKeyString);

  // create a domain object as a clarity value
  // based on @stacks.js/transactions signature test
  // https://github.com/hirosystems/stacks.js/blob/fc7e50cb1dca6402677451be06534f0a8f1346b3/packages/transactions/tests/structuredDataSignature.test.ts#L214-L242
  const domain = tupleCV({
    name: stringAsciiCV("aibtcdev"),
    version: stringAsciiCV("0.0.2"),
    "chain-id": uintCV(networkObj.chainId),
  });

  // create the message to be signed as a clarity value
  const message = stringAsciiCV(address);

  // sign the message
  // this is type 10: StructuredDataSignature
  const signedMessage = signStructuredData({
    message,
    domain,
    privateKey,
  });

  console.log(`===== SIGNATURE INFO =====`);
  console.log(`Message: ${cvToValue(message)}`);
  console.log(`Domain: ${JSON.stringify(cvToJSON(domain), null, 2)}`);
  console.log(`Signed message type: ${signedMessage.type}`);
  console.log(`Signed message data: ${signedMessage.data}`);

  // GETTING THE PUBLIC KEY FROM TYPE 10 SIGNATURE (SIP-018)

  // get public key from private key
  const publicKeyFromPrivate = getPublicKeyFromPrivate(privateKeyString);

  const expectedMessage = encodeStructuredData({
    message,
    domain,
  });
  const expectedMessageHashed = sha256(expectedMessage);

  const publicKeyFromSignature = publicKeyFromSignatureRsv(
    bytesToHex(expectedMessageHashed),
    signedMessage
  );

  const addressFromSignature = getAddressFromPublicKey(
    publicKeyFromSignature,
    txVersion
  );

  // VALIDATING THE EXPECTED SIGNED MESSAGE

  // test if signature is verified
  const isTestSignatureVerified = verifyMessageSignatureRsv({
    signature: signedMessage.data,
    message: expectedMessageHashed,
    publicKey: publicKeyFromSignature,
  });

  console.log(`===== VALIDATION INFO =====`);
  console.log(`Public key from private:   ${publicKeyFromPrivate}`);
  console.log(`Public key from signature: ${publicKeyFromSignature}`);
  console.log(`Address from private key:  ${address}`);
  console.log(`Address from signature:    ${addressFromSignature}`);
  console.log(`Signature verified: ${isTestSignatureVerified}`);
}

main();
