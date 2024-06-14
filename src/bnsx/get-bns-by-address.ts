import {
    Cl,
    ReadOnlyFunctionOptions,
    callReadOnlyFunction,
    cvToJSON,
    standardPrincipalCV,
  } from "@stacks/transactions";
  import { BNS_CONTRACT_NAME, BNS_CONTRACT_ADDRESS } from "../constants";
  import { deriveChildAccount } from "../utilities";
  
  // CONFIGURATION
  
  const NETWORK = Bun.env.network;
  const MNEMONIC = Bun.env.mnemonic;
  const ACCOUNT_INDEX = Bun.env.accountIndex;
  
  const USER_ADDRESS = Bun.env.userAddress;
  const FUNCTION_NAME = "resolve-principal";
  const FUNCTION_ARGS = [standardPrincipalCV(USER_ADDRESS)];
  
  // MAIN SCRIPT
  
  async function main() {
    // get account info
    const network = NETWORK;
    const mnemonic = MNEMONIC;
    const accountIndex = ACCOUNT_INDEX;
  
    // get address from mnemonic
    const { address } = await deriveChildAccount(network, mnemonic, accountIndex);
  
    const txOptions: ReadOnlyFunctionOptions = {
      contractName: BNS_CONTRACT_NAME,
      contractAddress: BNS_CONTRACT_ADDRESS,
      functionName: FUNCTION_NAME,
      functionArgs: FUNCTION_ARGS,
      network: network,
      senderAddress: address,
    };
  
    try {
      const response = await callReadOnlyFunction(txOptions);
      const responseJson = cvToJSON(response);
      const bnsName = responseJson.value.name.value;
  
      if (bnsName) {
        console.log(bnsName);
      } else {
        console.log("No BNS name found for the given address.");
      }
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  }
  
  main();