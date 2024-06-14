import {
    ReadOnlyFunctionOptions,
    callReadOnlyFunction,
    cvToJSON,
    ClarityType,
  } from "@stacks/transactions";
  import { BNSX_REGISTRY_CONTRACT_NAME, BNSX_REGISTRY_CONTRACT_ADDRESS } from "../constants";
  import { deriveChildAccount } from "../utilities";
  
  // get address by bnsx name
  
  // CONFIGURATION
  
  const NETWORK = Bun.env.network;
  const MNEMONIC = Bun.env.mnemonic;
  const ACCOUNT_INDEX = Bun.env.accountIndex;
  
  const BNSX_NAME = Bun.env.bnsxName;
  const FUNCTION_NAME = "get-address-by-bnsx";
  const FUNCTION_ARGS = [BNSX_NAME];
  
  // MAIN SCRIPT (DO NOT EDIT)
  
  async function main() {
    // get account info
    const network = NETWORK;
    const mnemonic = MNEMONIC;
    const accountIndex = ACCOUNT_INDEX;
  
    // get address from mnemonic
    const { address } = await deriveChildAccount(network, mnemonic, accountIndex);
  
    const txOptions: ReadOnlyFunctionOptions = {
      contractName: BNSX_REGISTRY_CONTRACT_NAME,
      contractAddress: BNSX_REGISTRY_CONTRACT_ADDRESS,
      functionName: FUNCTION_NAME,
      functionArgs: FUNCTION_ARGS.map(arg => ({ type: ClarityType.StringUtf8, value: arg })),
      network: network,
      senderAddress: address,
    };
  
    try {
      const response = await callReadOnlyFunction(txOptions);
      const responseJson = cvToJSON(response);
      
      if (responseJson.type === "optional" && responseJson.value !== null) {
        const address = responseJson.value.value;
        console.log(address);
      } else {
        console.log("No address found for the given BNSx name.");
      }
    } catch (error) {
      // report error
      console.error(`General/Unexpected Failure: ${error}`);
    }
  }
  
  main();

  // Example usage
const exampleAddress = "SPP3HM2E4JXGT26G1QRWQ2YTR5WT040S5NKXZYFC";
const ADDRESS = exampleAddress;
main();