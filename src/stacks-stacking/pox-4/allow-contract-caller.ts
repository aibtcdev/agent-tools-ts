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
  getNetwork,
  getNextNonce,
  getPOXDetails,
  logBroadCastResult,
  NetworkType,
} from "../../utilities";

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
