import { getKnownAddress } from "@aibtc/types";
import Bun from "bun";

// --- Configuration ---

const targetSymbol = "fake17";

// TODO: expose from the types package?
// const registry = setupFullContractRegistry();

const DAO_RUN_COST_CONTRACT = getKnownAddress("testnet", "AIBTC_RUN_COST");
const TEST_TOKEN = `ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.${targetSymbol}-faktory`;
const TEST_OWNER = "ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18";
const TEST_RECIPIENT = "ST3ZA8Z9DHHM612MYXNT96DJ3E1N7J04ZKQ3H2FSP";
const TEST_AMOUNT = "1000";
const TEST_REQUIRED_1 = "3";
const TEST_REQUIRED_2 = "1";
const TEST_DELAY_MS = 5000; // Delay between tests in milliseconds

// --- Test Counters ---
let successCount = 0;
let failureCount = 0;

/**
 * Pauses execution for a specified number of milliseconds.
 * @param ms The number of milliseconds to wait.
 */
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Executes a shell command using Bun.spawnSync and logs its output.
 * @param command The command to execute as an array of strings.
 * @param description A description of the test being run.
 */
function runTool(command: string[], description: string) {
  console.log(`\n=================================================`);
  console.log(`🚀 Testing: ${description}`);
  console.log(`   Command: ${command.join(" ")}`);
  console.log(`-------------------------------------------------\n`);

  try {
    const result = Bun.spawnSync(command, {
      stderr: "pipe", // Pipe stderr to capture its output
    });

    if (result.success) {
      console.log(`✅ Success (Exit Code: ${result.exitCode})`);
      if (result.stdout && result.stdout.length > 0) {
        console.log("Output (stdout):");
        console.log(new TextDecoder().decode(result.stdout));
      }
      successCount++;
    } else {
      console.error(`❌ Failed (Exit Code: ${result.exitCode})`);
      if (result.stderr && result.stderr.length > 0) {
        console.error("Error Output (stderr):");
        console.error(new TextDecoder().decode(result.stderr));
      }
      // Also log stdout on failure, as some scripts might output errors there.
      if (result.stdout && result.stdout.length > 0) {
        console.error("Output (stdout):");
        console.error(new TextDecoder().decode(result.stdout));
      }
      failureCount++;
    }
  } catch (error) {
    console.error("💥 Execution Failed with an exception:");
    console.error(error);
    failureCount++;
  }
  console.log(`=================================================\n`);
}

/**
 * Main function to run all tool tests.
 */
async function main() {
  const basePath = "src/aibtc-cohort-0/dao-run-cost";
  let currentNonce = 1;

  // --- Initial State Read-Only Functions ---
  console.log("\n--- Checking Initial State ---");
  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-contract-info.ts`,
      DAO_RUN_COST_CONTRACT,
    ],
    "Get Contract Info"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-total-owners.ts`,
      DAO_RUN_COST_CONTRACT,
    ],
    "Get Total Owners"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-confirmations-required.ts`,
      DAO_RUN_COST_CONTRACT,
    ],
    "Get Confirmations Required"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/is-owner.ts`,
      DAO_RUN_COST_CONTRACT,
      TEST_OWNER,
    ],
    "Is Owner (Initial)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/is-allowed-asset.ts`,
      DAO_RUN_COST_CONTRACT,
      TEST_TOKEN,
    ],
    "Is Allowed Asset (Initial)"
  );
  await delay(TEST_DELAY_MS);

  // --- Public (Transaction) Functions: Set Owner Cycle ---
  console.log("\n--- Set Owner Cycle ---");
  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/set-owner.ts`,
      DAO_RUN_COST_CONTRACT,
      String(currentNonce++),
      TEST_OWNER,
      "true",
    ],
    "Set Owner to True"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/is-owner.ts`,
      DAO_RUN_COST_CONTRACT,
      TEST_OWNER,
    ],
    "Is Owner (After Set True)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/set-owner.ts`,
      DAO_RUN_COST_CONTRACT,
      String(currentNonce++),
      TEST_OWNER,
      "false",
    ],
    "Set Owner to False"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/is-owner.ts`,
      DAO_RUN_COST_CONTRACT,
      TEST_OWNER,
    ],
    "Is Owner (After Set False)"
  );
  await delay(TEST_DELAY_MS);

  // --- Public (Transaction) Functions: Set Confirmations Cycle ---
  console.log("\n--- Set Confirmations Cycle ---");
  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/set-confirmations.ts`,
      DAO_RUN_COST_CONTRACT,
      String(currentNonce++),
      TEST_REQUIRED_1,
    ],
    "Set Confirmations to 3"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-confirmations-required.ts`,
      DAO_RUN_COST_CONTRACT,
    ],
    "Get Confirmations Required (After Set to 3)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/set-confirmations.ts`,
      DAO_RUN_COST_CONTRACT,
      String(currentNonce++),
      TEST_REQUIRED_2,
    ],
    "Set Confirmations to 1"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-confirmations-required.ts`,
      DAO_RUN_COST_CONTRACT,
    ],
    "Get Confirmations Required (After Set to 1)"
  );
  await delay(TEST_DELAY_MS);

  // --- Public (Transaction) Functions: Set Asset Cycle ---
  console.log("\n--- Set Asset Cycle ---");
  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/set-asset.ts`,
      DAO_RUN_COST_CONTRACT,
      String(currentNonce++),
      TEST_TOKEN,
      "true",
    ],
    "Set Asset to True"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/is-allowed-asset.ts`,
      DAO_RUN_COST_CONTRACT,
      TEST_TOKEN,
    ],
    "Is Allowed Asset (After Set True)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/set-asset.ts`,
      DAO_RUN_COST_CONTRACT,
      String(currentNonce++),
      TEST_TOKEN,
      "false",
    ],
    "Set Asset to False"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/is-allowed-asset.ts`,
      DAO_RUN_COST_CONTRACT,
      TEST_TOKEN,
    ],
    "Is Allowed Asset (After Set False)"
  );
  await delay(TEST_DELAY_MS);

  // --- Public (Transaction) Functions: Transfer Token ---
  console.log("\n--- Transfer Token ---");
  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/transfer-token.ts`,
      DAO_RUN_COST_CONTRACT,
      String(currentNonce++),
      TEST_TOKEN,
      TEST_AMOUNT,
      TEST_RECIPIENT,
    ],
    "Transfer Token"
  );
  await delay(TEST_DELAY_MS);

  // --- Final State Read-Only Functions ---
  console.log("\n--- Checking Final State ---");
  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-contract-info.ts`,
      DAO_RUN_COST_CONTRACT,
    ],
    "Get Contract Info (Final)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-total-owners.ts`,
      DAO_RUN_COST_CONTRACT,
    ],
    "Get Total Owners (Final)"
  );
  await delay(TEST_DELAY_MS);

  // --- Final Summary ---
  console.log("\n\n--- Test Summary ---");
  console.log(`Total Tests: ${successCount + failureCount}`);
  console.log(`✅ Successes: ${successCount}`);
  console.log(`❌ Failures:  ${failureCount}`);
  console.log("--------------------\n");

  if (failureCount > 0) {
    console.error("⚠️ Some tests failed. Exiting with error code 1.");
    process.exit(1);
  } else {
    console.log("✅ All tests completed successfully.");
  }
}

main();
