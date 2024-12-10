import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

async function submitAsk(swapId: number, accountIndex: number = 0) {
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );

  console.log(`Preparing to submit ask ${swapId} from account ${address}`);

  const sdk = new JingCashSDK({
    API_HOST:
      process.env.JING_API_URL || "https://backend-neon-ecru.vercel.app/api",
    API_KEY: process.env.JING_API_KEY || "dev-api-token",
    defaultAddress: address,
    network: CONFIG.NETWORK,
  });

  try {
    const response = await sdk.submitAsk({
      swapId,
      gasFee: 30000,
      accountIndex,
      mnemonic: CONFIG.MNEMONIC,
    });

    const { askDetails, tokenDecimals, tokenSymbol } = response.details;
    const regularTokenAmount = askDetails.amount / Math.pow(10, tokenDecimals);
    const price = askDetails.ustx / askDetails.amount;
    const adjustedPrice = price * Math.pow(10, tokenDecimals - 6);

    console.log("\nSwap Details:");
    console.log(`- Token decimals: ${tokenDecimals}`);
    console.log(
      `- You send: ${askDetails.ustx / 1_000_000} STX (${askDetails.ustx} μSTX)`
    );
    console.log(
      `- You receive: ${regularTokenAmount} ${tokenSymbol} (${askDetails.amount} μ${tokenSymbol})`
    );
    console.log(
      `- Token fee: ${response.details.fees} ${tokenSymbol} from YANG contract`
    );
    console.log(`- Network fee: ${response.details.gasFee} STX`);
    console.log(`- Price per ${tokenSymbol}: ${adjustedPrice.toFixed(8)} STX`);

    console.log("\nPost Conditions:");
    console.log(`- Your STX transfer: ${askDetails.ustx} μSTX`);
    console.log(
      `- Contract token transfer: ${askDetails.amount} μ${tokenSymbol}`
    );
    console.log(`- Maximum fees: ${response.details.fees} ${tokenSymbol}`);

    console.log("\nTransaction broadcast successfully!");
    console.log("Transaction ID:", response.txid);
    console.log(
      `Monitor status at: https://explorer.stacks.co/txid/${response.txid}`
    );

    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error submitting ask: ${error.message}`);
    } else {
      console.error("An unknown error occurred while submitting ask");
    }
    throw error;
  }
}

// Parse command line arguments
const [swapId, accountIndex] = process.argv.slice(2);

if (!swapId) {
  console.error("\nUsage:");
  console.error("bun run src/jing/submit-ask.ts <swap_id> [account_index]");
  console.error("\nParameters:");
  console.error("- swap_id: ID of the ask to submit swap for");
  console.error(
    "- account_index: (Optional) Account index to use, defaults to 0"
  );
  console.error("\nExample:");
  console.error("bun run src/jing/submit-ask.ts 12");
  console.error("");
  process.exit(1);
}

submitAsk(parseInt(swapId), accountIndex ? parseInt(accountIndex) : 0)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  });
