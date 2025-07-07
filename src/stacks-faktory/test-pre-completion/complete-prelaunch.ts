// simple-complete-prelaunch.ts
// Just buy the final seats to complete pre-launch without complex status checking
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
} from "../../utilities";
import { FaktorySDK } from "@faktoryfun/core-sdk";

const PRELAUNCH_CONTRACT =
  "ST331D6T77PNS2YZXR03CDC4G3XN0SYBPV51RSJW1.simpl21-pre-faktory";

const faktoryConfig = {
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
};

async function buySeatsForAccount(
  accountIndex: number,
  seatCount: number
): Promise<boolean> {
  console.log(`\n👤 Account ${accountIndex}: Buying ${seatCount} seats...`);

  try {
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      accountIndex
    );

    const sdk = new FaktorySDK(faktoryConfig);
    const networkObj = getNetwork(CONFIG.NETWORK);
    const nonce = await getNextNonce(CONFIG.NETWORK, address);

    // Get buy seats parameters
    const buySeatsParams = await sdk.getBuySeatsParams({
      prelaunchContract: PRELAUNCH_CONTRACT,
      seatCount,
      senderAddress: address,
      contractType: "dao",
    });

    // Create transaction
    const txOptions: SignedContractCallOptions = {
      ...(buySeatsParams as any),
      network: networkObj,
      nonce,
      senderKey: key,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTx(transaction, networkObj);

    if (broadcastResponse.success) {
      console.log(
        `✅ Account ${accountIndex}: Successfully bought ${seatCount} seats`
      );
      console.log(`   TX: ${broadcastResponse.data?.txid}`);
      console.log(`   Cost: ${buySeatsParams.estimatedCost} satoshis`);

      if (buySeatsParams.willCompleteLaunch) {
        console.log("   🎉 This purchase should complete the pre-launch!");
      }

      return true;
    } else {
      console.log(`❌ Account ${accountIndex}: Transaction failed`);
      return false;
    }
  } catch (error: any) {
    console.log(`❌ Account ${accountIndex}: Error - ${error.message}`);
    return false;
  }
}

async function waitForCompletion() {
  console.log("\n⏳ Waiting 30 seconds for blockchain to process...");
  await new Promise((resolve) => setTimeout(resolve, 30000));

  console.log("📊 Attempting to check if pre-launch completed...");

  try {
    const { address } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      0
    );
    const sdk = new FaktorySDK(faktoryConfig);

    // Try to get just the distribution status
    const status = await sdk.getPrelaunchStatus(PRELAUNCH_CONTRACT, address);
    const isDistribution =
      status.status.value.value["is-distribution-period"].value;

    if (isDistribution) {
      console.log("🎉 PRE-LAUNCH COMPLETED!");
      console.log("   ✅ Distribution period has started!");
      console.log("   📡 Token claiming is now available!");
      return true;
    } else {
      console.log("⚠️ Pre-launch may still be in progress");
      console.log("   Check manually or wait a bit longer");
      return false;
    }
  } catch (error: any) {
    console.log("❌ Could not check completion status due to:", error.message);
    console.log("💡 Check the pre-launch status manually in a few minutes");
    return false;
  }
}

async function main() {
  console.log("🎯 Simple Pre-launch Completion");
  console.log("===============================");
  console.log(`Contract: ${PRELAUNCH_CONTRACT}`);
  console.log(
    "Strategy: Buy 2 seats with a fresh account to trigger completion"
  );

  console.log("\n📋 Based on your data:");
  console.log("   - 10 accounts shown in get-all-seat-holders");
  console.log("   - 20 seats total from that data");
  console.log("   - But contract shows 9 users, 18 seats");
  console.log("   - Likely a sync delay or indexing issue");
  console.log("\n💡 Solution: Use account 10 to buy 2 more seats");

  // Try account 10 first (most likely to work)
  console.log("\n🎯 Attempting completion with account 10...");
  let success = await buySeatsForAccount(10, 2);

  if (success) {
    await waitForCompletion();
  } else {
    // Try account 11 as backup
    console.log("\n🔄 Account 10 failed, trying account 11...");
    success = await buySeatsForAccount(11, 2);

    if (success) {
      await waitForCompletion();
    } else {
      // Try account 12 as final backup
      console.log("\n🔄 Account 11 failed, trying account 12...");
      success = await buySeatsForAccount(12, 2);

      if (success) {
        await waitForCompletion();
      } else {
        console.log("\n❌ All attempts failed");
        console.log("💡 Possible issues:");
        console.log("   - Pre-launch may already be complete");
        console.log("   - Insufficient sBTC balance");
        console.log("   - Contract execution limits");
        console.log("   - Network issues");
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("COMPLETION ATTEMPT FINISHED");
  console.log("=".repeat(50));

  console.log("\n💡 Next steps:");
  console.log("   1. Wait 5-10 minutes for full blockchain sync");
  console.log("   2. Check contract status manually");
  console.log("   3. If completed, test claiming with exec-claim.ts");
  console.log("   4. If not completed, check what's preventing completion");
}

main()
  .then(() => {
    console.log("\n✅ Script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
