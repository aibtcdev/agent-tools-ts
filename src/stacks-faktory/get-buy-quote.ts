import { FaktorySDK } from "@faktoryfun/core-sdk";
import { CONFIG, deriveChildAccount, getNetwork } from "../utilities";

const stxAmount = Number(process.argv[2]);
const dexContract = process.argv[3];
const slippage = Number(process.argv[4]) || 15; // default 15%

console.log("STX Amount:", stxAmount);
console.log("DEX Contract:", dexContract);
console.log("Slippage (%):", slippage);

if (!stxAmount || !dexContract) {
  console.error("Please provide all required parameters:");
  console.error(
    "ts-node src/faktory/get-buy-quote.ts <stx_amount> <dex_contract> [slippage]"
  );
  process.exit(1);
}

const faktoryConfig = {
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
};

(async () => {
  try {
    const { address } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const sdk = new FaktorySDK(faktoryConfig);

    // First get the quote
    const buyQuote = await sdk.getIn(
      dexContract,
      address,
      stxAmount * 1000000 // Convert to microSTX
    );

    console.log("Buy Quote:", JSON.stringify(buyQuote, null, 2));

    // Then get the full buy parameters
    const buyParams = await sdk.getBuyParams({
      dexContract,
      ustx: stxAmount * 1000000,
      senderAddress: address,
      slippage,
    });

    console.log("Buy Parameters:", JSON.stringify(buyParams, null, 2));
  } catch (error) {
    console.error("Error getting buy quote:", error);
    process.exit(1);
  }
})();
