import { FaktorySDK } from "@faktoryfun/core-sdk";
import { CONFIG, deriveChildAccount } from "../utilities";
import type { NetworkType } from "@faktoryfun/core-sdk";
import { hexToCV, cvToJSON } from "@stacks/transactions";
import dotenv from "dotenv";

dotenv.config();

// Helper function to handle BigInt serialization
function replacer(key: string, value: any) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

const stxAmount = Number(process.argv[2]); // STX amount in standard units
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
    "bun run src/stacks-faktory/get-buy-quote.ts <stx_amount> <dex_contract> [slippage] [network]"
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
    console.log("\n=== Getting Quote ===");
    const buyQuote = (await sdk.getIn(
      dexContract,
      address,
      stxAmount // SDK now handles microSTX conversion
    )) as any;

    console.log("\n=== Quote Summary ===");
    console.log(`Input: ${stxAmount.toLocaleString()} STX`);

    const contractName = dexContract.split(".")[1];
    const isExternalDex = !contractName.endsWith("faktory-dex");
    const baseContractName = contractName.replace("-dex", "");
    const tokenSymbol = baseContractName.split("-")[0].toUpperCase();

    // Get the buyable token amount based on DEX type
    let rawTokenAmount;
    if (isExternalDex) {
      rawTokenAmount = buyQuote?.value?.value?.["buyable-token"]?.value;
    } else {
      rawTokenAmount = buyQuote?.value?.value?.["tokens-out"]?.value;
    }

    if (rawTokenAmount) {
      const slippageFactor = 1 - slippage / 100;
      const tokenAmountWithSlippage = Math.floor(
        Number(rawTokenAmount) * slippageFactor
      );

      // Convert from micro units to actual token amount (divide by 10^6)
      const actualTokenAmount = tokenAmountWithSlippage / 1_000_000;

      console.log(`Expected Output (with ${slippage}% slippage):`);
      console.log(`${actualTokenAmount.toLocaleString()} ${tokenSymbol}`);
      console.log(`\nDEX Contract: ${dexContract}`);
      console.log(`DEX Type: ${isExternalDex ? "External" : "Internal"}`);
    } else {
      console.log("Could not extract token amount from response");
    }

    // Display raw quote response
    console.log("\n=== Raw Quote Response ===");
    console.log(JSON.stringify(buyQuote, replacer, 2));

    // Get buy parameters
    console.log("\n=== Raw Transaction Parameters ===");
    const buyParams = await sdk.getBuyParams({
      dexContract,
      stx: stxAmount, // Changed from ustx to stx
      senderAddress: address,
      slippage,
    });
    console.log(JSON.stringify(buyParams, replacer, 2));
  } catch (error) {
    console.error("\nError getting buy quote:", error);
    process.exit(1);
  }
})();
