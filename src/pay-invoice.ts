// pay a stacks-m2m invoice
// with post-conditions

import {
  AnchorMode,
  Cl,
  FungibleConditionCode,
  PostConditionMode,
  SignedContractCallOptions,
  createSTXPostCondition,
  getNonce,
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
      Cl.buffer(Buffer.from("First test from a script, with post-conditions!")), // memo (optional)
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

  console.log("--------------------------------------------------");
  console.log("Address:", address);
  console.log("--------------------------------------------------");
  console.log("Transaction Options:", txOptions);
}

main();
