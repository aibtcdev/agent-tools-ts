import { TransactionVersion } from "@stacks/common";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import {
  generateNewAccount,
  generateWallet,
  getStxAddress,
} from "@stacks/wallet-sdk";
import type { AddressNonces } from "@stacks/stacks-blockchain-api-types";
import { TxBroadcastResult, validateStacksAddress } from "@stacks/transactions";
import { NetworkType, TraitType, NetworkAddressMap, NetworkAddresses, AddressType } from "./types";
import { ADDRESSES, TRAITS } from "./constants";

type Metrics = {
  price_usd: number;
  holder_count: number;
  swap_count: number;
  transfer_count: number;
  liquidity_usd: number;
};

type TokenDetails = {
  contract_id: string;
  symbol: string;
  name: string;
  decimals: number;
  total_supply: number | string;
  circulating_supply: number | string;
  image_url: string;
  header_image_url?: string | null;
  metrics: Metrics;
  amms: string[];
  description: string;
  homepage?: string;
  telegram?: string;
  xlink?: string;
  discord?: string;
  verified?: boolean;
  socials?: any[];
};

type TokenDetailsArray = TokenDetails[];

// get network from principal
// limited to just testnet/mainnet for now
export function getNetworkByPrincipal(principal: string): NetworkType {
  // test if principal is valid
  if (validateStacksAddress(principal)) {
    // detect network from address
    const prefix = principal.substring(0, 2);
    if (prefix === "SP" || prefix === "SM") {
      return "mainnet";
    } else if (prefix === "ST" || prefix === "SN") {
      return "testnet";
    }
  }
  console.log("Invalid principal, using testnet");
  return "testnet";
}

// validate network value
export function validateNetwork(network: string | undefined): NetworkType {
  if (
    network &&
    ["mainnet", "testnet", "devnet", "mocknet"].includes(network)
  ) {
    return network as NetworkType;
  }
  return DEFAULT_CONFIG.NETWORK;
}

export async function logBroadCastResult(
  broadcastResponse: TxBroadcastResult,
  from?: string
) {
  if ("error" in broadcastResponse) {
    console.error("Transaction failed to broadcast");
    console.error(`Error: ${broadcastResponse.error}`);
    if (broadcastResponse.reason) {
      console.error(`Reason: ${broadcastResponse.reason}`);
    }
    if (broadcastResponse.reason_data) {
      console.error(
        `Reason Data: ${JSON.stringify(broadcastResponse.reason_data, null, 2)}`
      );
    }
  } else {
    console.log("Transaction broadcasted successfully!");
    if (from) console.log(`FROM: ${from}`);
    console.log(`TXID: 0x${broadcastResponse.txid}`);
  }
}

export const stakingDaoContractAddress =
  "SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG";
export const stakingDaoContractNames = {
  baseContract: `stacking-dao-core-v2`,
  reserveContract: `reserve-v1`,
  commissionContract: `commission-v1`,
  stakingContract: `staking-v0`,
  directHelpers: `direct-helpers-v1`,
};
/**
 * returns joining address and name
 */
export function getStakingDaoContractID(name: string) {
  return `${stakingDaoContractAddress}.${name}`;
}

// define structure of app config
export interface AppConfig {
  NETWORK: NetworkType;
  MNEMONIC: string;
  ACCOUNT_INDEX: number;
  HIRO_API_KEY: string;
  STXCITY_API_HOST: string;
}

// define default values for app config
const DEFAULT_CONFIG: AppConfig = {
  NETWORK: "testnet",
  MNEMONIC: "",
  ACCOUNT_INDEX: 0,
  HIRO_API_KEY: "",
  STXCITY_API_HOST: "https://stx.city",
};

