import {
  makeSTXTokenTransfer,
  broadcastTransaction,
  AnchorMode,
  createStacksPrivateKey,
} from "@stacks/transactions";
import { bytesToHex } from "@stacks/common";
import { CONFIG, deriveChildAccount, getNetwork } from "../utilities";

// CONFIGURATION

const networkObj = getNetwork(CONFIG.NETWORK);

async function transferToken(
  recipient: string,
  amount: bigint,
  memo: string = "",
  nonce: bigint = 0n,
  fee: bigint = 200n
) {
  try {
    // Derive child account from mnemonic
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    // Build the transaction for transferring tokens
    const txOptions = {
      recipient,
      amount,
      senderKey: key,
      network: networkObj,
      memo,
      nonce,
      fee,
      anchorMode: AnchorMode.Any,
    };

    const transaction = await makeSTXTokenTransfer(txOptions);

    // To see the raw serialized transaction
    const serializedTx = transaction.serialize();
    const serializedTxHex = bytesToHex(serializedTx);
    console.log(`Serialized Transaction (Hex): ${serializedTxHex}`);

    // Broadcast the transaction
    const broadcastResponse = await broadcastTransaction(
      transaction,
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
    console.error(`Error transferring tokens: ${error}`);
  }
}

// Get the recipient, amount, memo, nonce, and fee from command line arguments and call transferToken
const recipient = process.argv[2];
const amount = BigInt(process.argv[3]);
const memo = process.argv[4] || "";
const nonce = BigInt(process.argv[5] || 0);
const fee = BigInt(process.argv[6] || 200);

if (recipient && amount) {
  transferToken(recipient, amount, memo, nonce, fee);
} else {
  console.error("Please provide a recipient and amount as arguments.");
}
