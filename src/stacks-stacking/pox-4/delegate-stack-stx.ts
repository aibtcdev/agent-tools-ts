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

/**
 *  locks up patially staked stx for a stacker (can only be called by pool operator)
 */
async function delegateStackSTX(
  stackerAddress: string,
  poolAddress: string,
  poolBTCAddress: string,
  amountSTX: Number,
  cycles: Number
) {
  try {
    // get account info from env
    const network = CONFIG.NETWORK;
    const mnemonic = CONFIG.MNEMONIC;
    const accountIndex = CONFIG.ACCOUNT_INDEX;

    // get account address and private key
    const { key: poolPrivateKey } = await deriveChildAccount(
      network,
      mnemonic,
      accountIndex
    );

    // convert amount to microSTX
    const amountInMicroStx = stxToMicroStx(Number(amountSTX));
    const client = new StackingClient(poolAddress, networkObj);
    const delegetateResponse = await client.delegateStackStx({
      stacker: stackerAddress,
      amountMicroStx: amountInMicroStx,
      poxAddress: poolBTCAddress,
      cycles,
      privateKey: poolPrivateKey,
    });
    return {
      from: poolAddress,
      ...delegetateResponse,
    };
  } catch (error) {
    console.error(`Error delegating STX : ${error}`);
    return null;
  }
}

async function main() {
  // Validate and extract arguments from process.argv
  const args = process.argv.slice(2); // skip the first two arguments (node and script path)

  if (args.length !== 5) {
    throw new Error(
      "Usage: bun run delegate-stack-stx.ts <stackerAddress> <poolAddress> <poolBTCAddress> <amountSTX> <cycles>"
    );
  }

  let [stackerAddress, poolAddress, poolBTCAddress, amountSTX, cycles] = args;

  // Convert amountSTX and cycles to numbers
  const amountSTXParsed = Number(amountSTX);
  const cyclesParsed = parseInt(cycles);

  if (
    !stackerAddress ||
    !poolAddress ||
    !poolBTCAddress ||
    isNaN(amountSTXParsed) ||
    isNaN(cyclesParsed)
  ) {
    throw new Error(
      "Invalid arguments. Ensure all arguments are provided and amountSTX and cycles are numbers."
    );
  }

  let delegateResponse = await delegateStackSTX(
    stackerAddress,
    poolAddress,
    poolBTCAddress,
    amountSTXParsed,
    cyclesParsed
  );
  //return if response is null as the error  is logged by the returning function
  if (!delegateResponse) {
    return;
  }
  //handle response
  logBroadCastResult(delegateResponse, delegateResponse.from);
}

main();
