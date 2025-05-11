import { AlexSDK, Currency, AMMRoute } from "alex-sdk";

async function getWayPointsForRoute(fromCurrency: string, toCurrency: string) {
  try {
    // Initialize the SDK
    const alex = new AlexSDK();

    // Validate currencies
    if (!(fromCurrency in Currency) || !(toCurrency in Currency)) {
      throw new Error(
        "Invalid currency. Use one of: " + Object.keys(Currency).join(", ")
      );
    }

    // First get a route between the currencies
    const route = await alex.getRoute(
      Currency[fromCurrency as keyof typeof Currency],
      Currency[toCurrency as keyof typeof Currency]
    );

    if (!route || !Array.isArray(route) || route.length === 0) {
      throw new Error(
        `No route found between ${fromCurrency} and ${toCurrency}`
      );
    }

    // Get way points for the route
    const wayPoints = await alex.getWayPoints(route as AMMRoute);

    console.log(
      `Way points for the route from ${fromCurrency} to ${toCurrency}:`
    );
    console.log("Route:", JSON.stringify(route, null, 2));
    console.log("Way Points:", JSON.stringify(wayPoints, null, 2));

    return { route, wayPoints };
  } catch (error) {
    console.error("Error getting way points:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: bun get-way-points.ts <fromCurrency> <toCurrency>");
  console.log("Example: bun get-way-points.ts STX ALEX");
  process.exit(1);
}

const fromCurrency = args[0];
const toCurrency = args[1];

// Execute the function
await getWayPointsForRoute(fromCurrency, toCurrency);

export {};
