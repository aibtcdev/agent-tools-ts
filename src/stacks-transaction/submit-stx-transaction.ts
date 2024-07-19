import { CONFIG, getNetwork, deriveChildAccount, getNextNonce } from "../utilities";
import {
  makeSTXTokenTransfer,
  broadcastTransaction,
  AnchorMode,
} from "@stacks/transactions";

async function createAndSubmitSTXTransfer(
  recipientAddress: string,
  amountInMicroSTX: bigint,
  memo: string = ""
) {
  const network = getNetwork(CONFIG.NETWORK);

  try {
    // Derive the sender's account from the mnemonic
    const senderAccount = await deriveChildAccount(CONFIG.NETWORK, CONFIG.MNEMONIC, CONFIG.ACCOUNT_INDEX);

    // Get the next nonce for the sender's address
    const nonce = await getNextNonce(CONFIG.NETWORK, senderAccount.address);

    // Create the token transfer transaction
    const txOptions = {
      recipient: recipientAddress,
      amount: amountInMicroSTX,
      senderKey: senderAccount.key,
      network: network,
      memo: memo,
      nonce: nonce,
      anchorMode: AnchorMode.Any,
      fee: 10000n, // Set an appropriate fee, or use fee estimation
    };

    const transaction = await makeSTXTokenTransfer(txOptions);

    // Broadcast the transaction to the network
    const broadcastResponse = await broadcastTransaction(transaction, network);

    if (broadcastResponse.error) {
      throw new Error(`Failed to broadcast transaction: ${broadcastResponse.error}`);
    }

    return {
      txid: broadcastResponse.txid,
      status: "Broadcast",
      senderAddress: senderAccount.address
    };
  } catch (error) {
    console.error(`Failed to create or submit transaction: ${error}`);
    throw error;
  }
}

async function main() {
  const recipientAddress = process.argv[2];
  const amountInSTX = process.argv[3];

  if (!recipientAddress || !amountInSTX) {
    console.error("Usage: bun run create-stx-transfer.ts <recipient_address> <amount_in_stx>");
    process.exit(1);
  }

  const amountInMicroSTX = BigInt(Math.floor(parseFloat(amountInSTX) * 1_000_000));

  try {
    const result = await createAndSubmitSTXTransfer(recipientAddress, amountInMicroSTX);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();