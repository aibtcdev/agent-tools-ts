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
import { TxBroadcastResult } from "@stacks/transactions";

// define types of networks we allow
// matches string definitions in Stacks.js
export type NetworkType = "mainnet" | "testnet" | "devnet" | "mocknet";

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

type Epoch = {
  epoch_id: string;
  start_height: number;
  end_height: number;
  block_limit: {
    write_length: number;
    write_count: number;
    read_length: number;
    read_count: number;
    runtime: number;
  };
  network_epoch: number;
};

type RewardCycle = {
  id: number;
  min_threshold_ustx: number;
  stacked_ustx: number;
  is_pox_active: boolean;
};

type NextCycle = {
  id: number;
  min_threshold_ustx: number;
  min_increment_ustx: number;
  stacked_ustx: number;
  prepare_phase_start_block_height: number;
  blocks_until_prepare_phase: number;
  reward_phase_start_block_height: number;
  blocks_until_reward_phase: number;
  ustx_until_pox_rejection: number | null;
};

type ContractVersion = {
  contract_id: string;
  activation_burnchain_block_height: number;
  first_reward_cycle_id: number;
};

type POXResponse = {
  contract_id: string;
  pox_activation_threshold_ustx: number;
  first_burnchain_block_height: number;
  current_burnchain_block_height: number;
  prepare_phase_block_length: number;
  reward_phase_block_length: number;
  reward_slots: number;
  rejection_fraction: number | null;
  total_liquid_supply_ustx: number;
  current_cycle: RewardCycle;
  next_cycle: NextCycle;
  epochs: Epoch[];
  min_amount_ustx: number;
  prepare_cycle_length: number;
  reward_cycle_id: number;
  reward_cycle_length: number;
  rejection_votes_left_required: number | null;
  next_reward_cycle_in: number;
  contract_versions: ContractVersion[];
};

export async function getPOXDetails(network: NetworkType) {
  const apiUrl = getApiUrl(network);
  const response = await fetch(`${apiUrl}/v2/pox`, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to get contract source: ${response.statusText}`);
  }
  const data = (await response.json()) as POXResponse;
  return data;
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
}

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
  } catch (error: any) {
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
  } catch (error: any) {
    throw new Error(`Failed to get address balance: ${error.message}`);
  }
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

export async function getFaucetDrop(
  network: string,
  address: string,
  unanchored: boolean = true
) {
  if (network !== "testnet") {
    throw new Error("Faucet drops are only available on the testnet.");
  }

  const apiUrl = getApiUrl(network);
  const response = await fetch(
    `${apiUrl}/extended/v1/faucets/stx?address=${address}&unanchored=${unanchored}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get faucet drop: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

interface TransactionResponse {
  limit: number;
  offset: number;
  total: number;
  results: Array<{
    tx: {
      tx_id: string;
      nonce: number;
      fee_rate: string;
      sender_address: string;
      sponsor_nonce: number;
      sponsored: boolean;
      sponsor_address: string;
      post_condition_mode: string;
      post_conditions: Array<{
        principal: {
          type_id: string;
        };
        condition_code: string;
        amount: string;
        type: string;
      }>;
      anchor_mode: string;
      block_hash: string;
      block_height: number;
      block_time: number;
      block_time_iso: string;
      burn_block_height: number;
      burn_block_time: number;
      burn_block_time_iso: string;
      parent_burn_block_time: number;
      parent_burn_block_time_iso: string;
      canonical: boolean;
      tx_index: number;
      tx_status: string;
      tx_result: {
        hex: string;
        repr: string;
      };
      event_count: number;
      parent_block_hash: string;
      is_unanchored: boolean;
      microblock_hash: string;
      microblock_sequence: number;
      microblock_canonical: boolean;
      execution_cost_read_count: number;
      execution_cost_read_length: number;
      execution_cost_runtime: number;
      execution_cost_write_count: number;
      execution_cost_write_length: number;
      events: Array<{
        event_index: number;
        event_type: string;
        tx_id: string;
        contract_log: {
          contract_id: string;
          topic: string;
          value: {
            hex: string;
            repr: string;
          };
        };
      }>;
      tx_type: string;
      contract_call: {
        contract_id: string;
        function_name: string;
      };
      smart_contract: {
        contract_id: string;
      };
      token_transfer: {
        recipient_address: string;
        amount: string;
        memo: string;
      };
    };
    stx_sent: string;
    stx_received: string;
    events: {
      stx: {
        transfer: number;
        mint: number;
        burn: number;
      };
      ft: {
        transfer: number;
        mint: number;
        burn: number;
      };
      nft: {
        transfer: number;
        mint: number;
        burn: number;
      };
    };
  }>;
}

export async function getTransactionsByAddress(
  network: string,
  address: string,
  limit: number = 20,
  offset: number = 0
): Promise<TransactionResponse> {
  const apiUrl = getApiUrl(network);
  const response = await fetch(
    `${apiUrl}/extended/v2/addresses/${address}/transactions?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to get transactions: ${response.statusText}`);
  }
  const data = (await response.json()) as any;
  return data;
}
type FungibleTokenHoldersResponse = {
  limit: number;
  offset: number;
  total: number;
  total_supply: string;
  results: {
    address: string;
    balance: string;
  }[];
};

// gets fungible token holders from the API
export async function getFungibleTokenHolders(
  network: string,
  token: string,
  limit: number = 200,
  offset: number = 0
) {
  const apiUrl = getApiUrl(network);
  const response = await fetch(
    `${apiUrl}/extended/v1/tokens/ft/${token}/holders?limit=${limit}&offset=${offset}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to get fungible token holders: ${response.statusText}`
    );
  }
  const data = await response.json();
  return data as FungibleTokenHoldersResponse;
}
