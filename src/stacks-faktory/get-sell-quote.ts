import { FaktorySDK } from "@faktoryfun/core-sdk";
import { CONFIG, deriveChildAccount } from "../utilities";
import dotenv from "dotenv";

dotenv.config();

const tokenAmount = Number(process.argv[2]);
const dexContract = process.argv[3];
const slippage = Number(process.argv[4]) || 15; // default 15%
const forcedNetwork = process.argv[5] || "mainnet"; // Allow network override via command line

console.log("\nGetting sell quote with parameters:");
console.log("Token Amount:", tokenAmount);
console.log("DEX Contract:", dexContract);
console.log("Slippage (%):", slippage);
console.log("Network:", forcedNetwork);

if (!tokenAmount || !dexContract) {
  console.error("Please provide all required parameters:");
  console.error(
    "ts-node src/faktory/get-sell-quote.ts <token_amount> <dex_contract> [slippage] [network]"
  );
  process.exit(1);
}

const sdk = new FaktorySDK({
  network: "mainnet", // Force mainnet
  apiHost: "https://faktory-be.vercel.app/api", // Force mainnet API
  hiroApiKey: CONFIG.HIRO_API_KEY,
});

(async () => {
  try {
    const { address } = await deriveChildAccount(
      forcedNetwork, // Pass the network to deriveChildAccount
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    // First get the quote
    console.log("\nGetting quote...");
    const sellQuote = await sdk.getOut(dexContract, address, tokenAmount);

    console.log("\nSell Quote:");
    console.log(JSON.stringify(sellQuote, null, 2));

    // Then get the full sell parameters
    console.log("\nGetting sell parameters...");
    const sellParams = await sdk.getSellParams({
      dexContract,
      amount: tokenAmount,
      senderAddress: address,
      slippage,
    });

    console.log("\nSell Parameters:");
    console.log(JSON.stringify(sellParams, null, 2));
  } catch (error) {
    console.error("Error getting sell quote:", error);
    process.exit(1);
  }
})();
