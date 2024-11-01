import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  contractPrincipalCV,
  makeStandardSTXPostCondition,
  makeContractSTXPostCondition,
  FungibleConditionCode,
  callReadOnlyFunction,
  cvToJSON,
  createAssetInfo,
  makeStandardFungiblePostCondition,
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
  getTokenDecimals,
} from "./utils-token-pairs";

interface BidDetails {
  ustx: number;
  amount: number;
  ft: string;
  tokenDecimals?: number;
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
  };
}

async function submitSwap(
  swapId: number,
  pair: string,
  accountIndex: number = 0
) {
  const tokenInfo = getTokenInfo(pair);
  if (!tokenInfo) {
    throw new Error(`Failed to get token info for pair: ${pair}`);
  }

  // Get token decimals
  const tokenDecimals = await getTokenDecimals(tokenInfo);
  const tokenSymbol = pair.split("-")[0];

  const network = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );
  const nonce = await getNextNonce(CONFIG.NETWORK, address);

  // Get bid details for post conditions
  const bidDetails = await getBidDetails(swapId);
  const fees = calculateBidFees(bidDetails.ustx);

  const postConditions = [
    // You send the FT
    makeStandardFungiblePostCondition(
      address,
      FungibleConditionCode.Equal,
      bidDetails.amount,
      createAssetInfo(
        tokenInfo.contractAddress,
        tokenInfo.contractName,
        tokenInfo.assetName
      )
    ),
    // Contract sends STX
    makeContractSTXPostCondition(
      JING_CONTRACTS.BID.address,
      JING_CONTRACTS.BID.name,
      FungibleConditionCode.Equal,
      bidDetails.ustx
    ),
    // Fees from YIN contract
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
    functionName: "submit-swap",
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
    fee: 30000,
  };

  try {
    console.log("Creating contract call...");
    console.log(`\nSubmitting swap for bid ${swapId}:`);

    // Calculate regular units for display
    const regularTokenAmount = bidDetails.amount / Math.pow(10, tokenDecimals);

    console.log("\nSwap Details:");
    console.log(`- Token decimals: ${tokenDecimals}`);
    console.log(
      `- You send: ${regularTokenAmount} ${tokenSymbol} (${bidDetails.amount} μ${tokenSymbol})`
    );
    console.log(
      `- You receive: ${bidDetails.ustx / 1_000_000} STX (${
        bidDetails.ustx
      } μSTX)`
    );
    console.log(`- Network fee: ${30000 / 1_000_000} STX (${30000} μSTX)`);

    // Calculate and display the effective price
    const price = bidDetails.ustx / bidDetails.amount;
    const adjustedPrice = price * Math.pow(10, tokenDecimals - 6);
    console.log(`- Price per ${tokenSymbol}: ${adjustedPrice.toFixed(8)} STX`);

    console.log("\nPost Conditions:");
    console.log(
      `- Your ${tokenSymbol} transfer: ${bidDetails.amount} μ${tokenSymbol}`
    );
    console.log(`- Contract STX transfer: ${bidDetails.ustx} μSTX`);
    console.log(`- Maximum fees: ${fees} μSTX`);

    const transaction = await makeContractCall(txOptions);
    console.log("\nBroadcasting transaction...");
    const broadcastResponse = await broadcastTransaction(transaction, network);
    console.log("Transaction broadcast successfully!");
    console.log("Transaction ID:", broadcastResponse.txid);
    console.log(
      `Monitor status at: https://explorer.stacks.co/txid/${broadcastResponse.txid}`
    );
    return broadcastResponse;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error submitting swap: ${error.message}`);
    } else {
      console.error("An unknown error occurred while submitting swap");
    }
    throw error;
  }
}

// Parse command line arguments
const [swapId, pair, accountIndex] = process.argv.slice(2);

if (!swapId || !pair) {
  console.error("\nUsage:");
  console.error(
    "bun run src/jing/submit-bid.ts <swap_id> <pair> [account_index]"
  );
  console.error("\nParameters:");
  console.error("- swap_id: ID of the bid to submit swap for");
  console.error("- pair: Trading pair (e.g., PEPE-STX)");
  console.error(
    "- account_index: (Optional) Account index to use, defaults to 0"
  );
  console.error("\nExample:");
  console.error("bun run src/jing/submit-bid.ts 12 PEPE-STX");
  console.error("");
  process.exit(1);
}

submitSwap(parseInt(swapId), pair, accountIndex ? parseInt(accountIndex) : 0)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      "\nError:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  });
