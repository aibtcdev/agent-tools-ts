import {
  Cl,
  ReadOnlyFunctionOptions,
  callReadOnlyFunction,
  cvToJSON,
} from "@stacks/transactions";
import { CONTRACT_NAME, DEPLOYER } from "../constants";
import { CONFIG, deriveChildAccount } from "../utilities";
import { ResourceData } from "../types";

// get resource info by name

// CONFIGURATION

const RESOURCE_NAME = "bitcoin-face";
const FUNCTION_NAME = "get-resource-by-name";
const FUNCTION_ARGS = [Cl.stringUtf8(RESOURCE_NAME)];

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
    /*
    example response:
    {
      type: "(optional (tuple (createdAt uint) (description (string-utf8 52)) (enabled bool) (name (string-utf8 12)) (price uint) (totalSpent uint) (totalUsed uint)))",
      value: {
        type: "(tuple (createdAt uint) (description (string-utf8 52)) (enabled bool) (name (string-utf8 12)) (price uint) (totalSpent uint) (totalUsed uint))",
        value: {
          createdAt: [Object ...],
          description: [Object ...],
          enabled: [Object ...],
          name: [Object ...],
          price: [Object ...],
          totalSpent: [Object ...],
          totalUsed: [Object ...],
        },
      },
    }
    */
    const resource = responseJson.value.value;
    /*
    example resource data:
    {
      "createdAt": {
        "type": "uint",
        "value": "148069"
      },
      "description": {
        "type": "(string-utf8 52)",
        "value": "Generates a Bitcoin face based on the supplied data."
      },
      "enabled": {
        "type": "bool",
        "value": true
      },
      "name": {
        "type": "(string-utf8 12)",
        "value": "bitcoin-face"
      },
      "price": {
        "type": "uint",
        "value": "1000"
      },
      "totalSpent": {
        "type": "uint",
        "value": "3000"
      },
      "totalUsed": {
        "type": "uint",
        "value": "3"
      }
    }
    */
    const resourceData: ResourceData = {
      createdAt: parseInt(resource.createdAt.value),
      description: resource.description.value,
      enabled: resource.enabled.value,
      name: resource.name.value,
      price: parseInt(resource.price.value),
      totalSpent: parseInt(resource.totalSpent.value),
      totalUsed: parseInt(resource.totalUsed.value),
    };
    console.log(JSON.stringify(resourceData, null, 2));
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
