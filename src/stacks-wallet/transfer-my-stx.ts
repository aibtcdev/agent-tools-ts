import { makeSTXTokenTransfer } from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
  stxToMicroStx,
} from "../utilities";

const usage =
  "Usage: bun run transfer-my-stx.ts <recipient> <amount> [fee] [memo]";
const usageExample =
  "Example: bun run transfer-my-stx.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM 10 200 'For services rendered'";

interface ExpectedArgs {
  recipient: string;
  amount: bigint;
  fee?: bigint;
  memo?: string;
}

function validateArgs(): ExpectedArgs {
  const [recipient, amountStr, feeStr, memo] = process.argv.slice(2);

  if (!recipient || !amountStr) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  const amount = BigInt(amountStr);
  if (isNaN(Number(amount)) || amount <= 0) {
    const errorMessage = [
      `Invalid amount: ${amountStr}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  let fee: bigint | undefined;
  if (feeStr !== undefined) {
    fee = BigInt(feeStr);
    if (isNaN(Number(fee)) || fee < 0) {
      const errorMessage = [`Invalid fee: ${feeStr}`, usage, usageExample].join(
        "\n"
      );
      throw new Error(errorMessage);
    }
  }

  return { recipient, amount, fee, memo };
}

async function transferToken() {
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { recipient, amount, fee = 500n, memo = "" } = validateArgs();
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
  };

  const transaction = await makeSTXTokenTransfer(txOptions);

  // To see the raw serialized transaction
  //const serializedTx = transaction.serialize();
  //console.log(`Serialized Transaction (Hex): ${serializedTx}`);

  // broadcast the transaction to the network
  const broadcastResponse = await broadcastTx(transaction, networkObj);
  return broadcastResponse;
}

transferToken()
  .then(sendToLLM)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
