import { AlexSDK } from "alex-sdk";

async function getSwappableCurrencies() {
  try {
    // Initialize the SDK
    const alex = new AlexSDK();

    // Fetch information about all swappable currencies
    const swappableCurrencies = await alex.fetchSwappableCurrency();

    console.log("Available swappable currencies on Alex:");
    console.log(JSON.stringify(swappableCurrencies, null, 2));

    // Also display a simplified list if available
    if (swappableCurrencies && Array.isArray(swappableCurrencies)) {
      console.log("\nCurrency List:");
      swappableCurrencies.forEach((currency) => {
        if (currency && typeof currency === "object" && "name" in currency) {
          console.log(`- ${currency.name} (${currency.symbol || "No symbol"})`);
          if ("contractAddress" in currency) {
            console.log(`  Contract: ${currency.contractAddress}`);
          }
        }
      });
    }

    return swappableCurrencies;
  } catch (error) {
    console.error("Error getting swappable currencies:", error);
    process.exit(1);
  }
}

// No arguments needed for this command
console.log("Fetching swappable currencies from Alex...");
await getSwappableCurrencies();

export {};
