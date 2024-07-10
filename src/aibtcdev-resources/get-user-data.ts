import {
  ReadOnlyFunctionOptions,
  callReadOnlyFunction,
  cvToJSON,
  Cl,
} from "@stacks/transactions";
import { CONFIG, deriveChildAccount } from "../utilities";
import { CONTRACT_NAME, DEPLOYER } from "../constants";
import { UserData } from "../types";

// get user data in contract
// param: user ID

// CONFIGURATION

const FUNCTION_NAME = "get-user-data";

// MAIN SCRIPT (DO NOT EDIT)

async function main() {
  // get account info
  const network = CONFIG.NETWORK;
  const mnemonic = CONFIG.MNEMONIC;
  const accountIndex = CONFIG.ACCOUNT_INDEX;

  // get address from mnemonic
  const { address: senderAddress } = await deriveChildAccount(
    network,
    mnemonic,
    accountIndex
  );

  // expect user ID as first argument
  // or default to configured wallet
  let userId = process.argv[2];
  if (!userId) {
    console.error(
      "No user ID provided, it can be obtained with get-user-index."
    );
  }
  const FUNCTION_ARGS = [Cl.uint(userId)];

  const txOptions: ReadOnlyFunctionOptions = {
    contractName: CONTRACT_NAME,
    contractAddress: DEPLOYER,
    functionName: FUNCTION_NAME,
    functionArgs: FUNCTION_ARGS,
    network: network,
    senderAddress: senderAddress,
  };

  try {
    const response = await callReadOnlyFunction(txOptions);
    const responseJson = cvToJSON(response);
    /*
    example response:
    {
      type: "(optional (tuple (address principal) (totalSpent uint) (totalUsed uint)))",
      value: {
        type: "(tuple (address principal) (totalSpent uint) (totalUsed uint))",
        value: {
          address: [Object ...],
          totalSpent: [Object ...],
          totalUsed: [Object ...],
        },
      },
    }
    */
    const user = responseJson.value.value;
    /*
    example user data:
    {
      address: {
        type: "principal",
        value: "ST2HQ5J6RP8HSQE9KKGWCHW9PT9SVE4TDGBZQ3EKR",
      },
      totalSpent: {
        type: "uint",
        value: "1000",
      },
      totalUsed: {
        type: "uint",
        value: "1",
      },
    }
    */
    const userData: UserData = {
      address: user.address.value,
      totalSpent: parseInt(user.totalSpent.value),
      totalUsed: parseInt(user.totalUsed.value),
    };
    console.log(userData);
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
