import { TransactionVersion } from "@stacks/common";
import {
  StacksMainnet,
  StacksNetwork,
  StacksNetworkName,
  StacksTestnet,
} from "@stacks/network";
import {
  generateNewAccount,
  generateWallet,
  getStxAddress,
} from "@stacks/wallet-sdk";
import type { AddressNonces } from "@stacks/stacks-blockchain-api-types";
import {
  broadcastTransaction,
  StacksTransaction,
  TxBroadcastResult,
  validateStacksAddress,
} from "@stacks/transactions";
import {
  getContractName,
  getContractsBySubcategory,
} from "./stacks-contracts/services/dao-contract-registry";

//////////////////////////////
// GENERAL HELPERS
//////////////////////////////

export type ToolResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export function createErrorResponse(
  error: any
): ToolResponse<Error | undefined> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorData = error instanceof Error ? error : undefined;
  const response: ToolResponse<Error | undefined> = {
    success: false,
    message: errorMessage,
    data: errorData,
  };
  return response;
}

export function sendToLLM(toolResponse: ToolResponse<any>) {
  console.log(JSON.stringify(toolResponse, null, 2));
}

export function convertStringToBoolean(value = "false"): boolean {
  // Convert to lowercase and trim whitespace
  const normalized = value.toLowerCase().trim();
  // Check for true values
  if (normalized === "true" || normalized === "1") {
    return true;
  }
  // Check for false values
  if (normalized === "false" || normalized === "0") {
    return false;
  }
  // Return null or throw error for invalid inputs
  throw new Error(`Invalid boolean value: ${value}`);
}

export const MICROSTX_IN_STX = 1_000_000;

/**
 * Convert μSTX (micro-STX) to STX denomination.
 * `1 STX = 1,000,000 μSTX`
 */
export function microStxToStx(amountInMicroStx: number): number {
  return amountInMicroStx / MICROSTX_IN_STX;
}

/**
 * Convert STX to μSTX (micro-STX) denomination.
 * `1 STX = 1,000,000 μSTX`
 */
export function stxToMicroStx(amountInStx: number): number {
  return amountInStx * MICROSTX_IN_STX;
}

//////////////////////////////
// APPLICATION CONFIG
//////////////////////////////

// define structure of app config
export interface AppConfig {
  NETWORK: StacksNetworkName;
  MNEMONIC: string;
  ACCOUNT_INDEX: number;
  HIRO_API_KEY: string;
  STXCITY_API_HOST: string;
  AIBTC_FAKTORY_API_KEY: string;
}

// define default values for app config
const DEFAULT_CONFIG: AppConfig = {
  NETWORK: "testnet",
  MNEMONIC: "",
  ACCOUNT_INDEX: 0,
  HIRO_API_KEY: "",
  STXCITY_API_HOST: "https://stx.city",
  AIBTC_FAKTORY_API_KEY: "",
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
    AIBTC_FAKTORY_API_KEY:
      process.env.AIBTC_FAKTORY_API_KEY || DEFAULT_CONFIG.AIBTC_FAKTORY_API_KEY,
  };
}

// export the configuration object to load for env vars
export const CONFIG = loadConfig();

//////////////////////////////
// NETWORK HELPERS
//////////////////////////////

