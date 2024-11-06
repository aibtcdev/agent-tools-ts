import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

async function repriceBid(
  swapId: number,
  newTokenAmount: number,
  pair: string,
  recipient?: string,
  expiry?: number,
  accountIndex: number = 0
) {
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );

  console.log(`Preparing to reprice bid ${swapId} from account ${address}`);

  const sdk = new JingCashSDK({
    API_HOST:
      process.env.JING_API_URL || "https://backend-neon-ecru.vercel.app/api",
    API_KEY: process.env.JING_API_KEY || "dev-api-token",
    defaultAddress: address,
    network: CONFIG.NETWORK,
  });

  try {
    const response = await sdk.repriceBid({
      swapId,
      newTokenAmount,
      pair,
      recipient,
      expiry,
      accountIndex,
      mnemonic: CONFIG.MNEMONIC,
    });

    const { bidDetails, tokenDecimals, tokenSymbol } = response.details;
    const regularTokenAmount = bidDetails.amount / Math.pow(10, tokenDecimals);
    const newRegularAmount =
      response.details.newAmount / Math.pow(10, tokenDecimals);

    console.log(`\nBid details:`);
    console.log(`- Creator: ${bidDetails.stxSender}`);
    console.log(
      `- Current amount: ${regularTokenAmount} ${tokenSymbol} (${bidDetails.amount} μ${tokenSymbol})`
    );
    console.log(
      `- STX: ${bidDetails.ustx / 1_000_000} STX (${bidDetails.ustx} μSTX)`
    );
    console.log(`- Token decimals: ${tokenDecimals}`);

    console.log(`\nReprice details:`);
    console.log(
      `- New amount: ${newRegularAmount} ${tokenSymbol} (${response.details.newAmount} μ${tokenSymbol})`
    );
    if (recipient) console.log(`- Making private offer to: ${recipient}`);
    if (expiry) console.log(`- Setting expiry in: ${expiry} blocks`);
    console.log(`- Gas fee: ${response.details.gasFee} STX`);

    console.log("\nTransaction broadcast successfully!");
    console.log("Transaction ID:", response.txid);
    console.log(
      `Monitor status at: https://explorer.stacks.co/txid/${response.txid}`
    );

    return response;
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
  console.error("\nParameters:");
  console.error("- swap_id: ID of the bid to reprice");
  console.error(`- new_amount: New token amount (e.g., 100 for 100 tokens)`);
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
  console.error("   bun run src/jing/reprice-bid.ts 1 100 PEPE-STX");
  console.error("\n2. Private offer with expiry:");
  console.error(
    "   bun run src/jing/reprice-bid.ts 1 100 PEPE-STX SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS 100000"
  );
  process.exit(1);
}

repriceBid(
  parseInt(swapId),
  parseFloat(newAmount),
  pair,
  recipient,
  expiry ? parseInt(expiry) : undefined,
  accountIndex ? parseInt(accountIndex) : 0
)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  });
