import {
    ReadOnlyFunctionOptions,
    callReadOnlyFunction,
    cvToJSON,
    ClarityType,
    bufferCV,
    tupleCV,
  } from "@stacks/transactions";
  import { BNSX_REGISTRY_CONTRACT_NAME, BNSX_REGISTRY_CONTRACT_ADDRESS } from "../constants";
  import { deriveChildAccount } from "../utilities";
  
  // get address by name
  
  // CONFIGURATION
  
  const NETWORK = Bun.env.network;
  const MNEMONIC = Bun.env.mnemonic;
  const ACCOUNT_INDEX = Bun.env.accountIndex;
  
  const BNS_NAME = Bun.env.bnsName;
  const FUNCTION_NAME = "get-name-properties";
  
  async function main() {
    // get account info
    const network = NETWORK;
    const mnemonic = MNEMONIC;
    const accountIndex = ACCOUNT_INDEX;
  
    // get address from mnemonic
    const { address } = await deriveChildAccount(network, mnemonic, accountIndex);
  
    const [name, namespace] = BNS_NAME.split(".");
  
    const txOptions: ReadOnlyFunctionOptions = {
      contractName: BNSX_REGISTRY_CONTRACT_NAME,
      contractAddress: BNSX_REGISTRY_CONTRACT_ADDRESS,
      functionName: FUNCTION_NAME,
      functionArgs: [
        tupleCV({
          name: bufferCV(Buffer.from(name)),
          namespace: bufferCV(Buffer.from(namespace)),
        }),
      ],
      network: network,
      senderAddress: address,
    };
  
    try {
      const response = await callReadOnlyFunction(txOptions);
      const responseJson = cvToJSON(response);
  
      if (responseJson.type === ClarityType.OptionalSome) {
        const { owner } = responseJson.value.value;
        console.log(`Address associated with ${BNS_NAME}: ${owner}`);
      } else {
        console.log(`No address found for name ${BNS_NAME}`);
      }
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  }
  
  main();
  
  // Example usage
  const exampleName = "example.btc";
  main();