import { FaktorySDK } from "@faktoryfun/core-sdk";
import { CONFIG } from "../utilities";
import dotenv from "dotenv";

dotenv.config();

const page = Number(process.argv[2]) || 1;
const limit = Number(process.argv[3]) || 10;
const search = process.argv[4];
const sortOrder = process.argv[5];

if (!page) {
  console.error("\nPlease provide parameters:");
  console.error(
    "bun run src/stacks-faktory/get-dao-tokens.ts [page] [limit] [search] [sortOrder]"
  );
  process.exit(1);
}

/*
console.log("\n=== DAO Query Parameters ===");
console.log("Page:", page);
console.log("Limit:", limit);
console.log("Search term:", search || "none");
console.log("Sort order:", sortOrder || "default");
console.log("Network:", CONFIG.NETWORK);
*/

const sdk = new FaktorySDK({
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
});

(async () => {
  try {
    //console.log("\n=== Fetching DAO Tokens ===");
    const daoTokens = await sdk.getDaoTokens({
      page,
      limit,
      search,
      sortOrder,
    });

    //console.log("\n=== Response ===");
    const result = {
      success: true,
      daoTokens,
    };
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("\nError fetching DAO tokens:", error);
    process.exit(1);
  }
})();