// load configuration from environment variables
function loadConfig(): AppConfig {
  return {
    NETWORK: validateNetwork(process.env.NETWORK),
    MNEMONIC: process.env.MNEMONIC || DEFAULT_CONFIG.MNEMONIC,
    ACCOUNT_INDEX:
      Number(process.env.ACCOUNT_INDEX) || DEFAULT_CONFIG.ACCOUNT_INDEX,
    HIRO_API_KEY: process.env.HIRO_API_KEY || DEFAULT_CONFIG.HIRO_API_KEY,
    STXCITY_API_HOST:
      process.env.STXCITY_API_HOST || DEFAULT_CONFIG.STXCITY_API_HOST,
  };
}

// export the configuration object
export const CONFIG = loadConfig();

// getNetworkByPrincipal() ?
// roll into getConfig() for each below ?

export function getNetwork(network: string) {
  switch (network) {
    case "mainnet":
      return new StacksMainnet();
    case "testnet":
      return new StacksTestnet();
    default:
      return new StacksTestnet();
  }
}

export function getTxVersion(network: string) {
  switch (network) {
    case "mainnet":
      return TransactionVersion.Mainnet;
    case "testnet":
      return TransactionVersion.Testnet;
    default:
      return TransactionVersion.Testnet;
  }
}

export function getApiUrl(network: string) {
  switch (network) {
    case "mainnet":
      return "https://api.hiro.so";
    case "testnet":
      return "https://api.testnet.hiro.so";
    default:
      return "https://api.testnet.hiro.so";
  }
}

export const MICROSTX_IN_STX = 1_000_000;

/**
 * Convert μSTX (micro-STX) to STX denomination.
 * `1 STX = 1,000,000 μSTX`
 *
 * @example
 * ```ts
 * microStxToStx(1000000n); // 1n
 * ```
 */
export function microStxToStx(amountInMicroStx: number): number {
  return amountInMicroStx / MICROSTX_IN_STX;
}

/**
 * Convert STX to μSTX (micro-STX) denomination.
 * `1 STX = 1,000,000 μSTX`
 *
 * @example
 * ```ts
 * stxToMicroStx(1); // 1000000
 * ```
 */
export function stxToMicroStx(amountInStx: number): number {
  return amountInStx * MICROSTX_IN_STX;
}

export async function deriveChildAccount(
  network: string,
  mnemonic: string,
  index: number
) {
  // using a blank password since wallet isn't persisted
  const password = "";
  // create a Stacks wallet with the mnemonic
  let wallet = await generateWallet({
    secretKey: mnemonic,
    password: password,
  });
  // add a new account to reach the selected index
  for (let i = 0; i <= index; i++) {
    wallet = generateNewAccount(wallet);
  }
  // return address and key for selected index
  return {
    address: getStxAddress({
      account: wallet.accounts[index],
      transactionVersion: getTxVersion(network),
    }),
    key: wallet.accounts[index].stxPrivateKey,
  };
}

export async function deriveChildAccounts(
  network: string,
  mnemonic: string,
  index: number
) {
  // using a blank password since wallet isn't persisted
  const password = "";
  // create a Stacks wallet with the mnemonic
  let wallet = await generateWallet({
    secretKey: mnemonic,
    password: password,
  });
  // loop to add new accounts to reach the selected index
  for (let i = 0; i <= index; i++) {
    wallet = generateNewAccount(wallet);
  }

  // use Promise.all to handle the asynchronous operation inside map
  const addresses = wallet.accounts.map((account) => {
    const transactionVersion = getTxVersion(network);
    return getStxAddress({
      account: account,
      transactionVersion: transactionVersion,
    });
  });

  return addresses;
}

// gets the current nonce for the account from the API
// more reliable than @stacks/transactions getNonce()
export async function getNonces(network: string, address: string) {
  const apiUrl = getApiUrl(network);
  const response = await fetch(
    `${apiUrl}/extended/v1/address/${address}/nonces`
  );
  if (!response.ok) {
    throw new Error(`Failed to get nonce: ${response.statusText}`);
  }
  const data = await response.json();
  return data as AddressNonces;
}

