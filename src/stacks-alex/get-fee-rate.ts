import { AlexSDK, Currency } from "alex-sdk";

async function getFeeRate(fromCurrency: string, toCurrency: string) {
  try {
    // Initialize the SDK
    const alex = new AlexSDK();

    // Validate currencies
    if (!(fromCurrency in Currency) || !(toCurrency in Currency)) {
      throw new Error(
        "Invalid currency. Use one of: " + Object.keys(Currency).join(", ")
      );
    }

    // Get swap fee between currencies
    const feeRate = await alex.getFeeRate(
      Currency[fromCurrency as keyof typeof Currency],
      Currency[toCurrency as keyof typeof Currency]
    );

    console.log(`Swap fee from ${fromCurrency} to ${toCurrency}: ${feeRate}`);
    return feeRate;
  } catch (error) {
    console.error("Error getting fee rate:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: bun get-fee-rate.ts <fromCurrency> <toCurrency>");
  console.log("Example: bun get-fee-rate.ts STX ALEX");
  process.exit(1);
}

const fromCurrency = args[0];
const toCurrency = args[1];

// Execute the function
await getFeeRate(fromCurrency, toCurrency);

export {};
