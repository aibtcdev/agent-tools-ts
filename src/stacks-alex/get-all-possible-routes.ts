import { AlexSDK, Currency } from "alex-sdk";

async function getAllPossibleRoutes(fromCurrency: string, toCurrency: string) {
  try {
    // Initialize the SDK
    const alex = new AlexSDK();

    // Validate currencies
    if (!(fromCurrency in Currency) || !(toCurrency in Currency)) {
      throw new Error(
        "Invalid currency. Use one of: " + Object.keys(Currency).join(", ")
      );
    }

    // Get all possible routes for swapping between currencies
    const allRoutes = await alex.getAllPossibleRoutes(
      Currency[fromCurrency as keyof typeof Currency],
      Currency[toCurrency as keyof typeof Currency]
    );

    console.log(`All possible routes from ${fromCurrency} to ${toCurrency}:`);
    console.log(JSON.stringify(allRoutes, null, 2));

    // Also display route count
    console.log(`\nFound ${allRoutes.length} possible swap route(s)`);

    return allRoutes;
  } catch (error) {
    console.error("Error getting all possible routes:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log(
    "Usage: bun get-all-possible-routes.ts <fromCurrency> <toCurrency>"
  );
  console.log("Example: bun get-all-possible-routes.ts STX ALEX");
  process.exit(1);
}

const fromCurrency = args[0];
const toCurrency = args[1];

// Execute the function
await getAllPossibleRoutes(fromCurrency, toCurrency);

export {};
