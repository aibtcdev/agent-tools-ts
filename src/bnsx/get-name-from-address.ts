import {
    ReadOnlyFunctionOptions,
    callReadOnlyFunction,
    cvToJSON,
    ClarityType,
    standardPrincipalCV,
  } from "@stacks/transactions";
  import { BNSX_REGISTRY_CONTRACT_NAME, BNSX_REGISTRY_CONTRACT_ADDRESS } from "../constants";
  import { deriveChildAccount } from "../utilities";
  
  // get primary name by address
  
  // CONFIGURATION
  
  const NETWORK = Bun.env.network;
  const MNEMONIC = Bun.env.mnemonic;
  const ACCOUNT_INDEX = Bun.env.accountIndex;
  
  const ADDRESS = Bun.env.address;
  const FUNCTION_NAME = "get-primary-name";
  
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
      functionArgs: [standardPrincipalCV(ADDRESS)],
      network: network,
      senderAddress: address,
    };
  
    try {
      const response = await callReadOnlyFunction(txOptions);
      const responseJson = cvToJSON(response);
  
      if (responseJson.type === ClarityType.OptionalSome) {
        const { name, namespace } = responseJson.value.value;
        console.log(`Primary name associated with ${ADDRESS}: ${name}.${namespace}`);
      } else {
        console.log(`No primary name found for address ${ADDRESS}`);
      }
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  }
  
  main();
  
  // Example usage
  const exampleAddress = "SPP3HM2E4JXGT26G1QRWQ2YTR5WT040S5NKXZYFC";
  main();