// exec-buy-seats.ts
import { FaktorySDK } from "@faktoryfun/core-sdk";
import {
  makeContractCall,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../utilities";

const seatCount = Number(process.argv[2]); // Number of seats to buy
const prelaunchContract = process.argv[3]; // Pre-launch contract address
const contractType = (process.argv[4] as "meme" | "dao" | "helico") || "dao"; // Default to dao

if (!seatCount || !prelaunchContract) {
  console.error("Please provide all required parameters:");
  console.error(
    "bun run src/stacks-faktory/exec-buy-seats.ts <seat_count> <prelaunch_contract> [contract_type]"
  );
  console.error("Contract type can be 'meme', 'dao' (default), or 'helico'");
  console.error("Examples:");
  console.error(
    "  DAO:  bun run src/stacks-faktory/exec-buy-seats.ts 3 STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-pre-faktory dao"
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

    console.log("SDK version check...");
    console.log(
      "Available methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(sdk))
    );

    // Try to get pre-launch info first
    console.log("\nGetting pre-launch status...");
    try {
      const status = await sdk.getPrelaunchStatus(prelaunchContract, address);
      console.log("Pre-launch status retrieved successfully");

      const userSeats = status.userInfo.value.value["seats-owned"].value;
      const remainingSeats =
        status.remainingSeats.value.value["remainin-seats"].value;

      console.log(`Current seats owned: ${userSeats}`);
      console.log(`Remaining seats: ${remainingSeats}`);
    } catch (error: any) {
      console.log("Could not get pre-launch status:", error.message);
    }

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
    console.log(`Detected contract type: ${buySeatsParams.detectedType}`);

    // Add required properties for signing - use v6 pattern like aibtcdev main
    const txOptions: SignedContractCallOptions = {
      ...(buySeatsParams as any), // v6 casting
      network: networkObj,
      nonce,
      senderKey: key,
    };

    // Create and broadcast transaction
    console.log("\nCreating and broadcasting transaction...");
    const tx = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTx(tx, networkObj);

    const result = {
      success: broadcastResponse.success ? true : false,
      message: "Seat purchase transaction broadcast successfully!",
      data: broadcastResponse.data,
      contractType: buySeatsParams.detectedType,
      seatCount,
      estimatedCost: buySeatsParams.estimatedCost,
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("Error executing buy seats transaction:", error);

    // More detailed error info
    if (error.message.includes("getBuySeatsParams is not a function")) {
      console.error("\nSDK Debug Info:");
      console.error("This suggests a version mismatch. Try:");
      console.error("npm install @faktoryfun/core-sdk@latest");
    }

    process.exit(1);
  }
})();
