import { BitflowSDK, SwapExecutionData } from "@bitflowlabs/core-sdk";
import { CONFIG, deriveChildAccount } from "../utilities";

const bitflow = new BitflowSDK({
  BITFLOW_API_HOST: process.env.BITFLOW_API_HOST,
  BITFLOW_API_KEY: process.env.BITFLOW_API_KEY,
  READONLY_CALL_API_HOST: process.env.BITFLOW_READONLY_CALL_API_HOST,
});

const slippage = Number(process.argv[2]) || 0.01; // 1%
const swapExecutionDataString = process.argv[3];

function isSwapExecutionData(data: any): data is SwapExecutionData {
  return (
    typeof data === "object" &&
    data !== null &&
    "route" in data &&
    "amount" in data &&
    "tokenXDecimals" in data &&
    "tokenYDecimals" in data
  );
}

(async () => {
  try {
    const { address } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const swapExecutionData = JSON.parse(swapExecutionDataString);

    if (!isSwapExecutionData(swapExecutionData)) {
      throw new Error("Invalid SwapExecutionData");
    }

    const swapParams = await bitflow.getSwapParams(
      swapExecutionData,
      address,
      slippage
    );

    console.log(swapParams);
  } catch (error) {
    console.log(error);
  }
})();
