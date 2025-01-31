import { FaktorySDK } from "@faktoryfun/core-sdk";
import { CONFIG } from "../utilities";
import dotenv from "dotenv";

dotenv.config();

const tokenContract = process.argv[2];

if (!tokenContract) {
  console.error("\nPlease provide a token contract address:");
  console.error(
    "bun run src/stacks-faktory/get-token-trades.ts [tokenContract]"
  );
  console.error(
    "\nExample: bun run src/stacks-faktory/get-token-trades.ts SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.nothing-faktory"
  );
  process.exit(1);
}

console.log("\n=== Token Trades Query Parameters ===");
console.log("Token Contract:", tokenContract);
console.log("Network:", CONFIG.NETWORK);

const sdk = new FaktorySDK({
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
});

(async () => {
  try {
    // First get token info to get decimals
    const dexContract = `${tokenContract}-dex`;
    const tokenInfo = await sdk.getToken(dexContract);
    const decimals = tokenInfo.data.decimals;

    console.log("\n=== Fetching Token Trades ===");
    const trades = await sdk.getTokenTrades(tokenContract);

    if (trades.success && trades.data.length > 0) {
      console.log("\n=== Trade Statistics ===");
      console.log(`Total trades: ${trades.data.length}`);

      // Get latest trade
      const latestTrade = trades.data[0];
      console.log("\nLatest Trade:");
      console.log({
        timestamp: new Date(latestTrade.timestamp * 1000).toISOString(),
        type: latestTrade.type,
        tokensAmount: latestTrade.tokensAmount / Math.pow(10, decimals),
        stxAmount: latestTrade.ustxAmount / 1_000_000,
        pricePerToken: latestTrade.pricePerToken,
        maker: latestTrade.maker,
      });

      // Calculate some aggregate stats
      const buyTrades = trades.data.filter((t) => t.type === "buy");
      const sellTrades = trades.data.filter((t) => t.type === "sell");

      console.log("\nAggregate Stats:");
      console.log({
        buyCount: buyTrades.length,
        sellCount: sellTrades.length,
        totalVolume:
          trades.data.reduce((acc, t) => acc + t.ustxAmount, 0) / 1_000_000,
        averagePrice:
          trades.data.reduce((acc, t) => acc + t.pricePerToken, 0) /
          trades.data.length,
        totalTokens:
          trades.data.reduce((acc, t) => acc + t.tokensAmount, 0) /
          Math.pow(10, decimals), //
      });

      console.log("\n=== Full Response ===");
      console.log(JSON.stringify(trades, null, 2));
    } else {
      console.log("\nNo trades found for this token");
    }
  } catch (error) {
    console.error("\nError fetching token trades:", error);
    process.exit(1);
  }
})();
