import {
  STACKS_MAINNET,
  StacksNetwork,
  StacksNetworkName,
  STACKS_TESTNET,
  TransactionVersion,
} from "@stacks/network";
import {
  generateNewAccount,
  generateWallet,
  getStxAddress,
} from "@stacks/wallet-sdk";
import type {
  AddressNonces,
  NakamotoBlockListResponse,
} from "@stacks/stacks-blockchain-api-types";
import {
  broadcastTransaction,
  fetchCallReadOnlyFunction,
  Cl,
  cvToValue,
  StacksTransactionWire,
  TxBroadcastResult,
  validateStacksAddress,
} from "@stacks/transactions";
import {
  DeployedContractRegistryEntry,
  getContractName,
  getContractsBySubcategory,
} from "./aibtc-dao/registries/dao-contract-registry";
import { ContractCallsClient } from "./api/contract-calls-client";
import { TokenInfoService } from "./api/token-info-service";
import { ContractResponse } from "@aibtc/types";

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
  const errorMessage =
    error instanceof Error ? JSON.stringify(error.message) : String(error);
  const errorData = error instanceof Error ? error : undefined;
  const response: ToolResponse<Error | undefined> = {
    success: false,
    message: errorMessage,
    data: errorData,
  };
  return response;
}

// Helper function to handle BigInt serialization
export function replaceBigintWithString(key: string, value: any) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

export function sendToLLM(toolResponse: ToolResponse<any>) {
  console.log(JSON.stringify(toolResponse, replaceBigintWithString, 2));
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
export function microStxToStx(amountInMicroStx: number | bigint): number {
  if (typeof amountInMicroStx === "bigint") {
    return Number(amountInMicroStx) / MICROSTX_IN_STX;
  }
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
  AIBTC_DEFAULT_FEE: number;
  AIBTC_CORE_API_KEY: string;
  AIBTC_FAKTORY_API_KEY: string;
}

// define default values for app config
const DEFAULT_CONFIG: AppConfig = {
  NETWORK: "testnet",
  MNEMONIC: "",
  ACCOUNT_INDEX: 0,
  HIRO_API_KEY: "",
  STXCITY_API_HOST: "https://stx.city",
  AIBTC_DEFAULT_FEE: 100_000, // 0.1 STX
  AIBTC_CORE_API_KEY: "",
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
    AIBTC_DEFAULT_FEE:
      Number(process.env.AIBTC_DEFAULT_FEE) || DEFAULT_CONFIG.AIBTC_DEFAULT_FEE,
    AIBTC_CORE_API_KEY:
      process.env.AIBTC_CORE_API_KEY || DEFAULT_CONFIG.AIBTC_CORE_API_KEY,
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
      return STACKS_MAINNET;
    case "testnet":
      return STACKS_TESTNET;
    default:
      return STACKS_TESTNET;
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
    if (broadcastResponse.reason) {
      console.error(
        `Reason Data: ${JSON.stringify(broadcastResponse.reason, null, 2)}`
      );
    }
  } else {
    console.log("Transaction broadcasted successfully!");
    if (from) console.log(`FROM: ${from}`);
    console.log(`TXID: 0x${broadcastResponse.txid}`);
  }
}

export type TxBroadcastResultWithLink = TxBroadcastResult & {
  link?: string;
};

