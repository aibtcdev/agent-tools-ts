// src/jing/ask.ts

import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  standardPrincipalCV,
  contractPrincipalCV,
  FungibleConditionCode,
  makeStandardFungiblePostCondition,
  createAssetInfo,
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
  calculateAskFees,
} from "./utils-token-pairs";

async function createAskOffer(
  pair: string,
  amount: number,
  ustx: number,
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

  // Calculate fees (in FT)
  const fees = calculateAskFees(amount);

  console.log("\nAsk details:");
  console.log(`- Pair: ${pair}`);
  console.log(`- Token amount: ${amount} (in μ units)`);
  console.log(`- STX amount: ${ustx / 1_000_000} STX (${ustx} μSTX)`);
  if (recipient) console.log(`- Private offer to: ${recipient}`);
  if (expiry) console.log(`- Expires in: ${expiry} blocks`);
  if (accountIndex !== 0) console.log(`- Using account index: ${accountIndex}`);
  console.log(`- Fee: ${fees} ${pair.split("-")[0]} (in μ units)`);

  const txOptions = {
    contractAddress: JING_CONTRACTS.ASK.address,
    contractName: JING_CONTRACTS.ASK.name,
    functionName: "offer",
    functionArgs: [
      uintCV(amount), // Token amount
      uintCV(ustx), // STX amount to receive
      recipient ? someCV(standardPrincipalCV(recipient)) : noneCV(),
      contractPrincipalCV(tokenInfo.contractAddress, tokenInfo.contractName),
      contractPrincipalCV(
        JING_CONTRACTS.YANG.address,
        JING_CONTRACTS.YANG.name
      ),
      expiry ? someCV(uintCV(expiry)) : noneCV(),
    ],
    senderKey: key,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      // Token amount + fees in FT
      makeStandardFungiblePostCondition(
        address,
        FungibleConditionCode.LessEqual,
        amount + fees,
        createAssetInfo(
          tokenInfo.contractAddress,
          tokenInfo.contractName,
          tokenInfo.assetName
        )
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
      `Ask offer initiated. Monitor status at: https://explorer.stacks.co/txid/${broadcastResponse.txid}`
    );
    return broadcastResponse;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error creating ask offer: ${error.message}`);
    } else {
      console.error("An unknown error occurred while creating ask offer");
    }
    throw error;
  }
}

// Parse command line arguments
const [pair, amount, ustxAmount, recipient, expiry, accountIndex] =
  process.argv.slice(2);

if (!pair || !amount || !ustxAmount) {
  console.error("\nUsage:");
  console.error(
    "bun run src/jing/ask.ts <pair> <token_amount> <ustx_amount> [recipient] [expiry] [account_index]"
  );
  console.error("\nParameters:");
  console.error("- pair: Trading pair (e.g., PEPE-STX)");
  console.error("- token_amount: Amount of tokens to sell (in μ units)");
  console.error(
    "- ustx_amount: Amount of STX to receive in micro-STX (1 STX = 1,000,000 μSTX)"
  );
  console.error(
    "- recipient: (Optional) Make private offer to specific address"
  );
  console.error("- expiry: (Optional) Block height when offer expires");
  console.error(
    "- account_index: (Optional) Account index to use, defaults to 0"
  );
  console.error("\nExamples:");
  console.error("1. Public ask:");
  console.error("   bun run src/jing/ask.ts PEPE-STX 100000000 1000000");
  console.error("\n2. Private ask to specific address with 1000 block expiry:");
  console.error(
    "   bun run src/jing/ask.ts PEPE-STX 100000000 1000000 SP29D6YMDNAKN1P045T6Z817RTE1AC0JAA99WAX2B 1000"
  );
  console.error("\nSupported pairs:", SupportedPairs.join(", "));
  process.exit(1);
}

createAskOffer(
  pair,
  parseInt(amount),
  parseInt(ustxAmount),
  recipient,
  expiry ? parseInt(expiry) : undefined,
  accountIndex ? parseInt(accountIndex) : 0
)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
