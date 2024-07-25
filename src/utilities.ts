import { TransactionVersion } from "@stacks/common";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import {
  generateNewAccount,
  generateWallet,
  getStxAddress,
} from "@stacks/wallet-sdk";
import type {
  AddressNonces,
  Transaction,
} from "@stacks/stacks-blockchain-api-types";
import { StackingClient } from "@stacks/stacking";

// define types of networks we allow
// matches string definitions in Stacks.js
type NetworkType = "mainnet" | "testnet" | "devnet" | "mocknet";

// validate network value
function validateNetwork(network: string | undefined): NetworkType {
  if (
    network &&
    ["mainnet", "testnet", "devnet", "mocknet"].includes(network)
  ) {
    return network as NetworkType;
  }
  return DEFAULT_CONFIG.NETWORK;
}

// define structure of app config
interface AppConfig {
  NETWORK: NetworkType;
  MNEMONIC: string;
  ACCOUNT_INDEX: number;
}

// define default values for app config
const DEFAULT_CONFIG: AppConfig = {
  NETWORK: "testnet",
  MNEMONIC: "",
  ACCOUNT_INDEX: 0,
};

// load configuration from environment variables
function loadConfig(): AppConfig {
  // Bun loads .env automatically
  // so nothing to load here first

  return {
    NETWORK: validateNetwork(process.env.NETWORK),
    MNEMONIC: process.env.MNEMONIC || DEFAULT_CONFIG.MNEMONIC,
    ACCOUNT_INDEX: process.env.ACCOUNT_INDEX
      ? parseInt(process.env.ACCOUNT_INDEX, 10)
      : DEFAULT_CONFIG.ACCOUNT_INDEX,
  };
}

// export the configuration object
export const CONFIG = loadConfig();

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

// gets transaction data from the API
export async function getTransaction(network: string, txId: string) {
  const apiUrl = getApiUrl(network);
  const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
  if (!response.ok) {
    throw new Error(`Failed to get transaction: ${response.statusText}`);
  }
  const data = await response.json();
  return data as Transaction;
}

type NamesResponse = {
  names: string[];
};

// gets names owned by address from the hiro API
export async function getNamesOwnedByAddress(network: string, address: string) {
  const apiUrl = getApiUrl(network);
  const response = await fetch(`${apiUrl}/v1/addresses/stacks/${address}`, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to get names owned by address: ${response.statusText}`
    );
  }
  const data = (await response.json()) as NamesResponse;
  return data.names;
}

type NamesDataResponse = {
  address: string;
  blockchain: string;
  expire_block?: number;
  grace_period?: number;
  last_txid?: string;
  resolver?: string;
  status?: string;
  zonefile?: string;
  zonefile_hash?: string;
};

// gets address by name from the hiro api
export async function getAddressByName(network: string, name: string) {
  const apiUrl = getApiUrl(network);
  const response = await fetch(`${apiUrl}/v1/names/${name}`, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to get address by name: ${response.statusText}`);
  }
  const data = (await response.json()) as NamesDataResponse;
  return data.address;
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

interface ContractSourceResponse {
  source: string;
  publish_height: number;
  proof: string;
}

export async function getContractSource(
  network: string,
  contractAddress: string,
  contractName: string
) {
  const apiUrl = getApiUrl(network);
  const response = await fetch(
    `${apiUrl}/v2/contracts/source/${contractAddress}/${contractName}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to get contract source: ${response.statusText}`);
  }
  const data = (await response.json()) as ContractSourceResponse;
  return data.source;

// Function to get the balance of an address
export async function getAddressBalance(network: string, address: string) {
  const stacksNetwork = getNetwork(network);
  const client = new StackingClient(address, stacksNetwork);

  try {
    const balance = await client.getAccountBalance();
    const lockedBalance = await client.getAccountBalanceLocked();
    const unlocked = balance - lockedBalance;
    return {
      total: balance.toString(),
      locked: lockedBalance.toString(),
      unlocked: unlocked.toString(),
    };
  } catch (error) {
    throw new Error(`Failed to get address balance: ${error.message}`);
  }
}

export async function getAddressBalanceDetailed(
  network: string,
  address: string
) {
  const stacksNetwork = getNetwork(network);
  const client = new StackingClient(address, stacksNetwork);

  try {
    const detailedBalance = await client.getAccountExtendedBalances();
    return detailedBalance;
  } catch (error) {
    throw new Error(`Failed to get address balance: ${error.message}`);
  }

}
