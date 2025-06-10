// // exec-claim.ts
// import { FaktorySDK } from "@faktoryfun/core-sdk";
// import {
//   makeContractCall,
//   broadcastTransaction,
//   SignedContractCallOptions,
//   ClarityValue,
// } from "@stacks/transactions";
// import {
//   CONFIG,
//   deriveChildAccount,
//   getNetwork,
//   getNextNonce,
// } from "../utilities";
// import dotenv from "dotenv";

// dotenv.config();

// const prelaunchContract = process.argv[2]; // Pre-launch contract address
// const tokenContract = process.argv[3]; // Token contract address

// if (!prelaunchContract || !tokenContract) {
//   console.error("Please provide all required parameters:");
//   console.error(
//     "bun run src/stacks-faktory/exec-claim.ts <prelaunch_contract> <token_contract>"
//   );
//   console.error(
//     "Example: bun run src/stacks-faktory/exec-claim.ts SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-pre-faktory SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-faktory"
//   );
//   process.exit(1);
// }

// const faktoryConfig = {
//   network: CONFIG.NETWORK as "mainnet" | "testnet",
//   hiroApiKey: CONFIG.HIRO_API_KEY,
// };

// (async () => {
//   try {
//     const { address, key } = await deriveChildAccount(
//       CONFIG.NETWORK,
//       CONFIG.MNEMONIC,
//       CONFIG.ACCOUNT_INDEX
//     );

//     const sdk = new FaktorySDK(faktoryConfig);
//     const networkObj = getNetwork(CONFIG.NETWORK);
//     const nonce = await getNextNonce(CONFIG.NETWORK, address);

//     // Get pre-launch status first
//     // console.log("\nGetting user info...");
//     // const status = await sdk.getPrelaunchStatus(prelaunchContract, address);
//     // const claimableAmount = Number(status.userInfo.value.value["claimable-amount"].value);
//     // const seatsOwned = Number(status.userInfo.value.value["seats-owned"].value);

//     // console.log("Seats owned:", seatsOwned);
//     // console.log("Claimable amount:", claimableAmount);

//     // if (claimableAmount === 0) {
//     //   console.log("No tokens available to claim yet.");
//     //   process.exit(0);
//     // }

//     // Get claim parameters
//     console.log("\nPreparing claim transaction...");
//     const claimParams = await sdk.getClaimParams({
//       prelaunchContract,
//       tokenContract,
//       senderAddress: address,
//     });

//     // Add required properties for signing
//     const txOptions: SignedContractCallOptions = {
//       ...claimParams,
//       senderKey: key,
//       validateWithAbi: true,
//       fee: 50000,
//       nonce,
//       functionArgs: claimParams.functionArgs as ClarityValue[],
//     };

//     // Create and broadcast transaction
//     console.log("\nCreating and broadcasting transaction...");
//     const tx = await makeContractCall(txOptions);
//     const broadcastResponse = await broadcastTransaction(tx, networkObj);

//     const result = {
//       success: broadcastResponse.txid ? true : false,
//       message: "Claim transaction broadcast successfully!",
//       txid: broadcastResponse.txid,
//       claimedAmount: claimParams.claimableAmount,
//       seatsOwned: claimParams.seatsOwned,
//     };

//     console.log(JSON.stringify(result, null, 2));
//   } catch (error) {
//     console.error("Error executing claim transaction:", error);
//     process.exit(1);
//   }
// })();
