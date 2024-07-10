import { buildPreorderNameTx } from "@stacks/bns";
import {
  TransactionSigner,
  broadcastTransaction,
  createStacksPrivateKey,
  pubKeyfromPrivKey,
  publicKeyToString,
} from "@stacks/transactions";
import { CONFIG, deriveChildAccount, getNetwork } from "../utilities";

// CONFIGURATION

const networkObj = getNetwork(CONFIG.NETWORK);

async function preorderName(
  name: string,
  salt: string = "",
  stxToBurn: string = ""
) {
  try {
    // Derive child account from mnemonic
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const publicKey = publicKeyToString(pubKeyfromPrivKey(key));

    // Build the transaction for preordering the name
    const unsignedTX = await buildPreorderNameTx({
      fullyQualifiedName: name,
      publicKey,
      salt,
      stxToBurn,
      network: networkObj,
    });

    // Sign the transaction
    const signer = new TransactionSigner(unsignedTX);
    signer.signOrigin(createStacksPrivateKey(key));

    // Broadcast the transaction
    const broadcastResponse = await broadcastTransaction(
      signer.transaction,
      networkObj
    );

    // Handle the response
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
      console.log("Transaction broadcasted successfully!");
      console.log(`FROM: ${address}`);
      console.log(`TXID: 0x${broadcastResponse.txid}`);
    }
  } catch (error) {
    console.error(`Error preordering name: ${error}`);
  }
}

// Get the name, salt, and stxToBurn from command line arguments and call preorderName
const name = process.argv[2];
const stxToBurn = process.argv[3] || "";
const salt = process.argv[4] || ""; // Default to empty string if not provided

if (name) {
  preorderName(name, salt, stxToBurn);
} else {
  console.error("Please provide a name and stxToBurn as arguments.");
}
