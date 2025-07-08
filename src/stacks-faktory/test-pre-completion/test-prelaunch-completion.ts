// test-prelaunch-completion.ts
// Simulate 10 users buying 20 seats to complete pre-launch
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
  "ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.fast11-pre-faktory";
const TOTAL_SEATS_NEEDED = 20;
const MIN_USERS_NEEDED = 10;

const faktoryConfig = {
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
};

async function buySeatsForAccount(accountIndex: number, seatCount: number) {
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

    // Use v6 pattern
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
      return true;
    } else {
      console.log(`❌ Account ${accountIndex}: Failed to buy seats`);
      return false;
    }
  } catch (error: any) {
    console.log(`❌ Account ${accountIndex}: Error - ${error.message}`);
    return false;
  }
}

async function checkPrelaunchStatus() {
  console.log("\n📊 Checking pre-launch status...");

  try {
    const { address } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      0
    );
    const sdk = new FaktorySDK(faktoryConfig);

    const status = await sdk.getPrelaunchStatus(PRELAUNCH_CONTRACT, address);

    const totalUsers = status.status.value.value["total-users"].value;
    const totalSeats = status.status.value.value["total-seats-taken"].value;
    const isDistribution =
      status.status.value.value["is-distribution-period"].value;
    const remainingSeats =
      status.remainingSeats.value.value["remainin-seats"].value;

    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Total seats taken: ${totalSeats}`);
    console.log(`   Remaining seats: ${remainingSeats}`);
    console.log(`   Distribution period: ${isDistribution ? "YES" : "NO"}`);

    return {
      totalUsers: Number(totalUsers),
      totalSeats: Number(totalSeats),
      isDistribution: Boolean(isDistribution),
      remainingSeats: Number(remainingSeats),
    };
  } catch (error: any) {
    console.log(`❌ Status check failed: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log("🚀 Pre-launch Completion Test");
  console.log("=============================");
  console.log(`Contract: ${PRELAUNCH_CONTRACT}`);
  console.log(`Target: ${MIN_USERS_NEEDED} users, ${TOTAL_SEATS_NEEDED} seats`);

  // Check initial status
  await checkPrelaunchStatus();

  let totalSeatsBought = 0;
  let successfulUsers = 0;

  // Strategy: 10 users, 2 seats each = 20 seats
  for (let accountIndex = 0; accountIndex <= 9; accountIndex++) {
    const seatsToBuy = 2;
    const success = await buySeatsForAccount(accountIndex, seatsToBuy);

    if (success) {
      totalSeatsBought += seatsToBuy;
      successfulUsers++;

      console.log(
        `📈 Progress: ${successfulUsers}/${MIN_USERS_NEEDED} users, ${totalSeatsBought}/${TOTAL_SEATS_NEEDED} seats`
      );

      console.log(`   Waiting 1 second before checking status...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check status after each purchase
      const status = await checkPrelaunchStatus();

      if (status?.isDistribution) {
        console.log("\n🎉 PRE-LAUNCH COMPLETED!");
        console.log("   ✅ Distribution period has started!");
        console.log("   📡 Token claiming is now available!");
        break;
      }

      // Check if we've hit the target manually
      if (
        successfulUsers >= MIN_USERS_NEEDED &&
        totalSeatsBought >= TOTAL_SEATS_NEEDED
      ) {
        console.log("\n🎯 Target reached! Should trigger completion...");
      }
    }

    // Rate limiting delay
    console.log(`   Waiting 5 seconds before next account...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  // Final status check
  console.log("\n" + "=".repeat(50));
  console.log("FINAL STATUS");
  console.log("=".repeat(50));
  const finalStatus = await checkPrelaunchStatus();

  console.log("\n📋 Summary:");
  console.log(`   Users participated: ${successfulUsers}`);
  console.log(`   Total seats bought: ${totalSeatsBought}`);
  console.log(
    `   Pre-launch completed: ${finalStatus?.isDistribution ? "YES" : "NO"}`
  );

  if (finalStatus?.isDistribution) {
    console.log("\n💡 Next steps:");
    console.log("   - Test claiming tokens with exec-claim.ts");
    console.log("   - Test refunding seats with exec-refund.ts");
  }
}

main()
  .then(() => {
    console.log("\n✅ Test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
