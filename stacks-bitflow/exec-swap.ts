// import { BitflowSDK } from "bitflow-sdk";

// const bitflow = new BitflowSDK({
//   API_HOST: process.env.BITFLOW_API_HOST,
//   API_KEY: process.env.BITFLOW_API_KEY,
//   STACKS_API_HOST: process.env.BITFLOW_STACKS_API_HOST,
//   READONLY_CALL_API_HOST: process.env.BITFLOW_READONLY_CALL_API_HOST,
// });

// const tokenX = process.argv[2];
// const tokenY = process.argv[3];
// const amount = Number(process.argv[4]);
// const address = process.argv[5];
// const slippage = Number(process.argv[6]) || 0.01; // 1%

// try {
//   const routes = await bitflow.getAllPossibleTokenYRoutes(tokenX, tokenY);
//   console.log(routes);
//   const swapExecutionData = {
//     route: routes[0],
//     amount: amount,
//     tokenXDecimals: routes[0].tokenXDecimals,
//     tokenYDecimals: routes[0].tokenYDecimals,
//   };
//   const senderAddress = address;
//   const slippageTolerance = slippage;

//   await bitflow.executeSwap(
//     swapExecutionData,
//     senderAddress,
//     slippageTolerance,
//     stacksProvider,
//     (data) => console.log("Swap executed:", data),
//     () => console.log("Swap cancelled")
//   );
//   // const routes = await bitflow.getAllPossibleTokenYRoutes(tokenX, tokenY);
//   // console.log(routes);
// } catch (error) {
//   console.log(error);
// }
