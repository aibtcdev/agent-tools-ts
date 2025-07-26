import {
  makeSTXTokenTransfer,
  AnchorMode,
} from "@stacks/transactions";
import { bytesToHex } from "@stacks/common";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  MICROSTX_IN_STX,
  broadcastTx,
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

    // convert amount from STX to microSTX (keeping as bigint)
    const convertedAmount = amount * BigInt(MICROSTX_IN_STX);

    // build the transaction for transferring tokens
    const txOptions: any = {
      recipient,
      amount: convertedAmount,
      senderKey: key,
      network: networkObj,
      anchorMode: AnchorMode.Any,
      nonce,
      fee,
    };

    // Add memo if provided
    if (memo && memo.trim() !== "") {
      txOptions.memo = memo;
    }

    const transaction = await makeSTXTokenTransfer(txOptions);
    
    // Use the same broadcast method as the working example
    const broadcastResponse = await broadcastTx(transaction, networkObj);

    if (broadcastResponse.success) {
      console.log("✅ STX transfer successful!");
      console.log(`FROM: ${address}`);
      console.log(`TO: ${recipient}`);
      console.log(`AMOUNT: ${amount} STX`);
      if (memo) console.log(`MEMO: ${memo}`);
      console.log(`TX: ${broadcastResponse.data?.txid}`);
      if (broadcastResponse.data?.link) {
        console.log(`Explorer: ${broadcastResponse.data.link}`);
      }
    } else {
      console.log("❌ STX transfer failed");
      console.log(`Error: ${broadcastResponse.message}`);
    }
  } catch (error) {
    console.log(`Error transferring tokens: ${error}`);
  }
}

// Get the recipient, amount, fee, and memo from command line arguments and call transferToken
const recipient = process.argv[2];
const amount = BigInt(process.argv[3]);
const fee = BigInt(process.argv[4] || 200);
const memo = process.argv[5] || "";

if (recipient && amount) {
  transferToken(recipient, amount, fee, memo);
} else {
  console.error("Please provide a recipient and amount as arguments.");
}
