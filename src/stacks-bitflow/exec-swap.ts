import { BitflowSDK, SwapExecutionData } from "bitflow-sdk";
import { CONFIG, deriveChildAccount } from "../utilities";

const bitflow = new BitflowSDK({
  API_HOST: process.env.BITFLOW_API_HOST,
  API_KEY: process.env.BITFLOW_API_KEY,
  STACKS_API_HOST: process.env.BITFLOW_STACKS_API_HOST,
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

try {
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const swapExecutionData = JSON.parse(swapExecutionDataString);

  if (!isSwapExecutionData(swapExecutionData)) {
    throw new Error("Invalid SwapExecutionData");
  }

  await bitflow.executeSwap(
    swapExecutionData as SwapExecutionData,
    address,
    slippage,
    undefined,
    (data) => console.log("Swap executed:", data),
    () => console.log("Swap cancelled")
  );
} catch (error) {
  console.log(error);
}
