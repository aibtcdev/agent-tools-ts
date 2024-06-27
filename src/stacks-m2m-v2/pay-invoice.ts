import {
  AnchorMode,
  Cl,
  FungibleConditionCode,
  PostConditionMode,
  SignedContractCallOptions,
  broadcastTransaction,
  createAssetInfo,
  createFungiblePostCondition,
  makeContractCall,
} from "@stacks/transactions";
import { CONFIG, deriveChildAccount, getNextNonce } from "../utilities";
import {
  DEPLOYER,
  TOKEN_CONTRACT_NAME,
  TOKEN_NAME,
  CONTRACT_NAME,
} from "../constants";

// pay a stacks-m2m invoice
// TODO: fix post-conditions

// CONFIGURATION

const DEFAULT_FEE = 250_000; // 0.25 STX
const RESOURCE_ID = 1;
const RESOURCE_PRICE = 1_000; // 0.00001 aiBTC
const FUNCTION_NAME = "pay-invoice";
const FUNCTION_ARGS = [
  Cl.uint(RESOURCE_ID),
  Cl.none(), // memo (optional)
];

// MAIN SCRIPT (DO NOT EDIT BELOW)

async function main() {
  // get account info from env
  const network = CONFIG.NETWORK;
  const mnemonic = CONFIG.MNEMONIC;
  const accountIndex = CONFIG.ACCOUNT_INDEX;

  // get account address and private key
  const { address, key } = await deriveChildAccount(
    network,
    mnemonic,
    accountIndex
  );

  // get the current nonce for the account
  const nonce = await getNextNonce(network, address);

  // create the pay-invoice transaction
  const txOptions: SignedContractCallOptions = {
    contractAddress: DEPLOYER,
    contractName: CONTRACT_NAME,
    functionName: FUNCTION_NAME,
    functionArgs: FUNCTION_ARGS,
    fee: DEFAULT_FEE,
    nonce: nonce,
    network: network,
    senderKey: key,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    /*
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      createFungiblePostCondition(
        address,
        FungibleConditionCode.Equal,
        RESOURCE_PRICE,
        createAssetInfo(DEPLOYER, TOKEN_CONTRACT_NAME, TOKEN_NAME)
      ),
    ],
    */
  };

  try {
    // create and broadcast transaction
    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);

    // handle error in response
    if ("error" in broadcastResponse) {
      console.error("Transaction failed to broadcast");
      console.error(`Error: ${broadcastResponse.error}`);
      if (broadcastResponse.reason) {
        console.error(`Reason: ${broadcastResponse.reason}`);
      }
      if (broadcastResponse.reason_data) {
        console.error(
          `Reason Data: ${JSON.stringify(
            broadcastResponse.reason_data,
            null,
            2
          )}`
        );
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

main();
