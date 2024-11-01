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
  getTokenDecimals,
} from "./utils-token-pairs";

async function createBidOffer(
  pair: string,
  stxAmount: number, // Regular STX amount (e.g., 1 for 1 STX)
  tokenAmount: number, // Regular token amount (e.g., 100 for 100 PEPE)
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

  // Get token decimals - will throw if decimals can't be read
  const tokenDecimals = await getTokenDecimals(tokenInfo);
  const tokenSymbol = pair.split("-")[0];

  // Convert to micro units
  const ustx = Math.floor(stxAmount * 1_000_000); // STX always has 6 decimals
  const microTokenAmount = Math.floor(
    tokenAmount * Math.pow(10, tokenDecimals)
  );

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

  console.log("\nBid details:");
  console.log(`- Pair: ${pair}`);
  console.log(`- STX amount: ${stxAmount} STX (${ustx} μSTX)`);
  console.log(
    `- Token amount: ${tokenAmount} ${tokenSymbol} (${microTokenAmount} μ${tokenSymbol})`
  );
  if (recipient) console.log(`- Private offer to: ${recipient}`);
  if (expiry) console.log(`- Expires in: ${expiry} blocks`);
  if (accountIndex !== 0) console.log(`- Using account index: ${accountIndex}`);
  console.log(`- Fee: ${fees / 1_000_000} STX`);
  console.log(`- Token decimals: ${tokenDecimals}`);
  console.log(`- Gas fee: ${10000 / 1_000_000} STX`);

  const txOptions = {
    contractAddress: JING_CONTRACTS.BID.address,
    contractName: JING_CONTRACTS.BID.name,
    functionName: "offer",
    functionArgs: [
      uintCV(ustx), // STX amount
      uintCV(microTokenAmount), // Token amount
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
const [pair, stxAmount, tokenAmount, recipient, expiry, accountIndex] =
  process.argv.slice(2);

if (!pair || !stxAmount || !tokenAmount) {
  console.error("\nUsage:");
  console.error(
    "bun run src/jing/bid.ts <pair> <stx_amount> <token_amount> [recipient] [expiry] [account_index]"
  );
  console.error("\nParameters:");
  console.error("- pair: Trading pair (e.g., PEPE-STX)");
  console.error("- stx_amount: Amount of STX (e.g., 1 for 1 STX)");
  console.error("- token_amount: Amount of tokens (e.g., 100 for 100 PEPE)");
  console.error(
    "- recipient: (Optional) Make private offer to specific address"
  );
  console.error("- expiry: (Optional) Block height when offer expires");
  console.error(
    "- account_index: (Optional) Account index to use, defaults to 0"
  );
  console.error("\nExamples:");
  console.error("1. Public bid:");
  console.error("   bun run src/jing/bid.ts PEPE-STX 1 100000");
  console.error("\n2. Private bid to specific address with 1000 block expiry:");
  console.error(
    "   bun run src/jing/bid.ts PEPE-STX 1 100 SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS 1000"
  );
  console.error("\nSupported pairs:", SupportedPairs.join(", "));
  process.exit(1);
}

createBidOffer(
  pair,
  parseFloat(stxAmount), // Parse as float since we're accepting regular units
  parseFloat(tokenAmount), // Parse as float since we're accepting regular units
  recipient,
  expiry ? parseInt(expiry) : undefined,
  accountIndex ? parseInt(accountIndex) : 0
)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  });
