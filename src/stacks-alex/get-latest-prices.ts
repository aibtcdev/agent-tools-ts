import { AlexSDK } from "alex-sdk";

async function getLatestPrices() {
  try {
    // Initialize the SDK
    const alex = new AlexSDK();

    // Get the latest prices for all supported currencies
    const latestPrices = await alex.getLatestPrices();

    console.log("Latest prices for all supported currencies:");
    console.log(JSON.stringify(latestPrices, null, 2));

    // Also display in a more readable format
    console.log("\nSummary:");
    Object.entries(latestPrices).forEach(([currency, priceData]) => {
      console.log(`${currency}: $${priceData.priceInUSD.toFixed(4)} USD`);
    });

    return latestPrices;
  } catch (error) {
    console.error("Error getting latest prices:", error);
    process.exit(1);
  }
}

// No arguments needed for this command
console.log("Fetching latest prices from Alex...");
await getLatestPrices();

export {};
