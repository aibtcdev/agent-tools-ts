import { FaktorySDK } from "@faktoryfun/core-sdk";
import { CONFIG } from "../utilities";
import dotenv from "dotenv";

dotenv.config();

const dexContract = process.argv[2];

if (!dexContract) {
  console.error("\nPlease provide parameters:");
  console.error("bun run src/stacks-faktory/get-token.ts [dexContract]");
  process.exit(1);
}

console.log("\n=== Token Query Parameters ===");
console.log("DEX Contract:", dexContract);
console.log("Network:", CONFIG.NETWORK);

const sdk = new FaktorySDK({
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
});

(async () => {
  try {
    console.log("\n=== Fetching Token ===");
    const token = await sdk.getToken(dexContract);

    console.log("\n=== Response ===");
    console.log(JSON.stringify(token, null, 2));
  } catch (error) {
    console.error("\nError fetching token:", error);
    process.exit(1);
  }
})();