// get network from principal
// limited to just testnet/mainnet for now
export function getNetworkByPrincipal(principal: string): StacksNetworkName {
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

export function getValidNetworks(): StacksNetworkName[] {
  return ["mainnet", "testnet", "devnet", "mocknet"] as const;
}

export function validateNetwork(
  network: string | undefined
): StacksNetworkName {
  if (network && getValidNetworks().includes(network as StacksNetworkName)) {
    return network as StacksNetworkName;
  }
  return DEFAULT_CONFIG.NETWORK;
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

export function getFaktoryApiUrl(network: string) {
  switch (network) {
    case "mainnet":
      return "https://faktory-be.vercel.app/api/aibtcdev";
    case "testnet":
      return "https://faktory-testnet-be.vercel.app/api/aibtcdev";
    default:
      return "https://faktory-testnet-be.vercel.app/api/aibtcdev";
  }
}

//////////////////////////////
// BROADCAST HELPERS
//////////////////////////////

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

// helper that wraps broadcastTransaction from stacks/transactions
export function broadcastTx(
  transaction: StacksTransaction,
  network: StacksNetwork
): Promise<ToolResponse<TxBroadcastResult>> {
  return new Promise(async (resolve, reject) => {
    try {
      const broadcastResponse = await broadcastTransaction(
        transaction,
        network
      );
      // check that error property is not present
      // (since we can't instanceof the union type)
      if (!("error" in broadcastResponse)) {
        const response: ToolResponse<TxBroadcastResult> = {
          success: true,
          message: `Transaction broadcasted successfully: 0x${broadcastResponse.txid}`,
          data: broadcastResponse,
        };
        resolve(response);
      } else {
        // create error message from broadcast response
        let errorMessage = `Failed to broadcast transaction: ${broadcastResponse.error}`;
        if (broadcastResponse.reason_data) {
          if ("message" in broadcastResponse.reason_data) {
            errorMessage += ` - Reason: ${broadcastResponse.reason_data.message}`;
          }
          if ("expected" in broadcastResponse.reason_data) {
            errorMessage += ` - Expected: ${broadcastResponse.reason_data.expected}, Actual: ${broadcastResponse.reason_data.actual}`;
          }
        }
        // create response object
        const response: ToolResponse<TxBroadcastResult> = {
          success: false,
          message: errorMessage,
          data: broadcastResponse,
        };
        resolve(response);
      }
    } catch (error) {
      reject(createErrorResponse(error));
    }
  });
}

//////////////////////////////
// STACKS WALLET / ACCOUNTS
//////////////////////////////

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

export async function getNextNonce(network: string, address: string) {
  const nonces = await getNonces(network, address);
  const nextNonce = nonces.possible_next_nonce;
  return nextNonce;
}

//////////////////////////////
// HIRO
//////////////////////////////

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

//////////////////////////////
// STXCITY
//////////////////////////////

type StxCityMetrics = {
  price_usd: number;
  holder_count: number;
  swap_count: number;
  transfer_count: number;
  liquidity_usd: number;
};

type StxCityTokenDetails = {
  contract_id: string;
  symbol: string;
  name: string;
  decimals: number;
  total_supply: number | string;
  circulating_supply: number | string;
  image_url: string;
  header_image_url?: string | null;
  metrics: StxCityMetrics;
  amms: string[];
  description: string;
  homepage?: string;
  telegram?: string;
  xlink?: string;
  discord?: string;
  verified?: boolean;
  socials?: any[];
};

export async function getTradableDetails() {
  const response = await fetch(
    `${CONFIG.STXCITY_API_HOST}/api/tokens/tradable-full-details-tokens`
  );
  if (!response.ok) {
    throw new Error(`Failed to get nonce: ${response.statusText}`);
  }
  const data = await response.json();
  return data as StxCityTokenDetails[];
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

//////////////////////////////
// FAKTORY
//////////////////////////////

export type FaktoryGeneratedContracts = {
  token: FaktoryContractInfo;
  dex: FaktoryContractInfo;
  pool: FaktoryContractInfo;
};

export type FaktoryRequestBody = {
  symbol: string;
  name: string;
  supply: number;
  creatorAddress: string;
  originAddress: string;
  uri: string;
  logoUrl?: string;
  mediaUrl?: string;
  twitter?: string;
  website?: string;
  telegram?: string;
  discord?: string;
  description?: string;
  tweetOrigin?: string;
};

type FaktoryResponse<T> = {
  success: boolean;
  error?: string;
  data: T & {
    dbRecord: FaktoryDbRecord[];
  };
};

type FaktoryTokenAndDex = {
  contracts: {
    token: FaktoryContractInfo;
    dex: FaktoryContractInfo;
  };
};

type FaktoryPool = {
  pool: FaktoryContractInfo;
};

export type FaktoryContractInfo = {
  name: string;
  code: string;
  hash?: string;
  contract: string;
};

type FaktoryDbRecord = {
  id: string;
  name: string;
  symbol: string;
  description: string;
  tokenContract: string;
  dexContract: string;
  txId: string | null;
  targetAmm: string;
  supply: number;
  decimals: number;
  targetStx: number;
  progress: number;
  price: number;
  price24hChanges: number | null;
  tradingVolume: number;
  holders: number;
  tokenToDex: string;
  tokenToDeployer: string;
  stxToDex: number;
  stxBuyFirstFee: number;
  logoUrl: string;
  mediaUrl: string;
  uri: string;
  twitter: string;
  website: string;
  telegram: string;
  discord: string;
  chatCount: number;
  txsCount: number;
  creatorAddress: string;
  deployedAt: string;
  tokenHash: string;
  tokenVerified: number;
  dexHash: string;
  dexVerified: number;
  tokenVerifiedAt: string | null;
  dexVerifiedAt: string | null;
  status: string;
  tokenChainhookUuid: string | null;
  tradingHookUuid: string | null;
  lastBuyHash: string | null;
  daoToken: boolean;
};

export async function getFaktoryContracts(
  faktoryRequestBody: FaktoryRequestBody
): Promise<FaktoryGeneratedContracts> {
  const faktoryUrl = `${getFaktoryApiUrl(CONFIG.NETWORK)}/generate`;
  const faktoryPoolUrl = `${getFaktoryApiUrl(CONFIG.NETWORK)}/generate-pool`;
  //console.log(`Faktory URL: ${faktoryUrl.toString()}`);
  //console.log(`Faktory Pool URL: ${faktoryPoolUrl.toString()}`);
  //console.log(`Faktory request body:`);
  //console.log(JSON.stringify(faktoryRequestBody, null, 2));

  const symbol = faktoryRequestBody.symbol;
  const creatorAddress = faktoryRequestBody.creatorAddress;

  const faktoryResponse = await fetch(faktoryUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CONFIG.AIBTC_FAKTORY_API_KEY,
    },
    body: JSON.stringify(faktoryRequestBody),
  });
  //console.log(`Faktory response status: ${faktoryResponse.status}`);
  if (!faktoryResponse.ok) {
    throw new Error(`Failed to get token and dex from Faktory`);
  }
  const result =
    (await faktoryResponse.json()) as FaktoryResponse<FaktoryTokenAndDex>;
  //console.log("Faktory result:");
  //console.log(JSON.stringify(result, null, 2));
  if (!result.success) {
    throw new Error(`Failed to get token and dex contract from Faktory`);
  }

  const tokenContract = result.data.contracts.token.contract;
  const dexContract = result.data.contracts.dex.contract;

  const poolResponse = await fetch(faktoryPoolUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CONFIG.AIBTC_FAKTORY_API_KEY,
    },
    body: JSON.stringify({
      tokenContract,
      dexContract,
      senderAddress: creatorAddress,
      symbol,
    }),
  });
  //console.log(`Faktory pool response status: ${poolResponse.status}`);
  if (!poolResponse.ok) {
    throw new Error(`Failed to get pool contract from Faktory`);
  }
  const poolResult =
    (await poolResponse.json()) as FaktoryResponse<FaktoryPool>;

  //console.log("Faktory pool result:");
  //console.log(JSON.stringify(poolResult, null, 2));

  const faktoryContracts: FaktoryGeneratedContracts = {
    token: result.data.contracts.token,
    dex: result.data.contracts.dex,
    pool: poolResult.data.pool,
  };

  const verified = verifyFaktoryContracts(faktoryContracts, faktoryRequestBody);
  if (!verified) {
    throw new Error(`Failed to verify Faktory contracts`);
  }

  return faktoryContracts;
}

