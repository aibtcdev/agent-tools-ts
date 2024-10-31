// jing/bid.ts

import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  standardPrincipalCV,
  contractPrincipalCV,
  FungibleConditionCode,
  makeStandardSTXPostCondition,
  someCV,
  noneCV,
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
  SupportedPairs,
  calculateBidFees,
} from "./utils-token-pairs";

async function createBidOffer(
  pair: string,
  ustx: number,
  amount: number,
  recipient?: string,
  expiry?: number,
  accountIndex: number = 0
) {
  // Validate pair is supported
  if (!SupportedPairs.includes(pair)) {
    throw new Error(`Unsupported trading pair: ${pair}`);
  }

  // Get token info
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

  console.log(
    `Preparing bid offer from account index ${accountIndex} (${address})`
  );

  // Calculate fees
  const fees = calculateBidFees(ustx);

  const txOptions = {
    contractAddress: JING_CONTRACTS.BID.address,
    contractName: JING_CONTRACTS.BID.name,
    functionName: "offer",
    functionArgs: [
      uintCV(ustx), // STX amount
      uintCV(amount), // Token amount
      recipient ? someCV(standardPrincipalCV(recipient)) : noneCV(), // Optional counterparty
      contractPrincipalCV(tokenInfo.contractAddress, tokenInfo.contractName), // FT contract
      contractPrincipalCV(JING_CONTRACTS.YIN.address, JING_CONTRACTS.YIN.name), // YIN token
      expiry ? someCV(uintCV(expiry)) : noneCV(), // Optional expiry
    ],
    senderKey: key,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      makeStandardSTXPostCondition(
        address,
        FungibleConditionCode.LessEqual,
        ustx + fees
      ),
    ],
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
      `Bid offer initiated. Monitor status at: https://explorer.stacks.co/txid/${broadcastResponse.txid}`
    );
    return broadcastResponse;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error creating bid offer: ${error.message}`);
    } else {
      console.error("An unknown error occurred while creating bid offer");
    }
    throw error;
  }
}

// Parse command line arguments
const [pair, ustxAmount, tokenAmount, recipient, expiry, accountIndex] =
  process.argv.slice(2);

if (!pair || !ustxAmount || !tokenAmount) {
  console.error(
    "Usage: ts-node bid-offer.ts <pair> <ustx_amount> <token_amount> [recipient] [expiry] [account_index]"
  );
  console.error("Supported pairs:", SupportedPairs.join(", "));
  process.exit(1);
}

// bun run src/jing/bid.ts PEPE-STX 1000000 100000000
createBidOffer(
  pair,
  parseInt(ustxAmount),
  parseInt(tokenAmount),
  recipient,
  expiry ? parseInt(expiry) : undefined,
  accountIndex ? parseInt(accountIndex) : 0
)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
