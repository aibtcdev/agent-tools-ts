import { BitflowSDK, SwapExecutionData } from "@bitflowlabs/core-sdk";
import { CONFIG, deriveChildAccount, getNetwork } from "../utilities";
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
} from "@stacks/transactions";

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

const networkObj = getNetwork(CONFIG.NETWORK);

(async () => {
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

    const swapParams = await bitflow.getSwapParams(
      swapExecutionData,
      address,
      slippage
    );

    const txOptions = {
      contractAddress: swapParams.contractAddress,
      contractName: swapParams.contractName,
      functionName: swapParams.functionName,
      functionArgs: swapParams.functionArgs,
      senderKey: key,
      address,
      networkObj,
      anchorMode: AnchorMode.Any,
      // postConditionMode: PostConditionMode.Allow,
      postConditionMode: PostConditionMode.Deny,
      postConditions: swapParams.postConditions,
      onFinish: (data: any) => {
        console.log("Transaction submitted:", data);
      },
      onCancel: () => {
        console.log("Transaction canceled");
      },
    };

    const transaction = await makeContractCall(txOptions);

    const broadcastResponse = await broadcastTransaction(
      transaction,
      networkObj
    );
    const txId = broadcastResponse.txid;

    console.log(txId);
  } catch (error) {
    console.log(error);
  }
})();
