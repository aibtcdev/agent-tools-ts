import { FaktorySDK } from "@faktoryfun/core-sdk";
import { CONFIG, deriveChildAccount } from "../utilities";
import type { NetworkType } from "@faktoryfun/core-sdk";
import dotenv from "dotenv";

dotenv.config();

// Helper function to handle BigInt serialization
function replacer(key: string, value: any) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

const tokenAmount = Number(process.argv[2]);
const dexContract = process.argv[3];
const slippage = Number(process.argv[4]) || 15; // default 15%
const network = (process.argv[5] || CONFIG.NETWORK || "mainnet") as NetworkType;

console.log("\n=== Sell Quote Parameters ===");
console.log("Token Amount:", tokenAmount);
console.log("DEX Contract:", dexContract);
console.log("Slippage (%):", slippage);
console.log("Network:", network);

if (!tokenAmount || !dexContract) {
  console.error("\nPlease provide all required parameters:");
  console.error(
    "bun run src/faktory/get-sell-quote.ts <token_amount> <dex_contract> [slippage] [network]"
  );
  process.exit(1);
}

const sdk = new FaktorySDK({
  network,
  hiroApiKey: CONFIG.HIRO_API_KEY,
});

(async () => {
  try {
    const { address } = await deriveChildAccount(
      network,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    // Get quote
    console.log("\n=== Raw Quote Response ===");
    const sellQuote = await sdk.getOut(dexContract, address, tokenAmount);
    console.log(JSON.stringify(sellQuote, replacer, 2));

    // Get sell parameters
    console.log("\n=== Raw Transaction Parameters ===");
    const sellParams = await sdk.getSellParams({
      dexContract,
      amount: tokenAmount,
      senderAddress: address,
      slippage,
    });
    console.log(JSON.stringify(sellParams, replacer, 2));
  } catch (error) {
    console.error("\nError getting sell quote:", error);
    process.exit(1);
  }
})();
