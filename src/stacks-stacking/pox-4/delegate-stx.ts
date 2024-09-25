import { TxBroadcastResult } from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  logBroadCastResult,
  stxToMicroStx,
} from "../../utilities";
import { StackingClient } from "@stacks/stacking";

// CONFIGURATION
const networkObj = getNetwork(CONFIG.NETWORK);

type DelegateResponse = TxBroadcastResult & {
  from: string;
};

// handles delegating STX to a pool
async function delegateSTX(
  delegateTo: string,
  amountSTX: Number
): Promise<DelegateResponse | null> {
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

    // convert amount to microSTX
    const amountInMicroStx = stxToMicroStx(Number(amountSTX));
    const client = new StackingClient(address, networkObj);
    const delegetateResponse = await client.delegateStx({
      amountMicroStx: amountInMicroStx,
      delegateTo,
      privateKey: key,
    });
    return {
      from: address,
      ...delegetateResponse,
    };
  } catch (error) {
    console.error(`Error delegating STX : ${error}`);
    return null;
  }
}

async function main() {
  // Get the poolAddress , amount(stx) in order from command line arguments and call delegateSTX
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Usage: bun run delegate-stx.ts <poolAddress> <stxAmount>'");
    return;
  }

  const recipient = args[0];
  const amount = Number(args[1]);
  if (!recipient && !amount) {
    console.error("Please provide a recipient and amount as arguments.");
    return;
  }
  let delegateResponse = await delegateSTX(recipient, amount);
  //return if response is null as the error is logged by the returning function
  if (!delegateResponse) {
    return;
  }
  //handle response
  logBroadCastResult(delegateResponse, delegateResponse.from);
}

main();
