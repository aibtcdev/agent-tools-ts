import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { BIP32Factory } from "bip32";
import { ECPairFactory } from "ecpair";
import { config } from "dotenv";

// Load environment variables
config();

const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

type NetworkType = "testnet" | "mainnet";

interface KeyInfo {
  network: NetworkType;
  path: string;
  privateKeyHex: string;
  privateKeyWIF: string;
  publicKey: string;
  p2pkhAddress: string; // Legacy address
  p2wpkhAddress: string; // Native SegWit address
}

function getMnemonicInfo(
  mnemonic: string,
  network: NetworkType = "testnet",
  account: number = 0,
  index: number = 0
): KeyInfo {
  // Validate mnemonic
  if (!mnemonic || !bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic");
  }

  // Convert mnemonic to seed
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  // Determine network
  const bitcoinNetwork =
    network === "testnet" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

  // Derive the BIP44 path
  // m/44'/0' for mainnet, m/44'/1' for testnet
  const coinType = network === "testnet" ? 1 : 0;
  const path = `m/44'/${coinType}'/${account}'/0/${index}`;

  // Derive the key
  const root = bip32.fromSeed(seed, bitcoinNetwork);
  const child = root.derivePath(path);

  if (!child.privateKey) {
    throw new Error("Failed to derive private key");
  }

  // Get the keypair
  const keyPair = ECPair.fromPrivateKey(child.privateKey, {
    network: bitcoinNetwork,
  });

  // Convert Uint8Array to Buffer to fix type issues
  const pubkeyBuffer = Buffer.from(keyPair.publicKey);

  // Fix for newer versions of bitcoinjs-lib
  const p2pkhPayment = bitcoin.payments.p2pkh({
    pubkey: pubkeyBuffer,
    network: bitcoinNetwork,
  });

  const p2wpkhPayment = bitcoin.payments.p2wpkh({
    pubkey: pubkeyBuffer,
    network: bitcoinNetwork,
  });

  if (!p2pkhPayment.address || !p2wpkhPayment.address) {
    throw new Error("Failed to derive addresses");
  }

  return {
    network,
    path,
    privateKeyHex: child.privateKey.toString(),
    privateKeyWIF: keyPair.toWIF(),
    publicKey: child.publicKey.toString(),
    p2pkhAddress: p2pkhPayment.address,
    p2wpkhAddress: p2wpkhPayment.address,
  };
}

// Get mnemonic from environment variable
const mnemonic =
  "if you copy paste it here it works but dont forget to delete it afterwards"; // process.env.MNEMONIC;

if (!mnemonic) {
  console.error("ERROR: MNEMONIC environment variable is not set");
  process.exit(1);
}

try {
  const testnetInfo = getMnemonicInfo(mnemonic, "testnet");
  const mainnetInfo = getMnemonicInfo(mnemonic, "mainnet");

  console.log("=== TESTNET INFO ===");
  console.log(testnetInfo);
  console.log("\n=== MAINNET INFO ===");
  console.log(mainnetInfo);

  console.log("\n=== FOR THE BTC_PRIVATE_KEY ENV VARIABLE ===");
  console.log(testnetInfo.privateKeyHex); // Use this for testnet
  // console.log(mainnetInfo.privateKeyHex);  // Use this for mainnet

  console.log("\n=== FOR THE RECEIVE_ADDRESS ENV VARIABLE ===");
  console.log(testnetInfo.p2wpkhAddress); // Use this for testnet
  // console.log(mainnetInfo.p2wpkhAddress);  // Use this for mainnet
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error("Error:", error.message);
  } else {
    console.error("Unknown error occurred");
  }
}
