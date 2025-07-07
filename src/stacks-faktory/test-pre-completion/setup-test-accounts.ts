// setup-test-accounts.ts
// One-time script to distribute 1 STX from account 0 to accounts 1-9
import {
  makeSTXTokenTransfer,
  broadcastTransaction,
  AnchorMode,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../../utilities";

async function main() {
  console.log("🏦 Setting up test accounts - One-time STX distribution");
  console.log("======================================================");

  const networkObj = getNetwork(CONFIG.NETWORK);

  // Get account 0 (the main account with STX)
  const { address: senderAddress, key: senderKey } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    0
  );

  console.log(`Sender (Account 0): ${senderAddress}`);

  let nonce = await getNextNonce(CONFIG.NETWORK, senderAddress);

  // Transfer 1 STX to accounts 1-9
  for (let i = 11; i <= 15; i++) {
    try {
      const { address: recipientAddress } = await deriveChildAccount(
        CONFIG.NETWORK,
        CONFIG.MNEMONIC,
        i
      );

      console.log(
        `\n💸 Transferring 1 STX to Account ${i}: ${recipientAddress}`
      );

      const txOptions = {
        recipient: recipientAddress,
        amount: 1000000n, // 1 STX in microSTX
        senderKey,
        network: networkObj,
        anchorMode: AnchorMode.Any,
        nonce,
        fee: 1000n, // Small fee
      };

      const transaction = await makeSTXTokenTransfer(txOptions);
      const broadcastResponse = await broadcastTx(transaction, networkObj);

      if (broadcastResponse.success) {
        console.log(`✅ Account ${i}: STX transfer successful`);
        console.log(`   TX: ${broadcastResponse.data?.txid}`);
      } else {
        console.log(`❌ Account ${i}: STX transfer failed`);
      }

      nonce++;

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(`❌ Account ${i}: Error - ${error.message}`);
    }
  }

  console.log("\n✅ STX distribution complete!");
  console.log("💡 Now accounts 1-9 have 1 STX each for transaction fees");
  console.log(
    "💡 Next: Run the sBTC faucet script to get sBTC for each account"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });
