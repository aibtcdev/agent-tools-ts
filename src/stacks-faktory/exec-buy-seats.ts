// exec-buy-seats.ts
import { FaktorySDK } from "@faktoryfun/core-sdk";
import {
  makeContractCall,
  broadcastTransaction,
  SignedContractCallOptions,
  ClarityValue,
  principalCV,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../utilities";
import dotenv from "dotenv";

dotenv.config();

const seatCount = Number(process.argv[2]); // Number of seats to buy
const prelaunchContract = process.argv[3]; // Pre-launch contract address
const contractType = (process.argv[4] as "meme" | "dao" | "helico") || "meme"; // Contract type: "meme", "dao", or "helico"

if (!seatCount || !prelaunchContract) {
  console.error("Please provide all required parameters:");
  console.error(
    "bun run src/stacks-faktory/exec-buy-seats.ts <seat_count> <prelaunch_contract> [contract_type]"
  );
  console.error("Contract type can be 'meme' (default), 'dao', or 'helico'");
  console.error("Examples:");
  console.error(
    "  Meme: bun run src/stacks-faktory/exec-buy-seats.ts 3 SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-pre-faktory meme"
  );
  console.error(
    "  DAO:  bun run src/stacks-faktory/exec-buy-seats.ts 3 SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.aidao-pre-faktory dao"
  );
  console.error(
    "  Helico: bun run src/stacks-faktory/exec-buy-seats.ts 10 SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.helico-pre-faktory helico"
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

    // console.log(`Contract type: ${info.contractType.toUpperCase()}`);
    // console.log(`Seat price: ${info.pricing.description}`);
    // console.log(
    //   "Current seats owned:",
    //   info.userInfo.value.value["seats-owned"].value
    // );
    // console.log(
    //   "Remaining seats:",
    //   info.remainingSeats.value.value["remainin-seats"].value
    // );
    // console.log("Max seats allowed:", info.maxSeatsAllowed.value);

    // Get buy seats parameters
    console.log("\nPreparing buy seats transaction...");
    const buySeatsParams = await sdk.getBuySeatsParams({
      prelaunchContract,
      seatCount,
      senderAddress: address,
      contractType: contractType,
    });

    console.log(
      `Cost: ${buySeatsParams.estimatedCost} satoshis (${
        buySeatsParams.estimatedCost / 100000000
      } BTC)`
    );
    console.log(`Current seats: ${buySeatsParams.currentSeats}`);
    console.log(`Max additional seats: ${buySeatsParams.maxAdditionalSeats}`);

    // Add required properties for signing
    const txOptions: SignedContractCallOptions = {
      ...buySeatsParams,
      senderKey: key,
      validateWithAbi: true,
      fee: 50000, // Higher fee for pre-launch transactions
      nonce,
      functionArgs: buySeatsParams.functionArgs as ClarityValue[],
    };

    // Create and broadcast transaction
    console.log("\nCreating and broadcasting transaction...");
    const tx = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(tx, networkObj);

    const result = {
      success: broadcastResponse.txid ? true : false,
      message: "Seat purchase transaction broadcast successfully!",
      txid: broadcastResponse.txid,
      contractType,
      seatCount,
      estimatedCost: buySeatsParams.estimatedCost,
      // priceDescription: info.pricing.description,
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error executing buy seats transaction:", error);
    process.exit(1);
  }
})();
