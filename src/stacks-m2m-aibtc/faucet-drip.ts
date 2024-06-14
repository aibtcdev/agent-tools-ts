import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  bufferCV,
  tupleCV,
  standardPrincipalCV,
  cvToHex,
  hexToCV,
  cvToString,
  SignedContractCallOptions,
} from "@stacks/transactions";
import { StacksNetworkVersion } from "@stacks/common";
import { BNSX_EXTENSIONS_CONTRACT_NAME, BNSX_EXTENSIONS_CONTRACT_ADDRESS, BNSX_REGISTRY_CONTRACT_NAME, BNSX_REGISTRY_CONTRACT_ADDRESS } from "../constants";
import { deriveChildAccount, getNextNonce } from "../utilities";

// register bns name for agent

// CONFIGURATION

const NETWORK = Bun.env.network;
const MNEMONIC = Bun.env.mnemonic;
const ACCOUNT_INDEX = Bun.env.accountIndex;

const NAME = Bun.env.name;
const NAMESPACE = Bun.env.namespace;

const DEFAULT_FEE = 250_000; // 0.25 STX

async function main() {
  // get account info
  const network = NETWORK;
  const mnemonic = MNEMONIC;
  const accountIndex = ACCOUNT_INDEX;

  // get address and private key from mnemonic
  const { address, key } = await deriveChildAccount(network, mnemonic, accountIndex);

  // check if the agent's contract has the "registry" role
  const hasRegistryRole = await checkRegistryRole(address);

  if (!hasRegistryRole) {
    console.log("The agent's contract does not have the required 'registry' role.");
    return;
  }

  // prepare the name tuple
  const nameTuple = tupleCV({
    name: bufferCV(Buffer.from(NAME)),
    namespace: bufferCV(Buffer.from(NAMESPACE)),
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
    const broadcastResponse = await broadcastTransaction(transaction, network as StacksNetworkVersion);

    // handle error in response
    if ("error" in broadcastResponse) {
      console.error("Transaction failed to broadcast");
      console.error(`Error: ${broadcastResponse.error}`);
      if (broadcastResponse.reason) {
        console.error(`Reason: ${broadcastResponse.reason}`);
      }
      if (broadcastResponse.reason_data) {
        console.error(`Reason Data: ${JSON.stringify(broadcastResponse.reason_data, null, 2)}`);
      }
    } else {
      // report successful result
      console.log("Transaction broadcasted successfully!");
      console.log(`FROM: ${address}`);
      console.log(`NONCE: ${nonce}`);
      console.log(`TXID: 0x${broadcastResponse.txid}`);
    }
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

async function checkRegistryRole(address: string): Promise<boolean> {
  const txOptions: SignedContractCallOptions = {
    contractAddress: BNSX_EXTENSIONS_CONTRACT_ADDRESS,
    contractName: BNSX_EXTENSIONS_CONTRACT_NAME,
    functionName: "has-role-or-extension",
    functionArgs: [
      standardPrincipalCV(address),
      bufferCV(Buffer.from("registry")),
    ],
    network: NETWORK,
    senderAddress: BNSX_EXTENSIONS_CONTRACT_ADDRESS,
  };

  try {
    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, NETWORK as StacksNetworkVersion);

    if ("error" in broadcastResponse) {
      console.error(`Error checking registry role: ${broadcastResponse.error}`);
      return false;
    }

    const responseCV = hexToCV(broadcastResponse.result);
    const response = cvToString(responseCV);

    return response === "true";
  } catch (error) {
    console.error(`Error checking registry role: ${error}`);
    return false;
  }
}

main();