import {
    ReadOnlyFunctionOptions,
    callReadOnlyFunction,
    cvToJSON,
    ClarityType,
    uintCV,
  } from "@stacks/transactions";
  import { BNSX_REGISTRY_CONTRACT_NAME, BNSX_REGISTRY_CONTRACT_ADDRESS } from "../constants";
  import { deriveChildAccount } from "../utilities";
  
  // get address by bns name
  
  // CONFIGURATION
  
  const NETWORK = Bun.env.network;
  const MNEMONIC = Bun.env.mnemonic;
  const ACCOUNT_INDEX = Bun.env.accountIndex;
  
  const BNS_NAME = Bun.env.bnsName;
  const FUNCTION_NAME = "get-name-owner";
  
  async function main() {
    // get account info
    const network = NETWORK;
    const mnemonic = MNEMONIC;
    const accountIndex = ACCOUNT_INDEX;
  
    // get address from mnemonic
    const { address } = await deriveChildAccount(network, mnemonic, accountIndex);
  
    try {
      // Get the name ID for the given BNS name
      const nameId = await getNameId(BNS_NAME);
  
      if (!nameId) {
        console.log("Name not found");
        return;
      }
  
      const txOptions: ReadOnlyFunctionOptions = {
        contractName: BNSX_REGISTRY_CONTRACT_NAME,
        contractAddress: BNSX_REGISTRY_CONTRACT_ADDRESS,
        functionName: FUNCTION_NAME,
        functionArgs: [uintCV(nameId)],
        network: network,
        senderAddress: address,
      };
  
      const response = await callReadOnlyFunction(txOptions);
      const responseJson = cvToJSON(response);
  
      if (responseJson.type === ClarityType.OptionalSome) {
        const ownerAddress = responseJson.value.value;
        console.log(`Address for ${BNS_NAME}:`, ownerAddress);
      } else {
        console.log("Address not found for the given BNS name.");
      }
    } catch (error) {
      console.error(`General/Unexpected Failure: ${error}`);
    }
  }
  
  async function getNameId(bnsName: string): Promise<bigint | undefined> {
    const nameParts = bnsName.split(".");
    const name = nameParts[0];
    const namespace = nameParts[1];
  
    const txOptions: ReadOnlyFunctionOptions = {
      contractName: BNSX_REGISTRY_CONTRACT_NAME,
      contractAddress: BNSX_REGISTRY_CONTRACT_ADDRESS,
      functionName: "get-id-for-name",
      functionArgs: [
        { type: ClarityType.Tuple, value: [
          { key: "name", type: ClarityType.Buffer, value: Buffer.from(name) },
          { key: "namespace", type: ClarityType.Buffer, value: Buffer.from(namespace) },
        ]}
      ],
      network: NETWORK,
      senderAddress: BNSX_REGISTRY_CONTRACT_ADDRESS,
    };
  
    const response = await callReadOnlyFunction(txOptions);
    const responseJson = cvToJSON(response);
  
    if (responseJson.type === ClarityType.OptionalSome) {
      return BigInt(responseJson.value.value);
    }
  
    return undefined;
  }
  
  main();