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
import {
  getTokenInfo,
  JING_CONTRACTS,
  getTokenDecimals,
} from "./utils-token-pairs";

interface AskDetails {
  ustx: number;
  amount: number;
  ft: string;
  ftSender: string;
  tokenDecimals?: number;
}

async function getAskDetails(swapId: number): Promise<AskDetails> {
  const network = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const result = await callReadOnlyFunction({
    contractAddress: JING_CONTRACTS.ASK.address,
    contractName: JING_CONTRACTS.ASK.name,
    functionName: "get-swap",
    functionArgs: [uintCV(swapId)],
    network,
    senderAddress: address,
  });

  const jsonResult = cvToJSON(result);
  if (!jsonResult.success) throw new Error("Failed to get ask details");

  return {
    ustx: parseInt(jsonResult.value.value.ustx.value),
    amount: parseInt(jsonResult.value.value.amount.value),
    ft: jsonResult.value.value.ft.value,
    ftSender: jsonResult.value.value["ft-sender"].value,
  };
}

async function repriceAsk(
  swapId: number,
  newStxAmount: number, // Regular STX amount
  pair: string,
  recipient?: string,
  expiry?: number,
  accountIndex: number = 0
) {
  const tokenInfo = getTokenInfo(pair);
  if (!tokenInfo) {
    throw new Error(`Failed to get token info for pair: ${pair}`);
  }

  // Convert STX to micro units
  const newUstx = Math.floor(newStxAmount * 1_000_000);
  const tokenSymbol = pair.split("-")[0];

  // Get token decimals
  const tokenDecimals = await getTokenDecimals(tokenInfo);

  const network = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );
  const nonce = await getNextNonce(CONFIG.NETWORK, address);

  // Get current ask details and verify ownership
  const askDetails = await getAskDetails(swapId);
  askDetails.tokenDecimals = tokenDecimals;

  const regularTokenAmount = askDetails.amount / Math.pow(10, tokenDecimals);

  console.log(`\nAsk details:`);
  console.log(`- Creator: ${askDetails.ftSender}`);
  console.log(`- Token decimals: ${tokenDecimals}`);
  console.log(
    `- Current amount: ${regularTokenAmount} ${tokenSymbol} (${askDetails.amount} μ${tokenSymbol})`
  );
  console.log(
    `- Current price: ${askDetails.ustx / 1_000_000} STX (${
      askDetails.ustx
    } μSTX)`
  );

  if (askDetails.ftSender !== address) {
    console.log(`\nError: Cannot reprice ask`);
    console.log(`- Your address: ${address}`);
    console.log(`- Required address: ${askDetails.ftSender}`);
    throw new Error(
      `Only the ask creator (${askDetails.ftSender}) can reprice this ask`
    );
  }

  // Calculate and display the price change
  const oldPrice = askDetails.ustx / askDetails.amount;
  const newPrice = newUstx / askDetails.amount;
  const oldAdjustedPrice = oldPrice * Math.pow(10, tokenDecimals - 6);
  const newAdjustedPrice = newPrice * Math.pow(10, tokenDecimals - 6);

  console.log(`\nReprice details:`);
  console.log(`- New STX price: ${newStxAmount} STX (${newUstx} μSTX)`);
  console.log(
    `- Old price per ${tokenSymbol}: ${oldAdjustedPrice.toFixed(8)} STX`
  );
  console.log(
    `- New price per ${tokenSymbol}: ${newAdjustedPrice.toFixed(8)} STX`
  );
  if (recipient) console.log(`- Making private offer to: ${recipient}`);
  if (expiry) console.log(`- Setting expiry in: ${expiry} blocks`);
  console.log(`- Gas fee: ${10000 / 1_000_000} STX`);

  const txOptions = {
    contractAddress: JING_CONTRACTS.ASK.address,
    contractName: JING_CONTRACTS.ASK.name,
    functionName: "re-price",
    functionArgs: [
      uintCV(swapId),
      contractPrincipalCV(tokenInfo.contractAddress, tokenInfo.contractName),
      contractPrincipalCV(
        JING_CONTRACTS.YANG.address,
        JING_CONTRACTS.YANG.name
      ),
      uintCV(newUstx),
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
    console.log("\nCreating contract call...");
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
      console.error(`Error repricing ask: ${error.message}`);
    } else {
      console.error("An unknown error occurred while repricing ask");
    }
    throw error;
  }
}

// Parse command line arguments
const [swapId, newStxAmount, pair, recipient, expiry, accountIndex] =
  process.argv.slice(2);

if (!swapId || !newStxAmount || !pair) {
  console.error("\nUsage:");
  console.error(
    "bun run src/jing/reprice-ask.ts <swap_id> <new_stx_amount> <pair> [recipient] [expiry] [account_index]"
  );
  console.error("\nParameters:");
  console.error("- swap_id: ID of the ask to reprice");
  console.error("- new_stx_amount: New STX price (e.g., 1.5 for 1.5 STX)");
  console.error("- pair: Trading pair (e.g., PEPE-STX)");
  console.error(
    "- recipient: (Optional) Make private offer to specific address"
  );
  console.error("- expiry: (Optional) Blocks until expiry");
  console.error(
    "- account_index: (Optional) Account index to use, defaults to 0"
  );
  console.error("\nExamples:");
  console.error("1. Public reprice:");
  console.error("   bun run src/jing/reprice-ask.ts 9 0.69 PEPE-STX");
  console.error("\n2. Private offer with expiry:");
  console.error(
    "   bun run src/jing/reprice-ask.ts 1 1.5 PEPE-STX SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22 69"
  );
  process.exit(1);
}

repriceAsk(
  parseInt(swapId),
  parseFloat(newStxAmount),
  pair,
  recipient,
  expiry ? parseInt(expiry) : undefined,
  accountIndex ? parseInt(accountIndex) : 0
)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      "\nError:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  });
