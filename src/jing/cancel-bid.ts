// src/jing/cancel-bid.ts

import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  contractPrincipalCV,
  makeContractSTXPostCondition,
  FungibleConditionCode,
  callReadOnlyFunction,
  cvToJSON,
} from "@stacks/transactions";
import {
  CONFIG,
  getNetwork,
  deriveChildAccount,
  getNextNonce,
} from "../utilities";
import {
  getTokenInfo,
  JING_CONTRACTS,
  calculateBidFees,
} from "./utils-token-pairs";

async function getBidDetails(swapId: number) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const result = await callReadOnlyFunction({
    contractAddress: JING_CONTRACTS.BID.address,
    contractName: JING_CONTRACTS.BID.name,
    functionName: "get-swap",
    functionArgs: [uintCV(swapId)],
    network,
    senderAddress: address,
  });

  const jsonResult = cvToJSON(result);
  if (!jsonResult.success) throw new Error("Failed to get bid details");

  return {
    ustx: parseInt(jsonResult.value.value.ustx.value),
    amount: parseInt(jsonResult.value.value.amount.value),
    stxSender: jsonResult.value.value["stx-sender"].value,
  };
}

async function cancelBid(
  swapId: number,
  pair: string,
  accountIndex: number = 0
) {
  const tokenInfo = getTokenInfo(pair);
  if (!tokenInfo) {
    throw new Error(`Failed to get token info for pair: ${pair}`);
  }

  const network = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );
  const nonce = await getNextNonce(CONFIG.NETWORK, address);

  console.log(`Preparing to cancel bid ${swapId} from account ${address}`);

  // Get bid details for post conditions
  const bidDetails = await getBidDetails(swapId);
  console.log(`Bid details:`);
  console.log(`- Creator: ${bidDetails.stxSender}`);
  console.log(`- Amount: ${bidDetails.amount}`);
  console.log(
    `- STX: ${bidDetails.ustx / 1_000_000} STX (${bidDetails.ustx} μSTX)`
  );

  if (bidDetails.stxSender !== address) {
    console.log(`\nError: Cannot cancel bid`);
    console.log(`- Your address: ${address}`);
    console.log(`- Required address: ${bidDetails.stxSender}`);
    throw new Error(
      `Only the bid creator (${bidDetails.stxSender}) can cancel this bid`
    );
  }
  const fees = calculateBidFees(bidDetails.ustx);

  const postConditions = [
    // Return STX from bid
    makeContractSTXPostCondition(
      JING_CONTRACTS.BID.address,
      JING_CONTRACTS.BID.name,
      FungibleConditionCode.Equal,
      bidDetails.ustx
    ),
    // Return fees from YIN contract
    makeContractSTXPostCondition(
      JING_CONTRACTS.BID.address,
      JING_CONTRACTS.YIN.name,
      FungibleConditionCode.LessEqual,
      fees
    ),
  ];

  const txOptions = {
    contractAddress: JING_CONTRACTS.BID.address,
    contractName: JING_CONTRACTS.BID.name,
    functionName: "cancel",
    functionArgs: [
      uintCV(swapId),
      contractPrincipalCV(tokenInfo.contractAddress, tokenInfo.contractName),
      contractPrincipalCV(JING_CONTRACTS.YIN.address, JING_CONTRACTS.YIN.name),
    ],
    senderKey: key,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    postConditions,
    nonce,
    fee: 10000, // 0.01 STX
  };

  try {
    console.log("Creating contract call...");
    const transaction = await makeContractCall(txOptions);
    console.log("Broadcasting transaction...");
    const broadcastResponse = await broadcastTransaction(transaction, network);
    console.log("Transaction broadcast successfully!");
    console.log("Transaction ID:", broadcastResponse.txid);
    console.log(
      `Monitor status at: https://explorer.stacks.co/txid/${broadcastResponse.txid}`
    );
    return broadcastResponse;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error cancelling bid: ${error.message}`);
    } else {
      console.error("An unknown error occurred while cancelling bid");
    }
    throw error;
  }
}

// Parse command line arguments
const [swapId, pair, accountIndex] = process.argv.slice(2);

if (!swapId || !pair) {
  console.error(
    "Usage: bun run src/jing/cancel-bid.ts <swap_id> <pair> [account_index]"
  );
  console.error("Example: bun run src/jing/cancel-bid.ts 1 PEPE-STX");
  process.exit(1);
}

cancelBid(parseInt(swapId), pair, accountIndex ? parseInt(accountIndex) : 0)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
