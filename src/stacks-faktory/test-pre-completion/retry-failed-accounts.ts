// retry-failed-accounts.ts
// Retry specific accounts that failed due to API rate limiting
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

// Failed accounts from the test results
const FAILED_ACCOUNTS = [2, 3, 9];
const SEATS_PER_ACCOUNT = 2;

const faktoryConfig = {
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
};

// Enhanced delay with exponential backoff
async function waitWithBackoff(baseDelay: number, attempt: number = 0) {
  const delay = baseDelay * Math.pow(1.5, attempt);
  console.log(`   ⏳ Waiting ${delay / 1000}s before retry...`);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

async function buySeatsForAccount(
  accountIndex: number,
  seatCount: number,
  maxRetries: number = 3
): Promise<boolean> {
  console.log(
    `\n👤 Account ${accountIndex}: Attempting to buy ${seatCount} seats...`
  );

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`   🔄 Retry attempt ${attempt}/${maxRetries - 1}`);
        await waitWithBackoff(10000, attempt); // Start with 10s, increase each retry
      }

      const { address, key } = await deriveChildAccount(
        CONFIG.NETWORK,
        CONFIG.MNEMONIC,
        accountIndex
      );

      const sdk = new FaktorySDK(faktoryConfig);
      const networkObj = getNetwork(CONFIG.NETWORK);

      // Add retry logic for nonce fetching
      let nonce;
      try {
        nonce = await getNextNonce(CONFIG.NETWORK, address);
      } catch (nonceError: any) {
        if (
          nonceError.message.includes("Too Many Requests") ||
          nonceError.message.includes("429")
        ) {
          console.log(`   ⚠️ Nonce fetch rate limited, waiting...`);
          await waitWithBackoff(15000, attempt);
          continue; // Retry this attempt
        }
        throw nonceError;
      }

      // Get buy seats parameters with retry logic
      let buySeatsParams;
      try {
        buySeatsParams = await sdk.getBuySeatsParams({
          prelaunchContract: PRELAUNCH_CONTRACT,
          seatCount,
          senderAddress: address,
          contractType: "dao",
        });
      } catch (paramsError: any) {
        if (
          paramsError.message.includes("Too Many Requests") ||
          paramsError.message.includes("429") ||
          paramsError.message.includes("API rate limit")
        ) {
          console.log(`   ⚠️ Params fetch rate limited, waiting...`);
          await waitWithBackoff(15000, attempt);
          continue; // Retry this attempt
        }
        throw paramsError;
      }

      // Create and broadcast transaction
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
        console.log(`❌ Account ${accountIndex}: Transaction failed`);

        // Handle the case where broadcast fails - the error details may be in different places
        let errorMessage = "Unknown transaction error";

        // Try to extract error information from the response
        if (
          broadcastResponse.data &&
          typeof broadcastResponse.data === "object"
        ) {
          const data = broadcastResponse.data as any;
          errorMessage = data.reason || data.message || JSON.stringify(data);
        }

        console.log(`   Error: ${errorMessage}`);

        // Don't retry if it's not a rate limit issue
        if (
          typeof errorMessage === "string" &&
          !errorMessage.includes("429") &&
          !errorMessage.includes("Too Many Requests")
        ) {
          return false;
        }
      }
    } catch (error: any) {
      console.log(`❌ Account ${accountIndex}: Error - ${error.message}`);

      // Check if it's a rate limit error
      if (
        error.message.includes("Too Many Requests") ||
        error.message.includes("429") ||
        error.message.includes("API rate limit")
      ) {
        console.log(`   🔄 Rate limit detected, will retry...`);
        continue; // Continue to next attempt
      } else {
        // Non-rate-limit error, don't retry
        return false;
      }
    }
  }

  console.log(
    `❌ Account ${accountIndex}: Failed after ${maxRetries} attempts`
  );
  return false;
}

