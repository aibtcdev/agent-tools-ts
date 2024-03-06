// get currently selected wallet info from env file

import { hexToBytes } from "@stacks/common";
import {
  getPublicKeyFromPrivate,
  verifyMessageSignatureRsv,
} from "@stacks/encryption";
import {
  createStacksPrivateKey,
  cvToHex,
  hashStructuredData,
  signStructuredData,
  stringAsciiCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { deriveChildAccount } from "../utilities";

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

  /*
  Test data so far:
  Account index: 6
    Account address: ST6CWNRQWF468S6A56Q995WVY7F6X43GFV7H16N2
    Private key: verified
    Public key: 0236abd49563801f333b2e5118e2c0fe64e8bbc5cc76cf0b090d12ee6708fdeec9
  */

  // create a domain object
  // based on @stacks.js/transactions signature test
  // https://github.com/hirosystems/stacks.js/blob/fc7e50cb1dca6402677451be06534f0a8f1346b3/packages/transactions/tests/structuredDataSignature.test.ts#L214-L242
  const domain = tupleCV({
    name: stringAsciiCV("aibtcdev"),
    version: stringAsciiCV("0.0.2"),
    "chain-id": uintCV(1),
  });

  // create a message object formatted:
  // address,timestamp
  // e.g. ST6CWNRQWF468S6A56Q995WVY7F6X43GFV7H16N2,2024-03-01T20:00:00.000Z
  const message = `${address}`; // ,${new Date().toISOString()}
  const messageCV = stringAsciiCV(message);

  // hash the message (not sure if needed)
  const hashedMessage = hashStructuredData(messageCV);
  const hashedMessageHex = Buffer.from(hashedMessage).toString("hex");

  // create signed message
  const signedMessage = signStructuredData({
    message: messageCV,
    domain,
    privateKey: privateKeyObj,
  });

  // verify the signature
  const isSignatureVerified = verifyMessageSignatureRsv({
    signature: signedMessage.data,
    // using the string returns false
    // message: message,
    // using the hex for the CV returns false
    // message: cvToHex(messageCV),
    // matches hashedMessage but returns false
    message: hexToBytes(hashedMessageHex),
    publicKey,
  });

  // log all the things
  console.log(`===== ACCOUNT INFO =====`);
  console.log(`Account index: ${accountIndex}`);
  console.log(`Account address: ${address}`);
  console.log(`Public key: ${publicKey}`);
  console.log(`===== SIGNATURE TEST =====`);
  console.log(`Message: ${message}`);
  console.log(`Hashed message: ${hashedMessage}`);
  console.log(`Hashed message hex: ${hashedMessageHex}`);
  console.log(`Signature object: ${JSON.stringify(signedMessage)}`);
  console.log(`Signed data: ${JSON.stringify(signedMessage.data)}`);
  console.log(`===== DECODE SIGNATURE TEST =====`);
  console.log(`Is signature verified: ${isSignatureVerified}`);
  console.log(`message: ${message}`);
  console.log(`messageCV Hex: ${cvToHex(messageCV)}`);
  console.log(`message hex to bytes: ${hexToBytes(hashedMessageHex)}`);
}

main();
