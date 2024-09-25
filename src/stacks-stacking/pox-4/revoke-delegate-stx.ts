import { TxBroadcastResult } from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  logBroadCastResult,
} from "../../utilities";
import { StackingClient } from "@stacks/stacking";

// CONFIGURATION
const networkObj = getNetwork(CONFIG.NETWORK);

type DelegateResponse = TxBroadcastResult & {
  from: string;
};

//sends transaction to revoke stx authority
async function revokeDelegate(): Promise<DelegateResponse | null> {
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

    const client = new StackingClient(address, networkObj);
    const delegetateResponse = await client.revokeDelegateStx(key);
    return {
      from: address,
      ...delegetateResponse,
    };
  } catch (error) {
    console.error(`Error revoking: ${error}`);
    return null;
  }
}

async function main() {
  let revokeReponse = await revokeDelegate();
  //return if response is null as the error is logged by the returning function
  if (!revokeReponse) {
    return;
  }
  //handle response
  logBroadCastResult(revokeReponse, revokeReponse.from);
}

main();