// helper that wraps broadcastTransaction from stacks/transactions
export function broadcastTx(
  transaction: StacksTransactionWire,
  network: StacksNetwork
): Promise<ToolResponse<TxBroadcastResultWithLink>> {
  return new Promise(async (resolve, reject) => {
    try {
      const broadcastResponse = await broadcastTransaction({
        transaction,
        network,
      });
      // check that error property is not present
      // (since we can't instanceof the union type)
      if (!("error" in broadcastResponse)) {
        const explorerUrl = getExplorerUrl(
          CONFIG.NETWORK,
          broadcastResponse.txid
        );
        const response: ToolResponse<TxBroadcastResultWithLink> = {
          success: true,
          message: `Transaction broadcasted successfully: 0x${broadcastResponse.txid}`,
          data: {
            ...broadcastResponse,
            link: explorerUrl,
          },
        };
        resolve(response);
      } else {
        // create error message from broadcast response
        let errorMessage = `Failed to broadcast transaction: ${broadcastResponse.error}`;
        if (broadcastResponse.reason) {
          errorMessage += ` - Reason: ${String(broadcastResponse.reason)}`;
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
// STACKS CONTRACT HELPERS
//////////////////////////////

export function isValidContractPrincipal(principal: string): boolean {
  const [addr, name] = principal.split(".");
  if (!addr || !validateStacksAddress(addr)) {
    // throw new Error(`Invalid contract address: ${addr}`);
    return false;
  }
  if (!name) {
    // throw new Error(`Invalid contract name: ${name}`);
    return false;
  }
  return true;
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
      network: network as StacksNetworkName,
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
    return getStxAddress({
      account: account,
      network: network as StacksNetworkName,
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
// POST CONDITIONS
//////////////////////////////

// helper type for expected post conditions format
type ContractAddress = `${string}.${string}`;

// helper function to ensure contract address has correct type
export function formatContractAddress(address: string): ContractAddress {
  const [addr, name] = address.split(".");
  if (!addr || !name) {
    throw new Error(`Invalid contract address format: ${address}`);
  }
  return `${addr}.${name}` as ContractAddress;
}

//////////////////////////////
// AIBTC DAO HELPERS
//////////////////////////////

type BondInfo = {
  bond: BigInt;
  assetName: string;
};

type ProposalInfo = {
  createdAt: number;
  caller: string;
  creator: string;
  bond: string;
  startBlock: number;
  endBlock: number;
  votesFor: string;
  votesAgainst: string;
  liquidTokens: string;
  concluded: boolean;
  metQuorum: boolean;
  metThreshold: boolean;
  passed: boolean;
  executed: boolean;
};

type ActionProposalInfo = ProposalInfo & {
  action: string;
  parameters: string;
};

type TokenAssetName = {
  assetName: string;
};

export async function getActionProposalInfo(
  proposalsExtensionContract: string,
  daoTokenContract: string,
  sender: string,
  proposalId: number
): Promise<ActionProposalInfo & TokenAssetName> {
  // create a contract calls client to use the cache API
  const client = new ContractCallsClient(CONFIG.NETWORK);
  // get the proposal data from the contract
  const proposalInfo = await client.callContractFunction(
    proposalsExtensionContract,
    "get-proposal",
    // 2025-04-16 workaround for v6 vs v7 stacks.js
    [{ type: "uint", value: proposalId }],
    { senderAddress: sender }
  );
  // create a token info service to get the asset name
  const tokenInfoService = new TokenInfoService(CONFIG.NETWORK);
  const assetName = await tokenInfoService.getAssetNameFromAbi(
    daoTokenContract
  );
  if (!assetName) {
    throw new Error(
      `Could not determine asset name for token contract: ${daoTokenContract}`
    );
  }
  return {
    ...proposalInfo,
    assetName,
  };
}

export async function getCoreProposalInfo(
  proposalsExtensionContract: string,
  daoTokenContract: string,
  sender: string,
  proposalContract: string
): Promise<ProposalInfo & TokenAssetName> {
  // create a contract calls client to use the cache API
  const client = new ContractCallsClient(CONFIG.NETWORK);
  // get the proposal data from the contract
  const proposalInfo = await client.callContractFunction(
    proposalsExtensionContract,
    "get-proposal",
    // [Cl.principal(proposalContract)],
    // 2025-03-31 workaround for v6 vs v7 stacks.js
    [
      {
        type: "principal",
        value: proposalContract,
      },
    ],
    { senderAddress: sender }
  );
  // create a token info service to get the asset name
  const tokenInfoService = new TokenInfoService(CONFIG.NETWORK);
  const assetName = await tokenInfoService.getAssetNameFromAbi(
    daoTokenContract
  );
  if (!assetName) {
    throw new Error(
      `Could not determine asset name for token contract: ${daoTokenContract}`
    );
  }
  return {
    ...proposalInfo,
    assetName,
  };
}

export async function getPmtContractInfo(
  paymentProcessorContract: string,
  sender: string
) {
  // create a contract calls client to use the cache API
  const client = new ContractCallsClient(CONFIG.NETWORK);
  // get the contract info from the contract
  const contractInfo = await client.callContractFunction(
    paymentProcessorContract,
    "get-contract-info",
    [],
    { senderAddress: sender }
  );
  return contractInfo;
}

export async function getPmtResourceByIndex(
  paymentProcessorContract: string,
  sender: string,
  resourceIndex: number
) {
  // create a contract calls client to use the cache API
  const client = new ContractCallsClient(CONFIG.NETWORK);
  // get the resource info from the contract
  const resourceInfo = await client.callContractFunction(
    paymentProcessorContract,
    "get-resource",
    [{ type: "uint", value: resourceIndex }],
    { senderAddress: sender }
  );
  return resourceInfo;
}

export async function getPmtResourceByName(
  paymentProcessorContract: string,
  sender: string,
  resourceName: string
) {
  // create a contract calls client to use the cache API
  const client = new ContractCallsClient(CONFIG.NETWORK);
  // get the resource info from the contract
  const resourceInfo = await client.callContractFunction(
    paymentProcessorContract,
    "get-resource-by-name",
    [{ type: "string", value: resourceName }],
    { senderAddress: sender }
  );
  return resourceInfo;
}

type SupportedPaymentTokens = "STX" | "BTC" | "DAO";

/**
 * Determines token type based on contract name
 * @param contractName The name of the contract
 * @returns The token type (STX, sBTC, or DAO)
 */
export function getTokenTypeFromContractName(
  contractName: string
): SupportedPaymentTokens {
  if (contractName.includes("-stx")) return "STX";
  if (contractName.includes("-sbtc")) return "BTC";
  if (contractName.includes("-dao")) return "DAO";

  throw new Error(`Unable to extract token type for contract: ${contractName}`);
}

// helper function to fetch the proposal bond amount from a core/action proposals voting contract
export async function getCurrentBondProposalAmount(
  proposalsExtensionContract: string,
  daoTokenContract: string,
  sender: string
): Promise<BondInfo> {
  // Get asset name from contract ABI
  const tokenInfoService = new TokenInfoService(CONFIG.NETWORK);
  const assetName = await tokenInfoService.getAssetNameFromAbi(
    daoTokenContract
  );
  if (!assetName) {
    throw new Error(
      `Could not determine asset name for token contract: ${daoTokenContract}`
    );
  }
  // get the proposal bond amount from the contract
  const [extensionAddress, extensionName] =
    proposalsExtensionContract.split(".");
  const proposalBond = await fetchCallReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-proposal-bond",
    functionArgs: [],
    network: getNetwork(CONFIG.NETWORK),
    senderAddress: sender,
  });
  //console.log("proposalBond", proposalBond);
  //console.log("cvToValue(proposalBond)", cvToValue(proposalBond));
  return {
    bond: BigInt(cvToValue(proposalBond)),
    assetName: assetName,
  };
}

//////////////////////////////
// HIRO
//////////////////////////////

export function getExplorerUrl(network: string, txId: string) {
  // check if txid starts with 0x
  if (!txId.startsWith("0x")) {
    txId = `0x${txId}`;
  }
  // return formatted url
  return `https://explorer.hiro.so/txid/${txId}?chain=${network}`;
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

export type BlockHeightResponse = {
  bitcoin: number;
  stacks: number;
};

export async function getCurrentBlockHeights(): Promise<BlockHeightResponse> {
  try {
    const baseUrl = getApiUrl(CONFIG.NETWORK);
    const response = await fetch(`${baseUrl}/extended/v2/blocks?limit=1`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blockList = (await response.json()) as NakamotoBlockListResponse;
    const blockData = blockList.results[0];
    return {
      bitcoin: blockData.burn_block_height,
      stacks: blockData.height,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to get current block heights: ${errorMsg}`);
    throw error;
  }
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

// https://explorer.hiro.so/txid/SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token?chain=mainnet
const mainnetSbtcContract =
  "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token";

// https://explorer.hiro.so/txid/STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token?chain=testnet
const faktorySbtcContract =
  "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token";

export function getSbtcContract(network: string) {
  switch (network) {
    case "mainnet":
      return mainnetSbtcContract;
    case "testnet":
      return faktorySbtcContract;
    default:
      return faktorySbtcContract;
  }
}

export function getFaktorySbtcContract(network: string) {
  if (network !== "testnet") {
    throw new Error("Faktory sBTC contract is only supported on testnet.");
  }
  return faktorySbtcContract.split(".");
}

export type FaktoryGeneratedContracts = {
  prelaunch: FaktoryContractInfo;
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
  description: string;
  tweetOrigin: string;
  uri: string;
  logoUrl?: string;
  mediaUrl?: string;
  twitter?: string;
  website?: string;
  telegram?: string;
  discord?: string;
};

type FaktoryResponse<T> = {
  success: boolean;
  error?: string;
  data: T & {
    dbRecord: FaktoryDbRecord[];
  };
};

type FaktoryPrelaunch = {
  contract: FaktoryContractInfo;
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
  preContract: string;
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
  preVerified: number;
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
  tweetOrigin: string;
  denomination: string;
};

export async function getFaktoryContracts(
  faktoryRequestBody: FaktoryRequestBody
): Promise<FaktoryGeneratedContracts> {
  // setup URLs for Faktory API
  const faktoryPrelaunchUrl = `${getFaktoryApiUrl(CONFIG.NETWORK)}/prelaunch`;
  const faktoryUrl = `${getFaktoryApiUrl(CONFIG.NETWORK)}/generate`;
  const faktoryPoolUrl = `${getFaktoryApiUrl(CONFIG.NETWORK)}/generate-pool`;

  // get prelaunch contract
  const prelaunchResponse = await fetch(faktoryPrelaunchUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CONFIG.AIBTC_FAKTORY_API_KEY,
    },
    body: JSON.stringify(faktoryRequestBody),
  });
  if (!prelaunchResponse.ok) {
    throw new Error(
      `Failed to get prelaunch contract from Faktory, url: ${faktoryPrelaunchUrl}, response: ${prelaunchResponse.status} ${prelaunchResponse.statusText}`
    );
  }
  //console.log(`Faktory prelaunch response status: ${prelaunchResponse.status}`);
  const prelaunchResult =
    (await prelaunchResponse.json()) as FaktoryResponse<FaktoryPrelaunch>;
  //console.log("Faktory prelaunch result:");
  //console.log(JSON.stringify(prelaunchResult, null, 2));
  if (!prelaunchResult.success) {
    throw new Error(
      `Failed to get prelaunch contract from Faktory, url: ${faktoryPrelaunchUrl}, error: ${
        prelaunchResult.error ? prelaunchResult.error : "unknown error"
      }`
    );
  }
  // get token and dex contract
  const tokenDexResponse = await fetch(faktoryUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CONFIG.AIBTC_FAKTORY_API_KEY,
    },
    body: JSON.stringify(faktoryRequestBody),
  });
  //console.log(`Faktory response status: ${faktoryResponse.status}`);
  if (!tokenDexResponse.ok) {
    throw new Error(
      `Failed to get token and dex from Faktory, url: ${faktoryUrl}, response: ${tokenDexResponse.status} ${tokenDexResponse.statusText}`
    );
  }
  const result =
    (await tokenDexResponse.json()) as FaktoryResponse<FaktoryTokenAndDex>;
  //console.log("Faktory result:");
  //console.log(JSON.stringify(result, null, 2));
  if (!result.success) {
    throw new Error(
      `Failed to get token and dex contract from Faktory, error: ${
        result.error ? result.error : "unknown error"
      }`
    );
  }
  const tokenContract = result.data.contracts.token.contract;
  const dexContract = result.data.contracts.dex.contract;
  // build info for pool request
  const symbol = faktoryRequestBody.symbol;
  const creatorAddress = faktoryRequestBody.creatorAddress;
  // get pool contract
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
    prelaunch: prelaunchResult.data.contract,
    token: result.data.contracts.token,
    dex: result.data.contracts.dex,
    pool: poolResult.data.pool,
  };

  verifyFaktoryContracts(faktoryContracts, faktoryRequestBody);

  return faktoryContracts;
}

function verifyFaktoryContracts(
  contracts: FaktoryGeneratedContracts,
  requestBody: FaktoryRequestBody
) {
  function throwVerifyError(message: string) {
    throw new Error(`Faktory contract verification failed: ${message}`);
  }
  if (
    !contracts.prelaunch ||
    !contracts.token ||
    !contracts.dex ||
    !contracts.pool
  ) {
    throwVerifyError("Missing contracts to verify");
  }
  if (!requestBody) {
    throwVerifyError("Missing request body to verify");
  }
  // get contract info from registry for each
  const prelaunchContract = getContractsBySubcategory("TOKEN", "PRELAUNCH")[0];
  const tokenContract = getContractsBySubcategory("TOKEN", "DAO")[0];
  const dexContract = getContractsBySubcategory("TOKEN", "DEX")[0];
  const poolContract = getContractsBySubcategory("TOKEN", "POOL")[0];
  const tokenOwnerContract = getContractsBySubcategory(
    "EXTENSIONS",
    "TOKEN_OWNER"
  )[0];

  // get contract names using token symbol
  const prelaunchContractName = getContractName(
    prelaunchContract.name,
    requestBody.symbol
  );
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
    contracts.prelaunch.name !== prelaunchContractName ||
    contracts.token.name !== tokenContractName ||
    contracts.dex.name !== dexContractName ||
    contracts.pool.name !== poolContractName
  ) {
    let errorMsg = "Contract names do not match";
    errorMsg += `\nprelaunch: ${contracts.prelaunch.name} !== ${prelaunchContractName}`;
    errorMsg += `\ntoken: ${contracts.token.name} !== ${tokenContractName}`;
    errorMsg += `\ndex: ${contracts.dex.name} !== ${dexContractName}`;
    errorMsg += `\npool: ${contracts.pool.name} !== ${poolContractName}`;
    throwVerifyError(errorMsg);
  }
  // check that token symbol is used in token contract
  if (!contracts.token.code.includes(requestBody.symbol)) {
    throwVerifyError("Token symbol not found in token contract code");
  }
  // check that token owner is used in the token contract
  if (!contracts.token.code.includes(tokenOwnerContractName)) {
    throwVerifyError(
      "Token owner contract name not found in token contract code"
    );
  }
  // check that token contract name is used in the dex
  if (!contracts.dex.code.includes(tokenContractName)) {
    throwVerifyError("Token contract name not found in dex contract code");
  }
  // check that dex contract name is used in the pool
  if (!contracts.pool.code.includes(dexContractName)) {
    throwVerifyError("Dex contract name not found in pool contract code");
  }
  // check creator address is used in each of the contracts
  if (
    // !contracts.prelaunch.code.includes(requestBody.creatorAddress) ||
    !contracts.token.code.includes(requestBody.creatorAddress) ||
    !contracts.dex.code.includes(requestBody.creatorAddress) ||
    !contracts.pool.code.includes(requestBody.creatorAddress)
  ) {
    throwVerifyError("Creator address not found in contract code");
  }
  // passes all verification checks
}

//////////////////////////////
// AIBTC CORE
//////////////////////////////

// loosely based on SIP-010
// only has fields we use rn
type SIP010UriJson = {
  sip: number;
  name: string;
  description: string;
  image: string;
  properties: {
    decimals: number;
    external_url: string;
  };
};

// fetch (and eventually cache) token URI JSON / IMAGE
export async function getImageUrlFromTokenUri(
  tokenUri: string
): Promise<string> {
  // check if tokenUri is a valid URL
  const tokenUriUrl = new URL(tokenUri);
  if (!tokenUriUrl) {
    throw new Error(`Token URI is invalid: ${tokenUri}`);
  }
  // attempt to fetch the token URI JSON
  const tokenUriResponse = await fetch(tokenUriUrl);
  if (!tokenUriResponse.ok) {
    throw new Error(
      `Failed to fetch token URI JSON: ${tokenUriResponse.statusText}`
    );
  }
  // parse the token URI JSON
  const tokenUriJson = (await tokenUriResponse.json()) as SIP010UriJson;
  if (!tokenUriJson) {
    throw new Error(`Token URI JSON is empty`);
  }
  // validate if it matches our expected type
  const sip010UriJson: SIP010UriJson = {
    sip: tokenUriJson.sip!,
    name: tokenUriJson.name!,
    description: tokenUriJson.description!,
    image: tokenUriJson.image!,
    properties: {
      decimals: tokenUriJson.properties.decimals!,
      external_url: tokenUriJson.properties.external_url!,
    },
  };
  // check if image is a valid URL
  const imageUrl = new URL(sip010UriJson.image);
  if (!imageUrl) {
    throw new Error(`Image URL is invalid: ${sip010UriJson.image}`);
  }
  return imageUrl.toString();
}

export function getAibtcCoreApiUrl(network: string) {
  switch (network) {
    case "mainnet":
      return "https://core.aibtc.dev/webhooks/dao";
    case "testnet":
      return "https://core-staging.aibtc.dev/webhooks/dao";
    default:
      return "https://core-staging.aibtc.dev/webhooks/dao";
  }
}

export type aibtcCoreRequestBody = {
  name: string;
  mission: string;
  description: string;
  extensions: DeployedContractRegistryEntry[] | ContractResponse[];
  token: {
    name: string;
    symbol: string;
    decimals: number;
    description: string;
    max_supply: string;
    uri: string;
    tx_id: string;
    contract_principal: string;
    image_url: string;
    x_url?: string;
    telegram_url?: string;
    website_url?: string;
  };
};

export async function postToAibtcCore(
  network: StacksNetworkName,
  infoToPost: aibtcCoreRequestBody
) {
  const url = getAibtcCoreApiUrl(network);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.AIBTC_CORE_API_KEY}`,
    },
    body: JSON.stringify(infoToPost),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to post to AIBTC Core: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  return data;
}
