import { FaktorySDK } from "@faktoryfun/core-sdk";
import { CONFIG, deriveChildAccount } from "../utilities";
import { cvToJSON } from "@stacks/transactions";
import dotenv from "dotenv";

dotenv.config();

// Helper function to handle BigInt serialization
function replacer(key: string, value: any) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

const stxAmount = Number(process.argv[2]); // STX amount in normal units
const dexContract = process.argv[3];
const slippage = Number(process.argv[4]) || 15; // default 15%

if (!stxAmount || !dexContract) {
  console.error("\nPlease provide all required parameters:");
  console.error(
    "bun run src/stacks-faktory/get-buy-quote-stx.ts <stx_amount> <dex_contract> [slippage]"
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

    // Verify the token is STX denominated
    if (isBtcDenominated) {
      throw new Error(
        `Token ${dexContract} is BTC denominated. Use get-buy-quote-btc.ts for BTC denominated tokens.`
      );
    }

    // console.log(
    //   `Token is STX denominated. Using ${stxAmount} STX (${
    //     stxAmount * 1000000
    //   } microSTX)`
    // );

    // Get quote
    const buyQuote = (await sdk.getIn(
      dexContract,
      address,
      stxAmount // SDK handles conversion
    )) as any;

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

      // Convert from micro units to actual token amount (based on decimals)
      const actualTokenAmount =
        tokenAmountWithSlippage / Math.pow(10, tokenInfo.data.decimals);

      console.log(`Expected Output (with ${slippage}% slippage):`);
      console.log(`${actualTokenAmount.toLocaleString()} ${tokenSymbol}`);
    } else {
      console.log("Could not extract token amount from response");
    }

    // Get buy parameters
    const buyParams = await sdk.getBuyParams({
      dexContract,
      inAmount: stxAmount, // Updated from stx to inAmount
      senderAddress: address,
      slippage,
    });

    const result = {
      success: true,
      buyQuote,
      buyParams,
    };

    console.log(JSON.stringify(result, replacer, 2));
  } catch (error) {
    console.error("\nError getting buy quote:", error);
    process.exit(1);
  }
})();
