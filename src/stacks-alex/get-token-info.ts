import { AlexSDK } from "alex-sdk";

async function getTokenInfo(tokenAddress: string) {
  try {
    // Initialize the SDK
    const alex = new AlexSDK();

    // Get token info for the specified token address
    const tokenInfo = await alex.fetchTokenInfo(tokenAddress);

    if (!tokenInfo) {
      console.log(`No token information found for address: ${tokenAddress}`);
      return null;
    }

    console.log(`Token information for ${tokenAddress}:`);
    console.log(JSON.stringify(tokenInfo, null, 2));

    // Display a more readable summary
    console.log("\nSummary:");
    console.log(`Name: ${tokenInfo.name}`);
    console.log(`ID: ${tokenInfo.id}`);
    console.log(`Wrap Token: ${tokenInfo.wrapToken}`);
    console.log(`Underlying Token: ${tokenInfo.underlyingToken}`);

    return tokenInfo;
  } catch (error) {
    console.error("Error getting token info:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log("Usage: bun get-token-info.ts <tokenAddress>");
  console.log(
    "Example: bun get-token-info.ts SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-token"
  );
  process.exit(1);
}

const tokenAddress = args[0];

// Execute the function
await getTokenInfo(tokenAddress);

export {};
