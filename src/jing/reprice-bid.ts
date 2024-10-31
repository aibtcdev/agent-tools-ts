// src/jing/reprice-bid.ts

import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  contractPrincipalCV,
  standardPrincipalCV,
  someCV,
  noneCV,
  callReadOnlyFunction,
  cvToJSON,
} from "@stacks/transactions";
import {
  CONFIG,
  getNetwork,
  deriveChildAccount,
  getNextNonce,
} from "../utilities";
import { getTokenInfo, JING_CONTRACTS } from "./utils-token-pairs";

interface BidDetails {
  ustx: number;
  amount: number;
  ft: string;
  stxSender: string; // Add this
}

async function getBidDetails(swapId: number): Promise<BidDetails> {
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
    ft: jsonResult.value.value.ft.value,
    stxSender: jsonResult.value.value["stx-sender"].value,
  };
}

async function repriceBid(
  swapId: number,
  newAmount: number,
  pair: string,
  recipient?: string,
  expiry?: number,
  accountIndex: number = 0
) {
  const tokenInfo = getTokenInfo(pair);
  if (!tokenInfo) {
    throw new Error(`Failed to get token info for pair: ${pair}`);
  }

  const tokenSymbol = pair.split("-")[0]; // Get token symbol from pair
  const network = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );
  const nonce = await getNextNonce(CONFIG.NETWORK, address);

  // Get current bid details and verify ownership
  const bidDetails = await getBidDetails(swapId);
  console.log(`\nBid details:`);
  console.log(`- Creator: ${bidDetails.stxSender}`);
  console.log(
    `- Current amount: ${bidDetails.amount} ${tokenSymbol} (in μ units)`
  );
  console.log(
    `- STX: ${bidDetails.ustx / 1_000_000} STX (${bidDetails.ustx} μSTX)`
  );

  if (bidDetails.stxSender !== address) {
    console.log(`\nError: Cannot reprice bid`);
    console.log(`- Your address: ${address}`);
    console.log(`- Required address: ${bidDetails.stxSender}`);
    throw new Error(
      `Only the bid creator (${bidDetails.stxSender}) can reprice this bid`
    );
  }

  console.log(`\nReprice details:`);
  console.log(`- New amount: ${newAmount}`);
  if (recipient) console.log(`- Making private offer to: ${recipient}`);
  if (expiry) console.log(`- Setting expiry in: ${expiry} blocks`);

  const txOptions = {
    contractAddress: JING_CONTRACTS.BID.address,
    contractName: JING_CONTRACTS.BID.name,
    functionName: "re-price",
    functionArgs: [
      uintCV(swapId),
      contractPrincipalCV(tokenInfo.contractAddress, tokenInfo.contractName),
      contractPrincipalCV(JING_CONTRACTS.YIN.address, JING_CONTRACTS.YIN.name),
      uintCV(newAmount),
      expiry ? someCV(uintCV(expiry)) : noneCV(),
      recipient ? someCV(standardPrincipalCV(recipient)) : noneCV(),
    ],
    senderKey: key,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    nonce,
    fee: 10000,
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
      console.error(`Error repricing bid: ${error.message}`);
    } else {
      console.error("An unknown error occurred while repricing bid");
    }
    throw error;
  }
}

// Parse command line arguments
const [swapId, newAmount, pair, recipient, expiry, accountIndex] =
  process.argv.slice(2);

if (!swapId || !newAmount || !pair) {
  console.error(
    "Usage: bun run src/jing/reprice-bid.ts <swap_id> <new_amount> <pair> [recipient] [expiry] [account_index]"
  );
  console.error(
    "Example: bun run src/jing/reprice-bid.ts 1 200000000 PEPE-STX"
  );
  console.error(
    "Example with private offer: bun run src/jing/reprice-bid.ts 1 200000000 PEPE-STX SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS 100000"
  );
  process.exit(1);
}

repriceBid(
  parseInt(swapId),
  parseInt(newAmount),
  pair,
  recipient,
  expiry ? parseInt(expiry) : undefined,
  accountIndex ? parseInt(accountIndex) : 0
)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
