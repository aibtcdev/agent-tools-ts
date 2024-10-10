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
const amount = Number(process.argv[3]);
const tokenX = process.argv[4];
const tokenY = process.argv[5];
const routes = await bitflow.getAllPossibleTokenYRoutes(tokenX, tokenY);
const networkObj = getNetwork(CONFIG.NETWORK);

const tokens = await bitflow.getAvailableTokens();

let tokenXDecimals: number | undefined;
let tokenYDecimals: number | undefined;

// Loop over the available tokens to find decimals for tokenX and tokenY
for (const token of tokens) {
  if (token.tokenId === tokenX) {
    tokenXDecimals = token.tokenDecimals;
  }
  if (token.tokenId === tokenY) {
    tokenYDecimals = token.tokenDecimals;
  }
  // If both decimals are found, no need to continue the loop
  if (tokenXDecimals !== undefined && tokenYDecimals !== undefined) {
    break;
  }
}

if (tokenXDecimals === undefined || tokenYDecimals === undefined) {
  console.error("Could not find decimals for one or both tokens.");
} else {
  console.log(`Decimals for ${tokenX}: ${tokenXDecimals}`);
  console.log(`Decimals for ${tokenY}: ${tokenYDecimals}`);
}

(async () => {
  try {
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const swapExecutionData = {
      route: routes[0],
      amount: amount,
      tokenXDecimals: Number(tokenXDecimals),
      tokenYDecimals: Number(tokenYDecimals),
    };

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
