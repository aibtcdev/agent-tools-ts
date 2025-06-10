// simple-exec-claim.ts
// Ultra-simple claim using SDK without any post-conditions or status checks
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

const prelaunchContract = process.argv[2]; // Pre-launch contract address
const tokenContract = process.argv[3]; // Token contract address

if (!prelaunchContract || !tokenContract) {
  console.error("Please provide all required parameters:");
  console.error(
    "bun run src/stacks-faktory/simple-exec-claim.ts <prelaunch_contract> <token_contract>"
  );
  console.error("Examples:");
  console.error(
    "  bun run src/stacks-faktory/simple-exec-claim.ts STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-pre-faktory STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-faktory"
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

    console.log("🎯 Ultra-Simple Claim Transaction");
    console.log("=================================");
    console.log(`Pre-launch contract: ${prelaunchContract}`);
    console.log(`Token contract: ${tokenContract}`);
    console.log(`Claiming for account: ${address}`);

    // Get ultra-simple claim parameters (no status checks, no post-conditions)
    console.log("\n📝 Preparing claim transaction...");
    const claimParams = await sdk.getClaimParams({
      prelaunchContract,
      tokenContract,
      senderAddress: address,
    });

    console.log("✅ Claim parameters prepared (no validation needed)");

    // Add required properties for signing - use v6 pattern
    const txOptions: SignedContractCallOptions = {
      ...(claimParams as any), // v6 casting
      network: networkObj,
      nonce,
      senderKey: key,
    };

    // Create and broadcast transaction
    console.log("\n📡 Broadcasting transaction...");
    const tx = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTx(tx, networkObj);

    if (broadcastResponse.success) {
      console.log("✅ Claim transaction broadcast successfully!");
      console.log(`TX ID: ${broadcastResponse.data?.txid}`);

      const result = {
        success: true,
        message: "Claim transaction broadcast successfully!",
        data: broadcastResponse.data,
        prelaunchContract,
        tokenContract,
        claimant: address,
      };

      console.log("\n📊 Result:");
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log("❌ Transaction broadcast failed");
      console.log("Data:", broadcastResponse.data);
    }

    console.log("\n💡 Next steps:");
    console.log("1. Wait for transaction confirmation (1-2 minutes)");
    console.log("2. Check your token balance");
    console.log("3. If successful, tokens should appear in your wallet");
    console.log("4. The contract will handle all validation internally");
  } catch (error: any) {
    console.error("❌ Error executing claim transaction:", error.message);

    // Provide helpful error context based on contract errors
    if (
      error.message.includes("304") ||
      error.message.includes("Nothing to claim")
    ) {
      console.log("\n💡 Contract says: Nothing to claim");
      console.log("- No tokens are vested yet (check vesting schedule)");
      console.log("- You've already claimed all available tokens");
    } else if (
      error.message.includes("302") ||
      error.message.includes("Not seat owner")
    ) {
      console.log("\n💡 Contract says: Not a seat owner");
      console.log("- This account doesn't own seats in the pre-launch");
    } else if (
      error.message.includes("307") ||
      error.message.includes("Wrong token")
    ) {
      console.log("\n💡 Contract says: Wrong token contract");
      console.log(
        "- Make sure you're using the correct token contract address"
      );
    } else if (
      error.message.includes("321") ||
      error.message.includes("Distribution not initialized")
    ) {
      console.log("\n💡 Contract says: Distribution not started");
      console.log("- The pre-launch distribution period hasn't begun yet");
    } else {
      console.log("\n💡 Unexpected error:");
      console.log("- Check network connectivity");
      console.log("- Verify contract addresses are correct");
      console.log("- Check if you have sufficient gas fees");
    }

    process.exit(1);
  }
})();