async function checkPrelaunchStatus() {
  console.log("\n📊 Checking pre-launch status...");

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`   🔄 Status check retry ${attempt}/${maxRetries - 1}`);
        await waitWithBackoff(8000, attempt);
      }

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
      console.log(
        `❌ Status check attempt ${attempt + 1} failed: ${error.message}`
      );

      if (attempt === maxRetries - 1) {
        console.log("❌ All status check attempts failed");
        return null;
      }

      if (
        error.message.includes("Too Many Requests") ||
        error.message.includes("429") ||
        error.message.includes("API rate limit")
      ) {
        continue; // Retry
      } else {
        return null; // Non-rate-limit error
      }
    }
  }

  return null;
}

async function main() {
  console.log("🔄 Retry Failed Accounts Test");
  console.log("=============================");
  console.log(`Contract: ${PRELAUNCH_CONTRACT}`);
  console.log(`Failed accounts to retry: ${FAILED_ACCOUNTS.join(", ")}`);
  console.log(`Seats per account: ${SEATS_PER_ACCOUNT}`);

  // Check initial status
  const initialStatus = await checkPrelaunchStatus();

  if (initialStatus?.isDistribution) {
    console.log("\n🎉 Pre-launch already completed!");
    console.log("   Distribution period is active, no need to buy more seats.");
    return;
  }

  let successfulRetries = 0;
  let totalSeatsBought = 0;

  // Retry each failed account with increased delays between accounts
  for (let i = 0; i < FAILED_ACCOUNTS.length; i++) {
    const accountIndex = FAILED_ACCOUNTS[i];

    console.log(`\n${"=".repeat(40)}`);
    console.log(
      `Processing account ${accountIndex} (${i + 1}/${FAILED_ACCOUNTS.length})`
    );
    console.log("=".repeat(40));

    const success = await buySeatsForAccount(accountIndex, SEATS_PER_ACCOUNT);

    if (success) {
      successfulRetries++;
      totalSeatsBought += SEATS_PER_ACCOUNT;

      console.log(
        `📈 Progress: ${successfulRetries}/${FAILED_ACCOUNTS.length} failed accounts recovered`
      );

      // Check status after each successful purchase
      const status = await checkPrelaunchStatus();

      if (status?.isDistribution) {
        console.log("\n🎉 PRE-LAUNCH COMPLETED!");
        console.log("   ✅ Distribution period has started!");
        console.log("   📡 Token claiming is now available!");
        break;
      }
    }

    // Longer delay between different accounts to avoid rate limits
    if (i < FAILED_ACCOUNTS.length - 1) {
      console.log(`\n⏳ Waiting 20s before next account...`);
      await new Promise((resolve) => setTimeout(resolve, 20000));
    }
  }

  // Final status check
  console.log("\n" + "=".repeat(50));
  console.log("RETRY RESULTS");
  console.log("=".repeat(50));
  const finalStatus = await checkPrelaunchStatus();

  console.log("\n📋 Retry Summary:");
  console.log(`   Accounts attempted: ${FAILED_ACCOUNTS.length}`);
  console.log(`   Successful retries: ${successfulRetries}`);
  console.log(`   Additional seats bought: ${totalSeatsBought}`);
  console.log(
    `   Pre-launch completed: ${finalStatus?.isDistribution ? "YES" : "NO"}`
  );

  if (successfulRetries < FAILED_ACCOUNTS.length) {
    console.log("\n⚠️ Some accounts still failed:");
    const stillFailed = FAILED_ACCOUNTS.filter(
      (_, index) => index >= successfulRetries
    );
    console.log(`   Remaining failed accounts: ${stillFailed.join(", ")}`);
    console.log(
      "   💡 Consider running this script again or increasing delays"
    );
  }

  if (finalStatus?.isDistribution) {
    console.log("\n💡 Next steps:");
    console.log("   - Test claiming tokens with exec-claim.ts");
    console.log("   - Test refunding seats with exec-refund.ts");
  } else if (finalStatus) {
    console.log("\n💡 Next steps:");
    console.log(`   - Need ${20 - finalStatus.totalSeats} more seats`);
    console.log(`   - Need ${10 - finalStatus.totalUsers} more users`);
    console.log(
      "   - Consider running original test or this retry script again"
    );
  }
}

main()
  .then(() => {
    console.log("\n✅ Retry test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Retry test failed:", error);
    process.exit(1);
  });
