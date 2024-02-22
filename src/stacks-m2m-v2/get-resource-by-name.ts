import {
  Cl,
  ReadOnlyFunctionOptions,
  callReadOnlyFunction,
  cvToJSON,
} from "@stacks/transactions";
import { CONTRACT_NAME, DEPLOYER } from "../constants";
import { deriveChildAccount } from "../utilities";

// get resource info by name

// CONFIGURATION

const NETWORK = Bun.env.network;
const MNEMONIC = Bun.env.mnemonic;
const ACCOUNT_INDEX = Bun.env.accountIndex;

const RESOURCE_NAME = "bitcoin-face";
const FUNCTION_NAME = "get-resource-by-name";
const FUNCTION_ARGS = [Cl.stringUtf8(RESOURCE_NAME)];

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
    console.log(cvToJSON(response));
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
