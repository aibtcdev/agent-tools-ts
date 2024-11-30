import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

async function cancelBid(swapId: number, accountIndex: number = 0) {
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );

  console.log(`Preparing to cancel bid ${swapId} from account ${address}`);

  const sdk = new JingCashSDK({
    API_HOST:
      process.env.JING_API_URL || "https://backend-neon-ecru.vercel.app/api",
    API_KEY: process.env.JING_API_KEY || "dev-api-token",
    defaultAddress: address,
    network: CONFIG.NETWORK,
  });

  try {
    const response = await sdk.cancelBid({
      swapId,
      gasFee: 10000,
      accountIndex,
      mnemonic: CONFIG.MNEMONIC,
    });

    const { bidDetails, tokenDecimals, tokenSymbol } = response.details;
    const regularTokenAmount = bidDetails.amount / Math.pow(10, tokenDecimals);
    const price = bidDetails.ustx / bidDetails.amount;
    const adjustedPrice = price * Math.pow(10, tokenDecimals - 6);

    console.log(`\nBid details:`);
    console.log(`- Creator: ${bidDetails.stxSender}`);
    console.log(`- Token decimals: ${tokenDecimals}`);
    console.log(
      `- Amount: ${regularTokenAmount} ${tokenSymbol} (${bidDetails.amount} μ${tokenSymbol})`
    );
    console.log(
      `- STX amount: ${bidDetails.ustx / 1_000_000} STX (${
        bidDetails.ustx
      } μSTX)`
    );
    console.log(`- Price per ${tokenSymbol}: ${adjustedPrice.toFixed(8)} STX`);
    console.log(`- Refundable STX fees: ${response.details.fees} STX`);
    console.log(`- Gas fee: ${response.details.gasFee} STX`);

    console.log("\nPost Conditions:");
    console.log(`- Contract returns: ${bidDetails.ustx / 1_000_000} STX`);
    console.log(`- YIN contract returns up to: ${response.details.fees} STX`);

    console.log("\nTransaction broadcast successfully!");
    console.log("Transaction ID:", response.txid);
    console.log(
      `Monitor status at: https://explorer.stacks.co/txid/${response.txid}`
    );

    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error cancelling bid: ${error.message}`);
    } else {
      console.error("An unknown error occurred while cancelling bid");
    }
    throw error;
  }
}

// Parse command line arguments
const [swapId, accountIndex] = process.argv.slice(2);

if (!swapId) {
  console.error("\nUsage:");
  console.error("bun run src/jing/cancel-bid.ts <swap_id> [account_index]");
  console.error("\nParameters:");
  console.error("- swap_id: ID of the bid to cancel");
  console.error(
    "- account_index: (Optional) Account index to use, defaults to 0"
  );
  console.error("\nExample:");
  console.error("bun run src/jing/cancel-bid.ts 10");
  console.error("");
  process.exit(1);
}

cancelBid(parseInt(swapId), accountIndex ? parseInt(accountIndex) : 0)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  });
