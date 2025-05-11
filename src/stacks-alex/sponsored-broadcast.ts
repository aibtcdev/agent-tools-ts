import { AlexSDK } from "alex-sdk";

async function broadcastSponsoredTransaction(signedTx: string) {
  try {
    // Initialize the SDK
    const alex = new AlexSDK();

    // Check if sponsored transaction service is available
    const isSponsorAvailable = await alex.isSponsoredTxServiceAvailable();
    if (!isSponsorAvailable) {
      throw new Error("Sponsored transaction service is currently unavailable");
    }

    // Basic validation
    if (!signedTx || typeof signedTx !== "string" || signedTx.trim() === "") {
      throw new Error(
        "Invalid transaction. Please provide a valid signed transaction string."
      );
    }

    console.log(`Broadcasting sponsored transaction...`);

    // Broadcast the transaction
    const txId = await alex.broadcastSponsoredTx(signedTx);

    console.log(`\nTransaction successfully broadcasted!`);
    console.log(`Transaction ID: ${txId}`);
    console.log(`\nYou can view your transaction at:`);
    console.log(`https://explorer.stacks.co/txid/${txId}`);

    return txId;
  } catch (error) {
    console.error("Error broadcasting sponsored transaction:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log("Usage: bun sponsored-broadcast.ts <signedTransaction>");
  console.log("Example: bun sponsored-broadcast.ts 00000000010400....");
  process.exit(1);
}

const signedTx = args[0];

// Execute the function
await broadcastSponsoredTransaction(signedTx);

export {};
