import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

async function listAvailableMarkets() {
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const sdk = new JingCashSDK({
    API_HOST:
      process.env.JING_API_URL || "https://backend-neon-ecru.vercel.app/api",
    API_KEY: process.env.JING_API_KEY || "dev-api-token",
    defaultAddress: address,
    network: CONFIG.NETWORK,
  });

  try {
    const markets = await sdk.getAvailableMarkets();

    console.log("\n=== Available Markets on Jing.Cash ===");
    console.log("Pair          | Base Token Contract");
    console.log("---------------------------------------------");

    for (const market of markets) {
      console.log(`${market.pair.padEnd(13)} | ${market.baseToken.contract}`);
    }

    // Usage instructions
    console.log("\n=== How to Use ===");
    console.log("1. To view orderbook for a specific market:");
    console.log("   bun run src/jing/view-orderbook.ts <pair>");
    console.log("   Example: bun run src/jing/view-orderbook.ts WELSH-STX");
    console.log("\n2. To place orders:");
    console.log(
      "   - Create Ask (Sell): bun run src/jing/create-ask.ts <pair> <amount> <price>"
    );
    console.log(
      "   - Create Bid (Buy): bun run src/jing/create-bid.ts <pair> <amount> <price>"
    );

    return markets;
  } catch (error) {
    console.error("Error fetching markets:", error);
    throw error;
  }
}

// If running directly (not imported)
if (require.main === module) {
  listAvailableMarkets()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("\nError:", error.message);
      process.exit(1);
    });
}

export { listAvailableMarkets };
