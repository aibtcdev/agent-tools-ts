import { sha256 } from "@noble/hashes/sha256";
import { Point, Signature } from "@noble/secp256k1";
import {
  bytesToHex,
  hexToBigInt,
  parseRecoverableSignatureVrs,
  signatureRsvToVrs,
} from "@stacks/common";
import {
  getPublicKeyFromPrivate,
  verifyMessageSignatureRsv,
} from "@stacks/encryption";
import {
  PubKeyEncoding,
  StructuredDataSignature,
  createStacksPrivateKey,
  cvToJSON,
  cvToValue,
  encodeStructuredData,
  publicKeyFromSignatureRsv,
  signMessageHashRsv,
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
  // ACCOUNT INFO

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
  const { address, key: privateKeyString } = await deriveChildAccount(
    network,
    mnemonic,
    accountIndex
  );
  // get public key from private key
  const publicKey = getPublicKeyFromPrivate(privateKeyString);

  console.log(`===== ACCOUNT INFO =====`);
  console.log(`Network: ${network}`);
  console.log(`Chain ID: ${networkObj.chainId}`);
  console.log(`Transaction version: ${txVersion}`);
  console.log(`Account index: ${accountIndex}`);
  console.log(`Account address: ${address}`);
  console.log(`Public key: ${publicKey}`);

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

  // VALIDATING THE EXPECTED SIGNED MESSAGE

  const expectedMessage = encodeStructuredData({
    message,
    domain,
  });
  const expectedMessageHashed = sha256(expectedMessage);

  // test if signature is verified
  const isTestSignatureVerified = verifyMessageSignatureRsv({
    signature: signedMessage.data,
    message: expectedMessageHashed,
    publicKey: publicKey,
  });

  console.log(`===== VALIDATION INFO =====`);
  console.log(`Signature verified: ${isTestSignatureVerified}`);

  // GETTING THE PUBLIC KEY FROM TYPE 9

  const simpleMessage = "aibtcdev";
  const simpleMessageEncoded = encodeStructuredData({
    message: stringAsciiCV(simpleMessage),
    domain,
  });
  const simpleMessageHashed = sha256(simpleMessageEncoded);
  const simpleMessageHashedHex = bytesToHex(simpleMessageHashed);

  // this is type 9: MessageSignature
  const simpleMessageSigned = signMessageHashRsv({
    privateKey,
    messageHash: simpleMessageHashedHex,
  });

  console.log(`Simple message: ${simpleMessage}`);
  console.log(`Simple message hex: ${simpleMessageHashedHex}`);
  console.log(
    `Simple message signed: ${JSON.stringify(simpleMessageSigned, null, 2)}`
  );

  const publicKeyFromSignature = publicKeyFromSignatureRsv(
    simpleMessageHashedHex,
    simpleMessageSigned
  );

  console.log(`Public key from signature: ${publicKeyFromSignature}`);

  // GETTING THE PUBLIC KEY FROM TYPE 10 SIGNATURE (SIP-018)

  const pubKeyTestFromSignature = publicKeyFromSignatureRsvStructured(
    bytesToHex(expectedMessageHashed),
    signedMessage
  );
  console.log(
    `Public key from signature (SIP-018): ${pubKeyTestFromSignature}`
  );
}

function publicKeyFromSignatureVrsStructured(
  messageHash: string,
  messageSignature: StructuredDataSignature,
  pubKeyEncoding = PubKeyEncoding.Compressed
): string {
  const parsedSignature = parseRecoverableSignatureVrs(messageSignature.data);
  const signature = new Signature(
    hexToBigInt(parsedSignature.r),
    hexToBigInt(parsedSignature.s)
  );
  const point = Point.fromSignature(
    messageHash,
    signature,
    parsedSignature.recoveryId
  );
  const compressed = pubKeyEncoding === PubKeyEncoding.Compressed;
  return point.toHex(compressed);
}

function publicKeyFromSignatureRsvStructured(
  messageHash: string,
  messageSignature: StructuredDataSignature,
  pubKeyEncoding?: PubKeyEncoding.Compressed
) {
  return publicKeyFromSignatureVrsStructured(
    messageHash,
    { ...messageSignature, data: signatureRsvToVrs(messageSignature.data) },
    pubKeyEncoding
  );
}

main();
