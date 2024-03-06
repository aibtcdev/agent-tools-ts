// get currently selected wallet info from env file

import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes } from "@stacks/common";
import {
  getPublicKeyFromPrivate,
  verifyMessageSignature,
  verifyMessageSignatureRsv,
} from "@stacks/encryption";
import {
  createStacksPrivateKey,
  cvToHex,
  cvToJSON,
  cvToValue,
  decodeStructuredDataSignature,
  encodeStructuredData,
  hashStructuredData,
  hexToCV,
  publicKeyFromSignatureRsv,
  signStructuredData,
  stringAsciiCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { deriveChildAccount, getNetwork, getTxVersion } from "../utilities";

// CONFIGURATION

// @ts-ignore (env is injected by Bun)
const NETWORK = Bun.env.network;
// @ts-ignore (env is injected by Bun)
const MNEMONIC = Bun.env.mnemonic;
// @ts-ignore (env is injected by Bun)
const ACCOUNT_INDEX = Bun.env.accountIndex;

// MAIN SCRIPT (DO NOT EDIT BELOW)

async function main() {
  // get account info from env
  const network = NETWORK;
  const mnemonic = MNEMONIC;
  const accountIndex = ACCOUNT_INDEX;
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
  const { address, key: privateKey } = await deriveChildAccount(
    network,
    mnemonic,
    accountIndex
  );
  // create private key obj for signature function
  const privateKeyObj = createStacksPrivateKey(privateKey);
  // get public key from private key
  const publicKey = getPublicKeyFromPrivate(privateKey);

  console.log(`===== ACCOUNT INFO =====`);
  console.log(`Network: ${network}`);
  console.log(`Chain ID: ${networkObj.chainId}`);
  console.log(`Transaction version: ${txVersion}`);
  console.log(`Account index: ${accountIndex}`);
  console.log(`Account address: ${address}`);
  console.log(`Public key: ${publicKey}`);

  // create a domain object
  // based on @stacks.js/transactions signature test
  // https://github.com/hirosystems/stacks.js/blob/fc7e50cb1dca6402677451be06534f0a8f1346b3/packages/transactions/tests/structuredDataSignature.test.ts#L214-L242
  const domainCV = tupleCV({
    name: stringAsciiCV("aibtcdev"),
    version: stringAsciiCV("0.0.2"),
    "chain-id": uintCV(networkObj.chainId),
  });
  const domain = cvToJSON(domainCV);

  // create a message object formatted:
  // address,timestamp
  // e.g. ST6CWNRQWF468S6A56Q995WVY7F6X43GFV7H16N2,2024-03-01T20:00:00.000Z
  const message = `${address}`; // ,${new Date().toISOString()}
  const messageCV = stringAsciiCV(message);

  // create signed message
  const signedMessage = signStructuredData({
    message: messageCV,
    domain: domainCV,
    privateKey: privateKeyObj,
  });

  console.log(`===== SIGNATURE TEST =====`);
  console.log(`Message: ${cvToValue(messageCV)}`);
  console.log(`Domain: ${JSON.stringify(domain, null, 2)}`);
  console.log(`Signature object: ${JSON.stringify(signedMessage, null, 2)}`);
  console.log(`Signed data: ${signedMessage.data}`);

  // hash the domain
  const hashedDomain = hashStructuredData(domainCV);
  const hashedDomainHex = bytesToHex(hashedDomain);
  // hash the message
  const hashedMessage = hashStructuredData(messageCV);
  const hashedMessageHex = bytesToHex(hashedMessage);

  // encode the data
  const encodedTestData = encodeStructuredData({
    message: messageCV,
    domain: domainCV,
  });
  const decodedTestSignature = decodeStructuredDataSignature(encodedTestData);

  // decode the signature
  const decodedSignature = decodeStructuredDataSignature(signedMessage.data);

  console.log(`===== HASH TEST =====`);

  console.log(`Hashed domain hex: ${hashedDomainHex}`);
  console.log(`Hashed message hex: ${hashedMessageHex}`);
  console.log(
    `Decoded signature domain hex: ${bytesToHex(decodedSignature.domainHash)}`
  );
  console.log(
    `Decoded signature message hex: ${bytesToHex(decodedSignature.messageHash)}`
  );
  console.log(
    `Decoded test signature domain hex: ${bytesToHex(
      decodedTestSignature.domainHash
    )}`
  );
  console.log(
    `Decoded test signature message hex: ${bytesToHex(
      decodedTestSignature.messageHash
    )}`
  );

  // get public key from the signature
  // other signature format (not SIP-018)
  /*
  const publicKeyFromSignature = publicKeyFromSignatureRsv(
    hashedMessageHex,
    signedMessage
  );
  */

  // get address from the public key
  // getAddressFromPublicKey(publicKey, txVersion);

  // verify the signature
  const isSignatureVerified = verifyMessageSignatureRsv({
    signature: signedMessage.data,
    // using the string returns false
    // message: message,
    // using the hex for the CV returns false
    // message: cvToHex(messageCV),
    // matches hashedMessage but returns false
    message: message,
    publicKey: publicKey,
  });

  // trying without rsv, same result
  const isSignatureVerifiedAlt = verifyMessageSignature({
    signature: signedMessage.data,
    message: message,
    publicKey,
  });

  // log all the things

  console.log(`===== DECODE SIGNATURE TEST =====`);
  console.log(`Is signature verified: ${isSignatureVerified}`);
  console.log(`Is signature verified (alt): ${isSignatureVerifiedAlt}`);
}

main();
