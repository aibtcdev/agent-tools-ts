import {
  ClarityValue,
  ReadOnlyFunctionOptions,
  callReadOnlyFunction,
  cvToJSON,
} from "@stacks/transactions";
import { CONTRACT_NAME, DEPLOYER } from "../constants";
import { CONFIG, deriveChildAccount } from "../utilities";

// get total users in contract

// CONFIGURATION

const FUNCTION_NAME = "get-total-users";
const FUNCTION_ARGS: ClarityValue[] = [];

// MAIN SCRIPT (DO NOT EDIT)

async function main() {
  // get account info
  const network = CONFIG.NETWORK;
  const mnemonic = CONFIG.MNEMONIC;
  const accountIndex = CONFIG.ACCOUNT_INDEX;

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
    const totalUsers = responseJson.value;
    console.log(totalUsers);
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
