import Bun from "bun";

// --- Configuration ---
const DAO_ACTION_PROPOSAL_VOTING_CONTRACT =
  "ST3DD7MASYJADCFXN3745R11RVM4PCXCPVRS3V27K.fast-action-proposal-voting";
const ACTION_CONTRACT_TO_EXECUTE =
  "ST3DD7MASYJADCFXN3745R11RVM4PCXCPVRS3V27K.fast-action-send-message";
const DAO_TOKEN_CONTRACT =
  "ST3DD7MASYJADCFXN3745R11RVM4PCXCPVRS3V27K.fast-faktory";
const VOTER_ADDRESS = "ST1B9N1SJPRK9D3H98FWGT8AXEGH8T4BH5P38Z4ZC";
const PROPOSAL_ID = "30";
const STACKS_BLOCK_HEIGHT = "2114000";
const MESSAGE_TO_SEND = "A test message from our test script. TEST.";
const MEMO = "A test memo because that's another way to pass data.";

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
    const result = Bun.spawnSync(command);

    if (result.success) {
      console.log(`✅ Success (Exit Code: ${result.exitCode})`);
      if (result.stdout && result.stdout.length > 0) {
        console.log("Output (stdout):");
        console.log(new TextDecoder().decode(result.stdout));
      }
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
    }
  } catch (error) {
    console.error("💥 Execution Failed with an exception:");
    console.error(error);
  }
  console.log(`=================================================\n`);
}

/**
 * Main function to run all tool tests.
 */
function main() {
  const basePath =
    "src/aibtc-cohort-0/dao-tools/extensions/action-proposal-voting";

  // --- Read-Only Functions ---
  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-voting-configuration.ts`,
      DAO_ACTION_PROPOSAL_VOTING_CONTRACT,
    ],
    "Get Voting Configuration"
  );

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-total-proposals.ts`,
      DAO_ACTION_PROPOSAL_VOTING_CONTRACT,
    ],
    "Get Total Proposals"
  );

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-proposal.ts`,
      DAO_ACTION_PROPOSAL_VOTING_CONTRACT,
      PROPOSAL_ID,
    ],
    "Get a specific Proposal"
  );

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-liquid-supply.ts`,
      DAO_ACTION_PROPOSAL_VOTING_CONTRACT,
      STACKS_BLOCK_HEIGHT,
    ],
    "Get Liquid Supply at a specific block height"
  );

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-voting-power.ts`,
      DAO_ACTION_PROPOSAL_VOTING_CONTRACT,
      PROPOSAL_ID,
      VOTER_ADDRESS,
    ],
    "Get Voting Power for a user on a proposal"
  );

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-vote-record.ts`,
      DAO_ACTION_PROPOSAL_VOTING_CONTRACT,
      PROPOSAL_ID,
      VOTER_ADDRESS,
    ],
    "Get a user's Vote Record for a proposal"
  );

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-veto-vote-record.ts`,
      DAO_ACTION_PROPOSAL_VOTING_CONTRACT,
      PROPOSAL_ID,
      VOTER_ADDRESS,
    ],
    "Get a user's Veto Vote Record for a proposal"
  );

  runTool(
    [
      "bun",
      "run",
      `${basePath}/read-only/get-vote-records.ts`,
      DAO_ACTION_PROPOSAL_VOTING_CONTRACT,
      PROPOSAL_ID,
      VOTER_ADDRESS,
    ],
    "Get a user's full Vote Records for a proposal"
  );

  // --- Public (Transaction) Functions ---
  // Note: These will likely fail if on-chain conditions aren't met (e.g., proposal doesn't exist).
  // The test will still show the script's error output, which is useful for verification.

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/create-action-proposal.ts`,
      DAO_ACTION_PROPOSAL_VOTING_CONTRACT,
      ACTION_CONTRACT_TO_EXECUTE,
      MESSAGE_TO_SEND,
      DAO_TOKEN_CONTRACT,
      MEMO,
    ],
    "Create an Action Proposal"
  );

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/vote-on-action-proposal.ts`,
      DAO_ACTION_PROPOSAL_VOTING_CONTRACT,
      PROPOSAL_ID,
      "true",
    ],
    "Vote 'FOR' on an Action Proposal"
  );

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/veto-action-proposal.ts`,
      DAO_ACTION_PROPOSAL_VOTING_CONTRACT,
      PROPOSAL_ID,
    ],
    "Veto an Action Proposal"
  );

  runTool(
    [
      "bun",
      "run",
      `${basePath}/public/conclude-action-proposal.ts`,
      DAO_ACTION_PROPOSAL_VOTING_CONTRACT,
      PROPOSAL_ID,
      ACTION_CONTRACT_TO_EXECUTE,
      DAO_TOKEN_CONTRACT,
    ],
    "Conclude an Action Proposal"
  );

  console.log("✅ All tests completed.");
}

main();
