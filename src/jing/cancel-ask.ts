import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

async function cancelAsk(swapId: number, accountIndex: number = 0) {
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );

  console.log(`Preparing to cancel ask ${swapId} from account ${address}`);

  const sdk = new JingCashSDK({
    API_HOST:
      process.env.JING_API_URL || "https://backend-neon-ecru.vercel.app/api",
    API_KEY: process.env.JING_API_KEY || "dev-api-token",
    defaultAddress: address,
    network: CONFIG.NETWORK,
  });

  try {
    const response = await sdk.cancelAsk({
      swapId,
      gasFee: 10000,
      accountIndex,
      mnemonic: CONFIG.MNEMONIC,
    });

    const { askDetails, tokenDecimals, tokenSymbol } = response.details;
    const regularTokenAmount = askDetails.amount / Math.pow(10, tokenDecimals);
    const price = askDetails.ustx / askDetails.amount;
    const adjustedPrice = price * Math.pow(10, tokenDecimals - 6);

    console.log(`\nAsk details:`);
    console.log(`- Creator: ${askDetails.ftSender}`);
    console.log(`- Token decimals: ${tokenDecimals}`);
    console.log(
      `- Amount: ${regularTokenAmount} ${tokenSymbol} (${askDetails.amount} μ${tokenSymbol})`
    );
    console.log(
      `- STX price: ${askDetails.ustx / 1_000_000} STX (${
        askDetails.ustx
      } μSTX)`
    );
    console.log(`- Price per ${tokenSymbol}: ${adjustedPrice.toFixed(8)} STX`);
    console.log(`- Refundable fees: ${response.details.fees} ${tokenSymbol}`);
    console.log(`- Gas fee: ${response.details.gasFee} STX`);

    console.log("\nPost Conditions:");
    console.log(`- Contract returns: ${regularTokenAmount} ${tokenSymbol}`);
    console.log(
      `- YANG contract returns up to: ${response.details.fees} ${tokenSymbol}`
    );

    console.log("\nTransaction broadcast successfully!");
    console.log("Transaction ID:", response.txid);
    console.log(
      `Monitor status at: https://explorer.stacks.co/txid/${response.txid}`
    );

    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error cancelling ask: ${error.message}`);
    } else {
      console.error("An unknown error occurred while cancelling ask");
    }
    throw error;
  }
}

// Parse command line arguments
const [swapId, accountIndex] = process.argv.slice(2);

if (!swapId) {
  console.error("\nUsage:");
  console.error("bun run src/jing/cancel-ask.ts <swap_id> [account_index]");
  console.error("\nParameters:");
  console.error("- swap_id: ID of the ask to cancel");
  console.error(
    "- account_index: (Optional) Account index to use, defaults to 0"
  );
  console.error("\nExample:");
  console.error("bun run src/jing/cancel-ask.ts 10");
  console.error("");
  process.exit(1);
}

cancelAsk(parseInt(swapId), accountIndex ? parseInt(accountIndex) : 0)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  });
