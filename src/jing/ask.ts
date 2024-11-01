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
  getTokenDecimals,
} from "./utils-token-pairs";

async function createAskOffer(
  pair: string,
  tokenAmount: number, // Regular token amount
  stxAmount: number, // Regular STX amount
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

  // Get token decimals and convert amounts
  const tokenDecimals = await getTokenDecimals(tokenInfo);
  const tokenSymbol = pair.split("-")[0];

  // Convert to micro units
  const microTokenAmount = Math.floor(
    tokenAmount * Math.pow(10, tokenDecimals)
  );
  const ustx = Math.floor(stxAmount * 1_000_000); // STX always has 6 decimals

  const network = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );
  const nonce = await getNextNonce(CONFIG.NETWORK, address);

  // Calculate fees (in FT)
  const microFees = calculateAskFees(microTokenAmount);
  const fees = microFees / Math.pow(10, tokenDecimals);

  console.log("\nAsk details:");
  console.log(`- Pair: ${pair}`);
  console.log(`- Token decimals: ${tokenDecimals}`);
  console.log(
    `- Token amount: ${tokenAmount} ${tokenSymbol} (${microTokenAmount} μ${tokenSymbol})`
  );
  console.log(`- STX price: ${stxAmount} STX (${ustx} μSTX)`);
  if (recipient) console.log(`- Private offer to: ${recipient}`);
  if (expiry) console.log(`- Expires in: ${expiry} blocks`);
  if (accountIndex !== 0) console.log(`- Using account index: ${accountIndex}`);
  console.log(`- Fee: ${fees} ${tokenSymbol} (${microFees} μ${tokenSymbol})`);
  console.log(`- Gas fee: ${10000 / 1_000_000} STX`);

  // Calculate and display the effective price
  const price = ustx / microTokenAmount;
  const adjustedPrice = price * Math.pow(10, tokenDecimals - 6);
  console.log(`- Price per ${tokenSymbol}: ${adjustedPrice.toFixed(8)} STX`);

  const txOptions = {
    contractAddress: JING_CONTRACTS.ASK.address,
    contractName: JING_CONTRACTS.ASK.name,
    functionName: "offer",
    functionArgs: [
      uintCV(microTokenAmount), // Token amount in micro units
      uintCV(ustx), // STX amount in micro units
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
      // Token amount + fees in FT (using micro units)
      makeStandardFungiblePostCondition(
        address,
        FungibleConditionCode.LessEqual,
        microTokenAmount + microFees,
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
    console.log("\nCreating contract call...");
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
const [pair, tokenAmount, stxAmount, recipient, expiry, accountIndex] =
  process.argv.slice(2);

if (!pair || !tokenAmount || !stxAmount) {
  console.error("\nUsage:");
  console.error(
    "bun run src/jing/ask.ts <pair> <token_amount> <stx_amount> [recipient] [expiry] [account_index]"
  );
  console.error("\nParameters:");
  console.error("- pair: Trading pair (e.g., PEPE-STX)");
  console.error(
    "- token_amount: Amount of tokens to sell (e.g., 100 for 100 PEPE)"
  );
  console.error(
    "- stx_amount: Amount of STX to receive (e.g., 1.5 for 1.5 STX)"
  );
  console.error(
    "- recipient: (Optional) Make private offer to specific address"
  );
  console.error(
    "- expiry: (Optional) Number of blocks from now until expiration (e.g., 100 for expiry in 100 blocks)"
  );
  console.error(
    "- account_index: (Optional) Account index to use, defaults to 0"
  );
  console.error("\nExamples:");
  console.error("1. Public ask:");
  console.error("   bun run src/jing/ask.ts PEPE-STX 100000 1.5");
  console.error("\n2. Private ask to specific address with 1000 block expiry:");
  console.error(
    "   bun run src/jing/ask.ts PEPE-STX 100000 1.5 SP29D6YMDNAKN1P045T6Z817RTE1AC0JAA99WAX2B 1000"
  );
  console.error("\nSupported pairs:", SupportedPairs.join(", "));
  process.exit(1);
}

createAskOffer(
  pair,
  parseFloat(tokenAmount),
  parseFloat(stxAmount),
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