function verifyFaktoryContracts(
  contracts: FaktoryGeneratedContracts,
  requestBody: FaktoryRequestBody
) {
  if (!contracts.token || !contracts.dex || !contracts.pool) {
    console.log("Missing contracts to verify");
    return false;
  }
  if (!requestBody) {
    console.log("Missing request body to verify");
    return false;
  }
  // get contract info from registry for each
  const tokenContract = getContractsBySubcategory("TOKEN", "DAO")[0];
  const dexContract = getContractsBySubcategory("TOKEN", "DEX")[0];
  const poolContract = getContractsBySubcategory("TOKEN", "POOL")[0];
  const tokenOwnerContract = getContractsBySubcategory(
    "EXTENSIONS",
    "TOKEN_OWNER"
  )[0];

  // get contract names using token symbol
  const tokenContractName = getContractName(
    tokenContract.name,
    requestBody.symbol
  );
  const dexContractName = getContractName(dexContract.name, requestBody.symbol);
  const poolContractName = getContractName(
    poolContract.name,
    requestBody.symbol
  );
  const tokenOwnerContractName = getContractName(
    tokenOwnerContract.name,
    requestBody.symbol
  );

  // get contract names from generator

  if (
    contracts.token.name !== tokenContractName ||
    contracts.dex.name !== dexContractName ||
    contracts.pool.name !== poolContractName
  ) {
    console.log("Contract names do not match");
    return false;
  }
  // check that token symbol is used in token contract
  if (!contracts.token.code.includes(requestBody.symbol)) {
    console.log("Token symbol not found in token contract code");
    return false;
  }
  // check that token owner is used in the token contract
  if (!contracts.token.code.includes(tokenOwnerContractName)) {
    console.log("Token owner contract name not found in token contract code");
    return false;
  }
  // check that token contract name is used in the dex
  if (!contracts.dex.code.includes(tokenContractName)) {
    console.log("Token contract name not found in dex contract code");
    return false;
  }
  // check that dex contract name is used in the pool
  if (!contracts.pool.code.includes(dexContractName)) {
    console.log("Dex contract name not found in pool contract code");
    return false;
  }
  // check creator address is used in each of the contracts
  if (
    !contracts.token.code.includes(requestBody.creatorAddress) ||
    !contracts.dex.code.includes(requestBody.creatorAddress) ||
    !contracts.pool.code.includes(requestBody.creatorAddress)
  ) {
    console.log("Creator address not found in contract code");
    return false;
  }
  // passes all verification checks
  return true;
}
