import { FaktorySDK } from "@faktoryfun/core-sdk";
import {
  makeContractCall,
  broadcastTransaction,
  SignedContractCallOptions,
  ClarityValue,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../utilities";
import dotenv from "dotenv";

dotenv.config();

const stxAmount = Number(process.argv[2]); // STX amount in normal units
const dexContract = process.argv[3];
const slippage = Number(process.argv[4]) || 15; // default 15%

console.log("STX Amount:", stxAmount);
console.log("DEX Contract:", dexContract);
console.log("Slippage (%):", slippage);

if (!stxAmount || !dexContract) {
  console.error("Please provide all required parameters:");
  console.error(
    "ts-node src/faktory/exec-buy.ts <stx_amount> <dex_contract> [slippage]"
  );
  process.exit(1);
}

const faktoryConfig = {
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
};

(async () => {
  try {
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const sdk = new FaktorySDK(faktoryConfig);
    const networkObj = getNetwork(CONFIG.NETWORK);
    const nonce = await getNextNonce(CONFIG.NETWORK, address);

    // Get quote first for preview
    console.log("\nGetting quote...");
    const inQuote = await sdk.getIn(dexContract, address, stxAmount); // No need to multiply by 1000000
    console.log("Quote:", JSON.stringify(inQuote, null, 2));

    // Get buy parameters
    console.log("\nGetting buy parameters...");
    const buyParams = await sdk.getBuyParams({
      dexContract,
      stx: stxAmount, // Changed from ustx, no need to multiply
      senderAddress: address,
      slippage,
    });

    // Add required properties for signing
    const txOptions: SignedContractCallOptions = {
      ...buyParams,
      senderKey: key,
      validateWithAbi: true,
      fee: 30000,
      nonce,
      functionArgs: buyParams.functionArgs as ClarityValue[],
    };

    // Create and broadcast transaction
    console.log("\nCreating and broadcasting transaction...");
    const tx = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(tx, networkObj);

    console.log("\nTransaction broadcast successfully!");
    console.log("Transaction ID:", broadcastResponse.txid);
    console.log(
      "View transaction: https://explorer.hiro.so/txid/" +
        broadcastResponse.txid +
        "?chain=" +
        CONFIG.NETWORK
    );
  } catch (error) {
    console.error("Error executing buy transaction:", error);
    process.exit(1);
  }
})();
