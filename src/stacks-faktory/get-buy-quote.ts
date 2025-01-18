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

const stxAmount = Number(process.argv[2]);
const dexContract = process.argv[3];
const slippage = Number(process.argv[4]) || 15; // default 15%
const network = (process.argv[5] || CONFIG.NETWORK || "mainnet") as NetworkType;

console.log("\n=== Buy Quote Parameters ===");
console.log("STX Amount:", stxAmount);
console.log("DEX Contract:", dexContract);
console.log("Slippage (%):", slippage);
console.log("Network:", network);

if (!stxAmount || !dexContract) {
  console.error("\nPlease provide all required parameters:");
  console.error(
    "bun run src/faktory/get-buy-quote.ts <stx_amount> <dex_contract> [slippage] [network]"
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
    const buyQuote = await sdk.getIn(
      dexContract,
      address,
      stxAmount * 1000000 // Convert to microSTX
    );
    console.log(JSON.stringify(buyQuote, replacer, 2));

    // Get buy parameters
    console.log("\n=== Raw Transaction Parameters ===");
    const buyParams = await sdk.getBuyParams({
      dexContract,
      ustx: stxAmount * 1000000,
      senderAddress: address,
      slippage,
    });
    console.log(JSON.stringify(buyParams, replacer, 2));
  } catch (error) {
    console.error("\nError getting buy quote:", error);
    process.exit(1);
  }
})();
