import {
  AnchorMode,
  broadcastTransaction,
  makeContractCall,
  noneCV,
  principalCV,
} from "@stacks/transactions";
import { bytesToHex } from "@stacks/common";
import {
  CONFIG,
  deriveChildAccount,
  getApiUrl,
  getNetwork,
  getNextNonce,
  logBroadCastResult,
  NetworkType,
} from "../../utilities";

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

async function getPOXDetails(network: NetworkType) {
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

// CONFIGURATION
const networkObj = getNetwork(CONFIG.NETWORK);

//returns stacking contract identifier (contract.address) for specific network
async function getStackingContractInfo(network: NetworkType) {
  let poxDetails = await getPOXDetails(network);
  let splitIndex = poxDetails.contract_id.indexOf(".");
  let contractAddress = poxDetails.contract_id.slice(0, splitIndex);
  let contractName = poxDetails.contract_id.slice(splitIndex + 1);
  return {
    contractAddress,
    contractName,
  };
}

// handles delegating STX to a pool
async function allowContractCaller(poolAddress: string) {
  try {
    // get account info from env
    const network = CONFIG.NETWORK;
    const mnemonic = CONFIG.MNEMONIC;
    const accountIndex = CONFIG.ACCOUNT_INDEX;

    // get account address and private key
    const { address, key } = await deriveChildAccount(
      network,
      mnemonic,
      accountIndex
    );

    // get the next nonce for the account
    const nonce = await getNextNonce(network, address);
    // build the transaction for transferring tokens

    let stakingContractInfo = await getStackingContractInfo(network);

    const transaction = await makeContractCall({
      contractAddress: stakingContractInfo.contractAddress,
      contractName: stakingContractInfo.contractName,
      functionName: "allow-contract-caller",
      functionArgs: [principalCV(poolAddress), noneCV()],
      senderKey: key,
      validateWithAbi: true,
      network,
      anchorMode: AnchorMode.Any,
    });

    // To see the raw serialized transaction
    const serializedTx = transaction.serialize();
    const serializedTxHex = bytesToHex(serializedTx);
    console.log(`Serialized Transaction (Hex): ${serializedTxHex}`);

    // Broadcast the transaction
    const broadcastResponse = await broadcastTransaction(
      transaction,
      networkObj
    );
    return {
      from: address,
      ...broadcastResponse,
    };
  } catch (error) {
    console.error(`Error authorizing pool : ${error}`);
    return null;
  }
}

async function main() {
  // Get the poolAddress from command line arguments and call allowContractCaller
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: bun run allow-contract-caller.ts <poolAddress>'");
    return;
  }

  const poolAddress = args[0];

  if (!poolAddress) {
    console.error("Please provide pool address as argument");
    return;
  }
  let response = await allowContractCaller(poolAddress);
  //return if response is null as the error  is logged by the returning function
  if (!response) {
    return;
  }
  logBroadCastResult(response, response.from);
}

main();
