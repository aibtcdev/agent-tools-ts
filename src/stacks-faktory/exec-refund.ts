// exec-refund.ts
import { FaktorySDK } from "@faktoryfun/core-sdk";
import {
  makeContractCall,
  broadcastTransaction,
  SignedContractCallOptions,
  ClarityValue,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../utilities";
import dotenv from "dotenv";

dotenv.config();

const prelaunchContract = process.argv[2]; // Pre-launch contract address
const contractType = (process.argv[3] as "meme" | "dao") || "meme"; // Contract type: "meme" or "dao"

if (!prelaunchContract) {
  console.error("Please provide the pre-launch contract address:");
  console.error(
    "bun run src/stacks-faktory/exec-refund.ts <prelaunch_contract> [contract_type]"
  );
  console.error("Contract type can be 'meme' (default) or 'dao'");
  console.error("Examples:");
  console.error(
    "  Meme: bun run src/stacks-faktory/exec-refund.ts SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-pre-faktory meme"
  );
  console.error(
    "  DAO:  bun run src/stacks-faktory/exec-refund.ts SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.aidao-pre-faktory dao"
  );
  process.exit(1);
}

const faktoryConfig = {
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
};

(async () => {
  try {
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const sdk = new FaktorySDK(faktoryConfig);
    const networkObj = getNetwork(CONFIG.NETWORK);
    const nonce = await getNextNonce(CONFIG.NETWORK, address);

    // Get pre-launch info with contract type detection
    // console.log("\nGetting pre-launch info...");
    // const info = await sdk.getPrelaunchInfo(prelaunchContract, address);
    // const currentSeats = Number(info.userInfo.value.value["seats-owned"].value);

    // console.log(`Contract type: ${info.contractType.toUpperCase()}`);
    // console.log(`Seat price: ${info.pricing.description}`);

    // if (currentSeats === 0) {
    //   console.log("No seats to refund.");
    //   process.exit(0);
    // }

    // console.log("Current seats owned:", currentSeats);

    // Get refund parameters
    console.log("\nPreparing refund transaction...");
    const refundParams = await sdk.getRefundParams({
      prelaunchContract,
      senderAddress: address,
      contractType: contractType,
    });

    console.log(
      `Refund amount: ${refundParams.refundAmount} satoshis (${
        refundParams.refundAmount / 100000000
      } BTC)`
    );
    console.log(`Seats to refund: ${refundParams.seatsToRefund}`);

    // Add required properties for signing
    const txOptions: SignedContractCallOptions = {
      ...refundParams,
      senderKey: key,
      validateWithAbi: true,
      fee: 50000,
      nonce,
      functionArgs: refundParams.functionArgs as ClarityValue[],
    };

    // Create and broadcast transaction
    console.log("\nCreating and broadcasting transaction...");
    const tx = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(tx, networkObj);

    const result = {
      success: broadcastResponse.txid ? true : false,
      message: "Refund transaction broadcast successfully!",
      txid: broadcastResponse.txid,
      contractType: contractType,
      refundAmount: refundParams.refundAmount,
      seatsRefunded: refundParams.seatsToRefund,
      // priceDescription: info.pricing.description,
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error executing refund transaction:", error);
    process.exit(1);
  }
})();
