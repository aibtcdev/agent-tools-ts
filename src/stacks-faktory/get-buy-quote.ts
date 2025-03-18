import { FaktorySDK } from "@faktoryfun/core-sdk";
import {
  CONFIG,
  deriveChildAccount,
  replaceBigintWithString,
} from "../utilities";
import type { NetworkType } from "@faktoryfun/core-sdk";
import { hexToCV, cvToJSON } from "@stacks/transactions";
import dotenv from "dotenv";

dotenv.config();

const btcAmount = Number(process.argv[2]); // BTC amount in normal units
const dexContract = process.argv[3];
const slippage = Number(process.argv[4]) || 15; // default 15%

//console.log("\n=== Buy Quote Parameters ===");
//console.log("STX Amount:", stxAmount);
//console.log("DEX Contract:", dexContract);
//console.log("Slippage (%):", slippage);
//console.log("Network:", network);

if (!btcAmount || !dexContract) {
  console.error("\nPlease provide all required parameters:");
  console.error(
    "bun run src/stacks-faktory/get-buy-quote-btc.ts <btc_amount> <dex_contract> [slippage]"
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

    // Check token denomination
    console.log("Checking token denomination...");
    const tokenInfo = await sdk.getToken(dexContract);
    const isBtcDenominated = tokenInfo.data.denomination === "btc";

    // Verify the token is BTC denominated
    if (!isBtcDenominated) {
      throw new Error(
        `Token ${dexContract} is not BTC denominated. Use get-buy-quote-stx.ts for STX denominated tokens.`
      );
    }

    // console.log(
    //   `Token is BTC denominated. Using ${btcAmount} BTC (${
    //     btcAmount * 100000000
    //   } satoshis)`
    // );

    // Get quote
    const buyQuote = (await sdk.getIn(
      dexContract,
      address,
      btcAmount // SDK now handles conversion
    )) as any;

    //console.log("\n=== Quote Summary ===");
    //console.log(`Input: ${stxAmount.toLocaleString()} STX`);

    const contractName = dexContract.split(".")[1];
    const baseContractName = contractName.replace("-dex", "");
    const tokenSymbol = baseContractName.split("-")[0].toUpperCase();

    // Get the tokens amount
    const rawTokenAmount = buyQuote?.value?.value?.["tokens-out"]?.value;

    if (rawTokenAmount) {
      const slippageFactor = 1 - slippage / 100;
      const tokenAmountWithSlippage = Math.floor(
        Number(rawTokenAmount) * slippageFactor
      );

      // Convert from micro units to actual token amount
      const actualTokenAmount =
        tokenAmountWithSlippage / Math.pow(10, tokenInfo.data.decimals);

      //console.log(`Expected Output (with ${slippage}% slippage):`);
      //console.log(`${actualTokenAmount.toLocaleString()} ${tokenSymbol}`);
      //console.log(`\nDEX Contract: ${dexContract}`);
    } else {
      console.log("Could not extract token amount from response");
    }

    // Display raw quote response
    //console.log("\n=== Raw Quote Response ===");
    //console.log(JSON.stringify(buyQuote, replacer, 2));

    // Get buy parameters
    //console.log("\n=== Raw Transaction Parameters ===");
    const buyParams = await sdk.getBuyParams({
      dexContract,
      inAmount: btcAmount, // Updated from stx to inAmount
      senderAddress: address,
      slippage,
    });

    const result = {
      success: true,
      buyQuote,
      buyParams,
    };

    console.log(JSON.stringify(result, replaceBigintWithString, 2));
  } catch (error) {
    console.error("\nError getting buy quote:", error);
    process.exit(1);
  }
})();
