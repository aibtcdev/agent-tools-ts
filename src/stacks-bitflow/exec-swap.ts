import { BitflowSDK, SwapExecutionData } from "@bitflowlabs/core-sdk";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../utilities";
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

console.log("Slippage:", slippage);
console.log("Amount:", amount);
console.log("TokenX:", tokenX);
console.log("TokenY:", tokenY);

const quote = await bitflow.getQuoteForRoute(tokenX, tokenY, amount);
const bestRoute = quote.bestRoute;

if (!bestRoute) {
  console.log("Unable to find route, exiting.");
  process.exit(1);
}

(async () => {
  try {
    const networkObj = getNetwork(CONFIG.NETWORK);
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const swapExecutionData = {
      route: bestRoute.route,
      amount: amount,
      tokenXDecimals: bestRoute.tokenXDecimals,
      tokenYDecimals: bestRoute.tokenYDecimals,
    };

    const nonce = getNextNonce(CONFIG.NETWORK, address);

    console.log("===== SWAP EXECUTION DATA =====");
    console.log("quoteData: ", swapExecutionData.route.quoteData);
    console.log("swapData: ", swapExecutionData.route.swapData);

    const swapParams = await bitflow.getSwapParams(
      swapExecutionData,
      address,
      slippage
    );

    console.log("===== SWAP PARAMS =====");
    console.log(swapParams);

    const txOptions = {
      contractAddress: swapParams.contractAddress,
      contractName: swapParams.contractName,
      functionName: swapParams.functionName,
      functionArgs: swapParams.functionArgs,
      senderKey: key,
      address,
      networkObj,
      // unwrap promice of the number
      nonce: await nonce,
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

    console.log("===== TRANSACTION OPTIONS =====");
    console.log(txOptions);

    const transaction = await makeContractCall(txOptions);

    console.log("===== TRANSACTION =====");
    console.log(transaction);

    const broadcastResponse = await broadcastTransaction(
      transaction,
      networkObj
    );
    console.log("===== BROADCAST RESPONSE =====");
    console.log(broadcastResponse);

    console.log("Transaction ID:", broadcastResponse.txid);
    console.log(
      `https://explorer.hiro.so/txid/0x${
        broadcastResponse.txid
      }?chain=${CONFIG.NETWORK.toLowerCase()}`
    );
  } catch (error) {
    console.log(error);
  }
})();
