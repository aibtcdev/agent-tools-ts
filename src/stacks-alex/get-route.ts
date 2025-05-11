import { AlexSDK, Currency } from "alex-sdk";

async function getRoute(fromCurrency: string, toCurrency: string) {
  try {
    // Initialize the SDK
    const alex = new AlexSDK();

    // Validate currencies
    if (!(fromCurrency in Currency) || !(toCurrency in Currency)) {
      throw new Error(
        "Invalid currency. Use one of: " + Object.keys(Currency).join(", ")
      );
    }

    // Get the router path for swapping between currencies
    const router = await alex.getRoute(
      Currency[fromCurrency as keyof typeof Currency],
      Currency[toCurrency as keyof typeof Currency]
    );

    console.log(`Router path from ${fromCurrency} to ${toCurrency}:`);
    console.log(JSON.stringify(router, null, 2));
    return router;
  } catch (error) {
    console.error("Error getting route:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: bun get-route.ts <fromCurrency> <toCurrency>");
  console.log("Example: bun get-route.ts STX ALEX");
  process.exit(1);
}

const fromCurrency = args[0];
const toCurrency = args[1];

// Execute the function
await getRoute(fromCurrency, toCurrency);

export {};
