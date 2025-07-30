import Bun from "bun";
import { AGENT_ACCOUNT_APPROVAL_TYPES } from "@aibtc/types";

// --- Configuration ---

const AGENT_ACCOUNT_CONTRACT =
  "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.aibtc-acct-ST3YT-S5D18-ST29T-BAZND";
const ASSET_CONTRACT =
  "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.slow12-faktory";
const DEX_CONTRACT =
  "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.fast12-faktory-dex";
const VOTING_CONTRACT =
  "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.fast12-action-proposal-voting";
const DAO_TOKEN_CONTRACT =
  "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.fast12-faktory";
const ACTION_CONTRACT =
  "ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.fast12-action-send-message";
const PROPOSAL_ID = "1";
const AMOUNT_TO_DEPOSIT_FT = "1000";
const AMOUNT_TO_DEPOSIT_STX = "1000000"; // 1 STX in microSTX
const AMOUNT_TO_TRADE = "500";
const PROPOSAL_PARAMETERS_HEX = "68656c6c6f20776f726c64"; // "hello world"
const PROPOSAL_MEMO = "A test proposal from the agent account";
const VOTE_CHOICE = "true";
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
  const basePath = "src/aibtc-cohort-0/agent-account";

  // --- Read-Only Functions ---
  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-configuration.ts`,
      AGENT_ACCOUNT_CONTRACT,
    ],
    "Get Agent Account Configuration"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/is-approved-contract.ts`,
      AGENT_ACCOUNT_CONTRACT,
      ASSET_CONTRACT,
      String(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN),
    ],
    "Check if Asset is Approved"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/is-approved-contract.ts`,
      AGENT_ACCOUNT_CONTRACT,
      DEX_CONTRACT,
      String(AGENT_ACCOUNT_APPROVAL_TYPES.SWAP),
    ],
    "Check if DEX is Approved"
  );
  await delay(TEST_DELAY_MS);

  // --- Approve/Revoke Cycle ---
  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/approve-contract.ts`,
      AGENT_ACCOUNT_CONTRACT,
      VOTING_CONTRACT,
      "VOTING",
    ],
    "Approve Voting Contract"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/is-approved-contract.ts`,
      AGENT_ACCOUNT_CONTRACT,
      VOTING_CONTRACT,
      "VOTING",
    ],
    "Check if Voting Contract is Approved"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/revoke-contract.ts`,
      AGENT_ACCOUNT_CONTRACT,
      VOTING_CONTRACT,
      "VOTING",
    ],
    "Revoke Voting Contract"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/is-approved-contract.ts`,
      AGENT_ACCOUNT_CONTRACT,
      VOTING_CONTRACT,
      "VOTING",
    ],
    "Check if Voting Contract is Revoked"
  );
  await delay(TEST_DELAY_MS);

  // --- Public (Transaction) Functions ---
  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/deposit-stx.ts`,
      AGENT_ACCOUNT_CONTRACT,
      AMOUNT_TO_DEPOSIT_STX,
    ],
    "Deposit STX into Agent Account"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/deposit-ft.ts`,
      AGENT_ACCOUNT_CONTRACT,
      ASSET_CONTRACT,
      AMOUNT_TO_DEPOSIT_FT,
    ],
    "Deposit FT into Agent Account"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/acct-buy-asset.ts`,
      AGENT_ACCOUNT_CONTRACT,
      DEX_CONTRACT,
      ASSET_CONTRACT,
      AMOUNT_TO_TRADE,
    ],
    "Buy Asset via Agent Account"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/acct-sell-asset.ts`,
      AGENT_ACCOUNT_CONTRACT,
      DEX_CONTRACT,
      ASSET_CONTRACT,
      AMOUNT_TO_TRADE,
    ],
    "Sell Asset via Agent Account"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/create-action-proposal.ts`,
      AGENT_ACCOUNT_CONTRACT,
      VOTING_CONTRACT,
      DAO_TOKEN_CONTRACT,
      ACTION_CONTRACT,
      PROPOSAL_PARAMETERS_HEX,
      PROPOSAL_MEMO,
    ],
    "Create Action Proposal via Agent Account"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/vote-on-action-proposal.ts`,
      AGENT_ACCOUNT_CONTRACT,
      VOTING_CONTRACT,
      PROPOSAL_ID,
      VOTE_CHOICE,
    ],
    "Vote on Action Proposal via Agent Account"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/veto-action-proposal.ts`,
      AGENT_ACCOUNT_CONTRACT,
      VOTING_CONTRACT,
      PROPOSAL_ID,
    ],
    "Veto Action Proposal via Agent Account"
  );
  await delay(TEST_DELAY_MS);

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/conclude-action-proposal.ts`,
      AGENT_ACCOUNT_CONTRACT,
      VOTING_CONTRACT,
      DAO_TOKEN_CONTRACT,
      PROPOSAL_ID,
      ACTION_CONTRACT,
    ],
    "Conclude Action Proposal via Agent Account"
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
