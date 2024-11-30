import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

async function repriceAsk(
  swapId: number,
  newStxAmount: number,
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

  console.log(`Preparing to reprice ask ${swapId} from account ${address}`);

  const sdk = new JingCashSDK({
    API_HOST:
      process.env.JING_API_URL || "https://backend-neon-ecru.vercel.app/api",
    API_KEY: process.env.JING_API_KEY || "dev-api-token",
    defaultAddress: address,
    network: CONFIG.NETWORK,
  });

  try {
    const response = await sdk.repriceAsk({
      swapId,
      newStxAmount,
      pair,
      recipient,
      expiry,
      accountIndex,
      mnemonic: CONFIG.MNEMONIC,
    });

    const { askDetails, tokenDecimals, tokenSymbol } = response.details;
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

    // Calculate and display the price change
    const oldPrice = askDetails.ustx / askDetails.amount;
    const newPrice = response.details.newUstx / askDetails.amount;
    const oldAdjustedPrice = oldPrice * Math.pow(10, tokenDecimals - 6);
    const newAdjustedPrice = newPrice * Math.pow(10, tokenDecimals - 6);

    console.log(`\nReprice details:`);
    console.log(
      `- New STX price: ${newStxAmount} STX (${response.details.newUstx} μSTX)`
    );
    console.log(
      `- Old price per ${tokenSymbol}: ${oldAdjustedPrice.toFixed(8)} STX`
    );
    console.log(
      `- New price per ${tokenSymbol}: ${newAdjustedPrice.toFixed(8)} STX`
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
    console.error("\nError:", error.message);
    process.exit(1);
  });
