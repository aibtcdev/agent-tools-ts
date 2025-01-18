import { FaktorySDK } from "@faktoryfun/core-sdk";
import { CONFIG } from "../utilities";
import dotenv from "dotenv";

dotenv.config();

const page = Number(process.argv[2]) || 1;
const limit = Number(process.argv[3]) || 10;
const search = process.argv[4];
const sortOrder = process.argv[5];
const forcedNetwork = process.argv[6] || "mainnet"; // Allow network override via command line

console.log("\nQuerying DAO tokens with parameters:");
console.log("Page:", page);
console.log("Limit:", limit);
console.log("Search term:", search || "none");
console.log("Sort order:", sortOrder || "default");

// Force mainnet by default, ignore CONFIG.NETWORK unless explicitly overridden
const network = forcedNetwork as "mainnet" | "testnet";
console.log("Network:", network);

const sdk = new FaktorySDK({
  network: "mainnet", // Force mainnet
  apiHost: "https://faktory-be.vercel.app/api", // Force mainnet API
});

(async () => {
  try {
    console.log("\nFetching DAO tokens...");
    const daoTokens = await sdk.getDaoTokens({
      page,
      limit,
      search,
      sortOrder,
    });

    console.log("\nResponse:");
    console.log("DAO Tokens:", JSON.stringify(daoTokens, null, 2));
  } catch (error) {
    console.error("Error fetching DAO tokens:", error);
    process.exit(1);
  }
})();
