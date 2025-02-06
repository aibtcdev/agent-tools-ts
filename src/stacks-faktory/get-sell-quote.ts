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

const tokenAmount = Number(process.argv[2]);
const dexContract = process.argv[3];
const slippage = Number(process.argv[4]) || 15; // default 15%

/*
console.log("\n=== Sell Quote Parameters ===");
console.log("Token Amount:", tokenAmount);
console.log("DEX Contract:", dexContract);
console.log("Slippage (%):", slippage);
console.log("Network:", network);
*/

if (!tokenAmount || !dexContract) {
  console.error("\nPlease provide all required parameters:");
  console.error(
    "bun run src/stacks-faktory/get-sell-quote.ts <token_amount> <dex_contract> [slippage] [network]"
  );
  process.exit(1);
}

const sdk = new FaktorySDK({
  network: CONFIG.NETWORK,
  hiroApiKey: CONFIG.HIRO_API_KEY,
});

(async () => {
  try {
    const { address } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    // Get quote
    //console.log("\n=== Getting Quote ===");
    const sellQuote = (await sdk.getOut(
      dexContract,
      address,
      tokenAmount
    )) as any;

    //console.log("\n=== Quote Summary ===");
    const contractName = dexContract.split(".")[1];
    const isExternalDex = !contractName.endsWith("faktory-dex");
    const baseContractName = contractName.replace("-dex", "");
    const tokenSymbol = baseContractName.split("-")[0].toUpperCase();

    //console.log(`Input: ${tokenAmount.toLocaleString()} ${tokenSymbol}`);

    // Both internal and external DEX use stx-out
    const rawStxAmount = sellQuote?.value?.value?.["stx-out"]?.value;

    if (rawStxAmount) {
      const slippageFactor = 1 - slippage / 100;
      const stxAmountWithSlippage = Math.floor(
        Number(rawStxAmount) * slippageFactor
      );
      const stxDisplay = stxAmountWithSlippage / 1_000_000; // Convert from microSTX to STX

      /*
      console.log(`Expected Output (with ${slippage}% slippage):`);
      console.log(`${stxDisplay.toLocaleString()} STX`);
      console.log(`\nDEX Contract: ${dexContract}`);
      console.log(`DEX Type: ${isExternalDex ? "External" : "Internal"}`);
      */
    } else {
      console.log("Could not extract STX amount from response");
    }

    // Display raw quote response
    //console.log("\n=== Raw Quote Response ===");
    //console.log(JSON.stringify(sellQuote, replacer, 2));

    // Get sell parameters
    //console.log("\n=== Raw Transaction Parameters ===");
    const sellParams = await sdk.getSellParams({
      dexContract,
      amount: tokenAmount,
      senderAddress: address,
      slippage,
    });
    const result = {
      success: true,
      sellQuote,
      sellParams,
    };
    console.log(JSON.stringify(result, replacer, 2));
  } catch (error) {
    console.error("\nError getting sell quote:", error);
    process.exit(1);
  }
})();