export async function getTradableDetails() {
  const response = await fetch(
    `${CONFIG.STXCITY_API_HOST}/api/tokens/tradable-full-details-tokens`
  );
  if (!response.ok) {
    throw new Error(`Failed to get nonce: ${response.statusText}`);
  }
  const data = await response.json();
  return data as TokenDetailsArray;
}

export async function getNextNonce(network: string, address: string) {
  const nonces = await getNonces(network, address);
  const nextNonce = nonces.possible_next_nonce;
  return nextNonce;
}

// Type definition for Hiro token metadata response
export type HiroTokenMetadata = {
  tx_id: string;
  sender_address: string;
  asset_identifier: string;
  name: string;
  symbol: string;
  decimals: number;
  total_supply: string;
  token_uri: string;
  description: string;
  image_uri: string;
  image_thumbnail_uri: string;
  image_canonical_uri: string;
  metadata: {
    sip: number;
    name: string;
    description: string;
    image: string;
    cached_image: string;
    cached_thumbnail_image: string;
  };
};

export async function getHiroTokenMetadata(
  contractId: string
): Promise<HiroTokenMetadata> {
  try {
    const baseUrl = getApiUrl(CONFIG.NETWORK);
    const response = await fetch(`${baseUrl}/metadata/v1/ft/${contractId}`, {
      headers: {
        Authorization: `Bearer ${CONFIG.HIRO_API_KEY}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as HiroTokenMetadata;
    return data;
  } catch (error: any) {
    console.error("Error fetching token metadata:", error.message);
    throw error;
  }
}

export function getAssetNameFromIdentifier(assetIdentifier: string): string {
  const parts = assetIdentifier.split("::");
  return parts.length === 2 ? parts[1] : "";
}

/**
 * Get hash from STX City API for the given data
 * @param data - The data to be hashed
 * @returns Promise<string> - The hashed data with quotes removed
 */
export async function getStxCityHash(data: string): Promise<string> {
  const { STXCITY_API_HOST } = CONFIG;
  const response = await fetch(`${STXCITY_API_HOST}/api/hashing?data=${data}`);
  const hashText = await response.text();
  // Remove quotes from the response
  return hashText.replace(/^"|"$/g, "");
}

export function getTraitDefinition(
  network: NetworkType,
  traitType: TraitType
): string {
  const networkTraits = TRAITS[network];
  if (!networkTraits) {
    throw new Error(`No traits defined for network: ${network}`);
  }

  // Map TraitType to NetworkTraits keys
  let traitKey: keyof NetworkTraits;
  switch (traitType) {
    case TraitType.DAO_TRAITS:
      traitKey = "DAO_PROPOSAL"; // Using DAO_PROPOSAL as it's the closest match
      break;
    case TraitType.DAO_BASE:
      traitKey = "DAO_BASE";
      break;
    case TraitType.POOL:
      traitKey = "BITFLOW_POOL";
      break;
    default:
      throw new Error(`Unsupported trait type: ${traitType}`);
  }

  const trait = networkTraits[traitKey];
  if (!trait) {
    throw new Error(`Trait type ${traitKey} not found for network ${network}`);
  }

  return trait;
}

export function getTraitReference(
  network: NetworkType,
  traitType: TraitType
): string {
  const trait = getTraitDefinition(network, traitType);
  return trait;
}

export function getAddressDefinition(
  network: NetworkType,
  addressType: AddressType
): string {
  const networkAddresses = ADDRESSES[network];
  if (!networkAddresses) {
    throw new Error(`No addresses defined for network: ${network}`);
  }

  const address = networkAddresses[addressType];
  if (!address) {
    throw new Error(`Address type ${addressType} not found for network ${network}`);
  }

  return address;
}

export function getAddressReference(
  network: NetworkType,
  addressType: AddressType
): string {
  return getAddressDefinition(network, addressType);
}
