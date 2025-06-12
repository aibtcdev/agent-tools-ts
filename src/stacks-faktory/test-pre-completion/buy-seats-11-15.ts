// buy-seats-11-15.ts
// Buy 1 seat each from accounts 11 to 15
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
  seatCount: number = 1
): Promise<boolean> {
  console.log(`\n👤 Account ${accountIndex}: Buying ${seatCount} seat(s)...`);

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
        `✅ Account ${accountIndex}: Successfully bought ${seatCount} seat(s)`
      );
      console.log(`   TX: ${broadcastResponse.data?.txid}`);
      console.log(`   Cost: ${buySeatsParams.estimatedCost} satoshis`);

      if (buySeatsParams.willCompleteLaunch) {
        console.log("   🎉 This purchase should complete the pre-launch!");
      }

      return true;
    } else {
      console.log(`❌ Account ${accountIndex}: Transaction failed`);
      console.log(`   Error: ${broadcastResponse.error}`);
      return false;
    }
  } catch (error: any) {
    console.log(`❌ Account ${accountIndex}: Error - ${error.message}`);
    return false;
  }
}

async function buySeatsSequentially() {
  const accounts = [11, 12, 13, 14, 15];
  const results: { account: number; success: boolean }[] = [];

  for (const accountIndex of accounts) {
    const success = await buySeatsForAccount(accountIndex, 1);
    results.push({ account: accountIndex, success });

    // Wait 2 seconds between transactions to avoid nonce conflicts
    if (accountIndex < 15) {
      console.log("⏳ Waiting 2 seconds before next transaction...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return results;
}

async function main() {
  console.log("🎯 Buy 1 Seat from Accounts 11-15");
  console.log("==================================");
  console.log(`Contract: ${PRELAUNCH_CONTRACT}`);
  console.log("Strategy: Buy 1 seat each from accounts 11, 12, 13, 14, 15");

  console.log("\n🚀 Starting seat purchases...");

  const results = await buySeatsSequentially();

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("PURCHASE SUMMARY");
  console.log("=".repeat(50));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful purchases: ${successful.length}/5`);
  if (successful.length > 0) {
    console.log("   Accounts:", successful.map((r) => r.account).join(", "));
  }

  if (failed.length > 0) {
    console.log(`❌ Failed purchases: ${failed.length}/5`);
    console.log("   Accounts:", failed.map((r) => r.account).join(", "));
  }

  console.log(`\n📊 Total seats purchased: ${successful.length}`);

  if (successful.length > 0) {
    console.log("\n💡 Next steps:");
    console.log("   1. Wait 5-10 minutes for blockchain confirmation");
    console.log("   2. Check if pre-launch completed");
    console.log("   3. If completed, test token claiming");
  }
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
