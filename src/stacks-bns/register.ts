import { buildRegisterNameTx } from "@stacks/bns";
import {
  TransactionSigner,
  broadcastTransaction,
  createStacksPrivateKey,
  pubKeyfromPrivKey,
  publicKeyToString,
} from "@stacks/transactions";
import { CONFIG, deriveChildAccount, getNetwork } from "../utilities";

const networkObj = getNetwork(CONFIG.NETWORK);

async function registerName(
  name: string,
  salt: string = "",
  zonefile: string = ""
) {
  try {
    // Derive child account from mnemonic
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const publicKey = publicKeyToString(pubKeyfromPrivKey(key));

    // Build the transaction for registering the name
    const unsignedTX = await buildRegisterNameTx({
      fullyQualifiedName: name,
      network: networkObj,
      publicKey,
      salt,
      zonefile,
    });

    // Sign the transaction
    const signer = new TransactionSigner(unsignedTX);
    signer.signOrigin(createStacksPrivateKey(key));

    // Broadcast the transaction
    const broadcastResponse = await broadcastTransaction(
      signer.transaction,
      networkObj,
      Buffer.from(zonefile)
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
    console.error(`Error registering name: ${error}`);
  }
}

// Get the name, zonefile, and salt from command line arguments and call registerName
const name = process.argv[2];
const salt = process.argv[3] || ""; // Default to empty string if not provided
const zonefile = process.argv[4] || ""; // Default to empty string if not provided

if (name) {
  registerName(name, salt, zonefile);
} else {
  console.error("Please provide a name as an argument.");
}
