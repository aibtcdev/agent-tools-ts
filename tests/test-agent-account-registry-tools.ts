import Bun from "bun";

// --- Configuration ---
// Note: These values should be updated to match the deployed contract and account addresses.
const REGISTRY_CONTRACT =
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.agent-account-registry";
const AGENT_ACCOUNT_TO_TEST =
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test";
const OWNER_PRINCIPAL = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const AGENT_PRINCIPAL = "ST20B4P152W5SA1Y5M05ECX5X5Y5D4RBPYJ3R4G31";
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
  const basePath = "src/aibtc-cohort-0/agent-account-registry";

  // --- Initial State Read-Only Functions ---
  console.log("\n--- Checking Initial State ---");
  runTool(
    ["bun", "run", `${basePath}/read-only/get-registry-config.ts`, REGISTRY_CONTRACT],
    "Get Registry Configuration"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-agent-account-info.ts`,
      REGISTRY_CONTRACT,
      AGENT_ACCOUNT_TO_TEST,
    ],
    "Get Agent Account Info (Initial)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-agent-account-by-owner.ts`,
      REGISTRY_CONTRACT,
      OWNER_PRINCIPAL,
    ],
    "Get Agent Account by Owner (Initial)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-agent-account-by-agent.ts`,
      REGISTRY_CONTRACT,
      AGENT_PRINCIPAL,
    ],
    "Get Agent Account by Agent (Initial)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-account-attestors.ts`,
      REGISTRY_CONTRACT,
      AGENT_ACCOUNT_TO_TEST,
    ],
    "Get Account Attestors (Initial)"
  );
  await delay(TEST_DELAY_MS);

  // --- Public (Transaction) Functions ---
  console.log("\n--- Executing Transactions ---");
  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/register-agent-account.ts`,
      REGISTRY_CONTRACT,
      AGENT_ACCOUNT_TO_TEST,
    ],
    "Register Agent Account"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/attest-agent-account.ts`,
      REGISTRY_CONTRACT,
      AGENT_ACCOUNT_TO_TEST,
    ],
    "Attest Agent Account"
  );
  await delay(TEST_DELAY_MS);

  // --- Final State Read-Only Functions ---
  console.log("\n--- Checking Final State ---");
  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-agent-account-info.ts`,
      REGISTRY_CONTRACT,
      AGENT_ACCOUNT_TO_TEST,
    ],
    "Get Agent Account Info (Final)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-agent-account-by-owner.ts`,
      REGISTRY_CONTRACT,
      OWNER_PRINCIPAL,
    ],
    "Get Agent Account by Owner (Final)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-agent-account-by-agent.ts`,
      REGISTRY_CONTRACT,
      AGENT_PRINCIPAL,
    ],
    "Get Agent Account by Agent (Final)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-account-attestors.ts`,
      REGISTRY_CONTRACT,
      AGENT_ACCOUNT_TO_TEST,
    ],
    "Get Account Attestors (Final)"
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
