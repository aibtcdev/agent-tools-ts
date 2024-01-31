// pay a stacks-m2m invoice
// with post-conditions

import {
  AnchorMode,
  Cl,
  FungibleConditionCode,
  PostConditionMode,
  SignedContractCallOptions,
  broadcastTransaction,
  createSTXPostCondition,
  getNonce,
  makeContractCall,
} from "@stacks/transactions";

import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  DEFAULT_FEE,
  RESOURCE_NAME,
  RESOURCE_PRICE,
} from "./constants";
import { deriveChildAccount } from "./utilities";

async function main() {
  // get account info from env
  const network = Bun.env.network;
  const mnemonic = Bun.env.mnemonic;
  const accountIndex = Bun.env.accountIndex;

  // get account address and private key
  const { address, key } = await deriveChildAccount(
    network,
    mnemonic,
    accountIndex
  );

  // get the current nonce for the account
  const nonce = await getNonce(address, network);

  // create the pay-invoice transaction
  const txOptions: SignedContractCallOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "pay-invoice-by-resource-name",
    functionArgs: [
      Cl.stringUtf8(RESOURCE_NAME),
      Cl.none(), // memo (optional)
    ],
    fee: DEFAULT_FEE,
    nonce: nonce,
    network: network,
    senderKey: key,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      createSTXPostCondition(
        address,
        FungibleConditionCode.Equal,
        RESOURCE_PRICE
      ),
    ],
  };

  try {
    // create and broadcast transaction
    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);

    // handle error in response
    if ("error" in broadcastResponse) {
      console.error("Transaction failed to broadcast");
      console.error(`Error: ${broadcastResponse.error}`);
      if (broadcastResponse.reason) {
        console.error(`Reason: ${broadcastResponse.reason}`);
      }
      if (broadcastResponse.reason_data) {
        console.error(
          `Reason Data: ${JSON.stringify(
            broadcastResponse.reason_data,
            null,
            2
          )}`
        );
      }
    } else {
      // report successful result
      console.log("Transaction broadcasted successfully!");
      console.log(`TXID: 0x${broadcastResponse.txid}`);
    }
  } catch (error) {
    // report error
    console.error(`General Failure: ${error}`);
  }
}

main();
