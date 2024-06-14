import {
    makeContractCall,
    broadcastTransaction,
    AnchorMode,
    PostConditionMode,
    bufferCV,
    tupleCV,
    standardPrincipalCV,
    SignedContractCallOptions,
    cvToString
  } from "@stacks/transactions";
  import { BNSX_EXTENSIONS_CONTRACT_NAME, BNSX_EXTENSIONS_CONTRACT_ADDRESS, BNSX_REGISTRY_CONTRACT_NAME, BNSX_REGISTRY_CONTRACT_ADDRESS } from "../constants";
  import { deriveChildAccount, getNextNonce } from "../utilities";
  
  // register bns name for agent
  
  // CONFIGURATION
  
  const NETWORK = Bun.env.network;
  const MNEMONIC = Bun.env.mnemonic;
  const ACCOUNT_INDEX = Bun.env.accountIndex;
  
  const DEFAULT_FEE = 250_000; // 0.25 STX
  
  async function registerBnsName(name: string, namespace: string) {
    // get account info
    const network = NETWORK;
    const mnemonic = MNEMONIC;
    const accountIndex = parseInt(ACCOUNT_INDEX || "0", 10);
  
    // get address and private key from mnemonic
    const { address, key } = await deriveChildAccount(network, mnemonic, accountIndex);
  
    // check if the agent's contract has the "registry" role
    const hasRegistryRole = await checkRegistryRole(address, key);
  
    if (!hasRegistryRole) {
      throw new Error("The agent's contract does not have the required 'registry' role.");
    }
  
    // prepare the name tuple
    const nameTuple = tupleCV({
      name: bufferCV(Buffer.from(name)),
      namespace: bufferCV(Buffer.from(namespace)),
    });
  
    // get the current nonce for the account
    const nonce = await getNextNonce(network, address);
  
    // prepare the transaction
    const txOptions: SignedContractCallOptions = {
      contractAddress: BNSX_REGISTRY_CONTRACT_ADDRESS,
      contractName: BNSX_REGISTRY_CONTRACT_NAME,
      functionName: "register",
      functionArgs: [nameTuple, standardPrincipalCV(address)],
      fee: DEFAULT_FEE,
      nonce: nonce,
      senderKey: key,
      network,
      postConditionMode: PostConditionMode.Allow,
      anchorMode: AnchorMode.Any,
    };
  
    try {
      // create and broadcast transaction
      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, network);
  
      // handle error in response
      if ("error" in broadcastResponse) {
        throw new Error(`Transaction failed to broadcast: ${broadcastResponse.error}`);
      }
  
      return {
        txid: broadcastResponse.txid,
        address,
        nonce,
      };
    } catch (error) {
      throw new Error(`General/Unexpected Failure: ${error}`);
    }
  }
  
  async function checkRegistryRole(address: string, key: string): Promise<boolean> {
    const txOptions: SignedContractCallOptions = {
      contractAddress: BNSX_EXTENSIONS_CONTRACT_ADDRESS,
      contractName: BNSX_EXTENSIONS_CONTRACT_NAME,
      functionName: "has-role-or-extension",
      functionArgs: [
        standardPrincipalCV(address),
        bufferCV(Buffer.from("registry")),
      ],
      network: NETWORK,
      senderKey: key,
      anchorMode: AnchorMode.Any,
    };
  
    try {
      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, NETWORK);
  
      if ("error" in broadcastResponse) {
        throw new Error(`Error checking registry role: ${broadcastResponse.error}`);
      }
  
      const txid = broadcastResponse.txid;
      const url = `${NETWORK.coreApiUrl}/extended/v1/tx/${txid}`;
      const response = await fetch(url);
      const txDetails = await response.json();
  
      const resultCV = txDetails.tx_result.value;
      const resultString = cvToString(resultCV);
  
      return resultString === "true";
    } catch (error) {
      throw new Error(`Error checking registry role: ${error}`);
    }
  }
  
  export async function main(name: string, namespace: string) {
    try {
      const result = await registerBnsName(name, namespace);
      console.log("BNSx name registered successfully!");
      console.log(`TXID: 0x${result.txid}`);
      console.log(`Address: ${result.address}`);
      console.log(`Nonce: ${result.nonce}`);
    } catch (error) {
      console.error(`Error registering BNSx name: ${error}`);
    }
  }