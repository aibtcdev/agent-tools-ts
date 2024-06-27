import {
  Cl,
  ReadOnlyFunctionOptions,
  callReadOnlyFunction,
  cvToJSON,
} from "@stacks/transactions";
import { CONFIG, deriveChildAccount } from "../utilities";
import { DEPLOYER, TOKEN_CONTRACT_NAME } from "../constants";

// get aiBTC balance for current wallet

// CONFIGURATION

const FUNCTION_NAME = "get-balance";

// MAIN SCRIPT (DO NOT EDIT)

async function main() {
  // get account info
  const network = CONFIG.NETWORK;
  const mnemonic = CONFIG.MNEMONIC;
  const accountIndex = CONFIG.ACCOUNT_INDEX;

  // get address from mnemonic
  const { address } = await deriveChildAccount(network, mnemonic, accountIndex);

  const FUNCTION_ARGS = [Cl.principal(address)];

  const txOptions: ReadOnlyFunctionOptions = {
    contractName: TOKEN_CONTRACT_NAME,
    contractAddress: DEPLOYER,
    functionName: FUNCTION_NAME,
    functionArgs: FUNCTION_ARGS,
    network: network,
    senderAddress: address,
  };

  try {
    const response = await callReadOnlyFunction(txOptions);
    const responseJson = cvToJSON(response);
    /*
    example response:
    {
      type: "(response uint UnknownType)",
      value: {
        type: "uint",
        value: "99999000",
      },
      success: true,
    }
    */
    const balance = responseJson.value.value;
    console.log(balance);
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
