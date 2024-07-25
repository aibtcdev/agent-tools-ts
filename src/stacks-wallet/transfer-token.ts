import {
  makeSTXTokenTransfer,
  broadcastTransaction,
  AnchorMode,
} from "@stacks/transactions";
import { bytesToHex } from "@stacks/common";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  stxToMicroStx,
} from "../utilities";

// CONFIGURATION
const networkObj = getNetwork(CONFIG.NETWORK);

async function transferToken(
  recipient: string,
  amount: bigint,
  fee: bigint = 200n,
  memo: string = ""
) {
  try {
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

    // get the next nonce for the account
    const nonce = await getNextNonce(network, address);

    // convert amount to microSTX
    const convertedAmount = stxToMicroStx(Number(amount));

    // build the transaction for transferring tokens
    const txOptions = {
      recipient,
      amount: convertedAmount,
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
const fee = BigInt(process.argv[4] || 200);
const memo = process.argv[5] || "";

if (recipient && amount) {
  transferToken(recipient, amount, fee, memo);
} else {
  console.error("Please provide a recipient and amount as arguments.");
}
