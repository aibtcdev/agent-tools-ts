import {
  ReadOnlyFunctionOptions,
  callReadOnlyFunction,
  cvToJSON,
} from "@stacks/transactions";
import { CONTRACT_NAME, DEPLOYER } from "../constants";
import { deriveChildAccount } from "../utilities";

// get total resources in contract

// CONFIGURATION

const NETWORK = Bun.env.network;
const MNEMONIC = Bun.env.mnemonic;
const ACCOUNT_INDEX = Bun.env.accountIndex;

const FUNCTION_NAME = "get-total-resources";
const FUNCTION_ARGS = [];

// MAIN SCRIPT (DO NOT EDIT)

async function main() {
  // get account info
  const network = NETWORK;
  const mnemonic = MNEMONIC;
  const accountIndex = ACCOUNT_INDEX;

  // get address from mnemonic
  const { address } = await deriveChildAccount(network, mnemonic, accountIndex);

  const txOptions: ReadOnlyFunctionOptions = {
    contractName: CONTRACT_NAME,
    contractAddress: DEPLOYER,
    functionName: FUNCTION_NAME,
    functionArgs: FUNCTION_ARGS,
    network: network,
    senderAddress: address,
  };

  try {
    const response = await callReadOnlyFunction(txOptions);
    const responseJson = cvToJSON(response);
    const totalResources = responseJson.value;
    console.log(totalResources);
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
