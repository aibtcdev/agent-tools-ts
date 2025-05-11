import { AlexSDK, Currency } from "alex-sdk";

async function getRoutesWithDetails(
  fromCurrency: string,
  toCurrency: string,
  amount: string
) {
  try {
    // Initialize the SDK
    const alex = new AlexSDK();

    // Validate currencies
    if (!(fromCurrency in Currency) || !(toCurrency in Currency)) {
      throw new Error(
        "Invalid currency. Use one of: " + Object.keys(Currency).join(", ")
      );
    }

    // Parse amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Invalid amount. Please provide a positive number.");
    }

    // Convert to microunits (most tokens use 8 decimal places)
    const microunits = BigInt(Math.floor(parsedAmount * 1e8));

    // Get all possible routes with details for swapping between currencies
    const detailedRoutes = await alex.getAllPossibleRoutesWithDetails(
      Currency[fromCurrency as keyof typeof Currency],
      Currency[toCurrency as keyof typeof Currency],
      microunits
    );

    console.log(
      `All possible routes with details from ${fromCurrency} to ${toCurrency} for ${parsedAmount} ${fromCurrency}:`
    );

    // Show a summary of all routes
    console.log(`\nFound ${detailedRoutes.length} possible swap route(s)\n`);

    // Display detailed information for each route
    detailedRoutes.forEach((route, index) => {
      const toAmount = Number(route.toAmount) / 1e8;

      console.log(`Route ${index + 1}:`);
      console.log(`  Estimated output: ${toAmount} ${toCurrency}`);
      console.log(`  Path: ${route.path.join(" → ")}`);
      console.log(`  Segments: ${route.segments.length}`);

      // Display more details about each segment if needed
      if (route.segments.length > 0) {
        console.log("  Segment details:");
        route.segments.forEach((segment, segIndex) => {
          console.log(
            `    ${segIndex + 1}. ${segment.from} to ${segment.to} (Pool: ${
              segment.poolContractId
            })`
          );
        });
      }
      console.log(""); // Add an empty line between routes
    });

    return detailedRoutes;
  } catch (error) {
    console.error("Error getting routes with details:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log(
    "Usage: bun get-routes-with-details.ts <fromCurrency> <toCurrency> <amount>"
  );
  console.log("Example: bun get-routes-with-details.ts STX ALEX 100");
  process.exit(1);
}

const fromCurrency = args[0];
const toCurrency = args[1];
const amount = args[2];

// Execute the function
await getRoutesWithDetails(fromCurrency, toCurrency, amount);

export {};
