import { AlexSDK } from "alex-sdk";

async function getBalances(stxAddress: string) {
  try {
    // Validate address format (basic check)
    if (!stxAddress.startsWith("ST") && !stxAddress.startsWith("SM")) {
      throw new Error(
        "Invalid STX address format. Address should start with ST or SM."
      );
    }

    // Initialize the SDK
    const alex = new AlexSDK();

    // Get balances for the specified STX address
    const balances = await alex.getBalances(stxAddress);

    console.log(`Balances for address ${stxAddress}:`);
    console.log(JSON.stringify(balances, null, 2));

    // Also display in a more readable format if available
    if (balances && typeof balances === "object") {
      console.log("\nSummary:");
      Object.entries(balances).forEach(([currency, balance]) => {
        // Convert from microunits if applicable
        const readableBalance =
          typeof balance === "bigint" ? Number(balance) / 1e8 : balance;

        console.log(`${currency}: ${readableBalance}`);
      });
    }

    return balances;
  } catch (error) {
    console.error("Error getting balances:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log("Usage: bun get-balances.ts <stxAddress>");
  console.log(
    "Example: bun get-balances.ts ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
  );
  process.exit(1);
}

const stxAddress = args[0];

// Execute the function
await getBalances(stxAddress);

export {};
