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

const tokenAmount = Number(process.argv[2]); // token amount in standard units (e.g., 1.5 tokens)
const dexContract = process.argv[3];
const slippage = Number(process.argv[4]) || 15; // default 15%

//console.log("Token Amount:", tokenAmount);
//console.log("DEX Contract:", dexContract);
//console.log("Slippage (%):", slippage);

if (!tokenAmount || !dexContract) {
  console.error("Please provide all required parameters:");
  console.error(
    "ts-node src/faktory/exec-sell.ts <token_amount> <dex_contract> [slippage]"
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

    // Get quote first for preview (SDK handles decimal conversion internally)
    //console.log("\nGetting quote for selling tokens...");
    const outQuote = await sdk.getOut(dexContract, address, tokenAmount);
    //console.log("Quote:", JSON.stringify(outQuote, null, 2));

    // Get sell parameters (SDK handles decimal conversion internally)
    //console.log("\nGetting sell parameters...");
    const sellParams = await sdk.getSellParams({
      dexContract,
      amount: tokenAmount,
      senderAddress: address,
      slippage,
    });

    // Add required properties for signing
    const txOptions: SignedContractCallOptions = {
      ...sellParams,
      senderKey: key,
      validateWithAbi: true,
      fee: 30000,
      nonce,
      functionArgs: sellParams.functionArgs as ClarityValue[],
    };

    // Create and broadcast transaction
    //console.log("\nCreating and broadcasting transaction...");
    const tx = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(tx, networkObj);

    const result = {
      success: broadcastResponse.txid ? true : false,
      message: "Transaction broadcast successfully!",
      txid: broadcastResponse.txid,
    };

    console.log(JSON.stringify(result, null, 2));
    /*
    console.log("\nTransaction broadcast successfully!");
    console.log("Transaction ID:", broadcastResponse.txid);
    console.log(
      "View transaction: https://explorer.hiro.so/txid/" +
        broadcastResponse.txid +
        "?chain=" +
        CONFIG.NETWORK
    );
    */
  } catch (error) {
    console.error("Error executing sell transaction:", error);
    process.exit(1);
  }
})();
