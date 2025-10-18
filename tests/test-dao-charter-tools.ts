import Bun from "bun";

// --- Configuration ---

const targetSymbol = "aitest4";

// TODO: expose from the types package?
// const registry = setupFullContractRegistry();

const DAO_CHARTER_CONTRACT = `ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.${targetSymbol}-dao-charter`;
const TEST_CHARTER_TEXT_1 = "technocapital";
const TEST_CHARTER_TEXT_2 = "acceleration";
const TEST_MONARCH_PRINCIPAL_1 = "ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18";
const TEST_MONARCH_PRINCIPAL_2 = "ST3ZA8Z9DHHM612MYXNT96DJ3E1N7J04ZKQ3H2FSP";
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
  const basePath = "src/aibtc-cohort-0/dao-tools/extensions/dao-charter";

  // --- Initial State Read-Only Functions ---
  console.log("\n--- Checking Initial State ---");
  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-dao-charter.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get DAO Charter (Initial)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-dao-monarch.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get DAO Monarch (Initial)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-current-dao-charter.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get Current DAO Charter (Initial)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-current-dao-monarch.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get Current DAO Monarch (Initial)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-current-dao-charter-index.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get Current DAO Charter Index (Initial)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-current-dao-monarch-index.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get Current DAO Monarch Index (Initial)"
  );
  await delay(TEST_DELAY_MS);

  // --- Public (Transaction) Functions: Set DAO Charter Cycle ---
  console.log("\n--- Set DAO Charter Cycle ---");
  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/set-dao-charter.ts`,
      DAO_CHARTER_CONTRACT,
      TEST_CHARTER_TEXT_1,
    ],
    "Set DAO Charter to Text 1"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-dao-charter.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get DAO Charter (After Set to Text 1)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-current-dao-charter.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get Current DAO Charter (After Set to Text 1)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-current-dao-charter-index.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get Current DAO Charter Index (After Set to Text 1)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/set-dao-charter.ts`,
      DAO_CHARTER_CONTRACT,
      TEST_CHARTER_TEXT_2,
    ],
    "Set DAO Charter to Text 2"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-dao-charter.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get DAO Charter (After Set to Text 2)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-current-dao-charter.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get Current DAO Charter (After Set to Text 2)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-current-dao-charter-index.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get Current DAO Charter Index (After Set to Text 2)"
  );
  await delay(TEST_DELAY_MS);

  // --- Public (Transaction) Functions: Set DAO Monarch Cycle ---
  console.log("\n--- Set DAO Monarch Cycle ---");
  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/set-dao-monarch.ts`,
      DAO_CHARTER_CONTRACT,
      TEST_MONARCH_PRINCIPAL_1,
    ],
    "Set DAO Monarch to Principal 1"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-dao-monarch.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get DAO Monarch (After Set to Principal 1)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-current-dao-monarch.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get Current DAO Monarch (After Set to Principal 1)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-current-dao-monarch-index.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get Current DAO Monarch Index (After Set to Principal 1)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/set-dao-monarch.ts`,
      DAO_CHARTER_CONTRACT,
      TEST_MONARCH_PRINCIPAL_2,
    ],
    "Set DAO Monarch to Principal 2"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-dao-monarch.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get DAO Monarch (After Set to Principal 2)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-current-dao-monarch.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get Current DAO Monarch (After Set to Principal 2)"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-current-dao-monarch-index.ts`,
      DAO_CHARTER_CONTRACT,
    ],
    "Get Current DAO Monarch Index (After Set to Principal 2)"
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
