// exec-register-agents.ts
import {
  makeContractCall,
  SignedContractCallOptions,
  principalCV,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
} from "../utilities";
import { readFileSync } from "fs";
import { getKnownAddress } from "@aibtc/types";

const DEPLOYER_ADDRESSES = {
  mainnet: getKnownAddress("mainnet", "DEPLOYER"),
  testnet: getKnownAddress("testnet", "DEPLOYER"),
};

const usage = [
  "Usage: bun run exec-register-agents.ts <agents_file>",
  "",
  "Files:",
  "  agents_file should be a JSON file with agent account addresses",
  '  JSON format: ["address1.contract1", "address2.contract2", ...]',
  "  Example:",
  '    ["ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.aibtc-acct-ST3C2-Y8X0S-ST29W-FAM0V",',
  '     "ST1ABC123DEF456.another-agent-account"]',
  "",
  "Network contracts:",
  "  Testnet: ST29D6YMDNAKN1P045T6Z817RTE1AC0JAAAG2EQZZ.agent-account-registry",
  "  Mainnet: SP29D6YMDNAKN1P045T6Z817RTE1AC0JAA99WAX2B.agent-account-registry",
  "",
  "IMPORTANT - Authorization Required:",
  "  This tool can only be run by the deployer addresses:",
  `  Testnet: ${DEPLOYER_ADDRESSES.testnet}`,
  `  Mainnet: ${DEPLOYER_ADDRESSES.mainnet}`,
  "  Make sure your mnemonic/account derives to one of these addresses.",
  "",
  "Function: register-agent-account",
].join("\n");

const usageExample = [
  "Examples:",
  "  bun run exec-register-agents.ts agents.json",
  "  bun run exec-register-agents.ts testnet-agents.json",
].join("\n");

function validateArgs(): { agentsFile: string } {
  const [agentsFile] = process.argv.slice(2);

  if (!agentsFile) {
    throw new Error(`Missing agents file argument\n${usage}\n${usageExample}`);
  }

  return { agentsFile };
}

function getRegistryContract(network: string): string {
  if (network === "testnet") {
    return getKnownAddress("testnet", "FAKTORY_REGISTRY");
  } else if (network === "mainnet") {
    return getKnownAddress("mainnet", "FAKTORY_REGISTRY");
  } else {
    throw new Error(`Unsupported network: ${network}`);
  }
}

function validateDeployerAddress(network: string, address: string) {
  const expectedAddress =
    DEPLOYER_ADDRESSES[network as keyof typeof DEPLOYER_ADDRESSES];

  if (!expectedAddress) {
    throw new Error(`Unsupported network: ${network}`);
  }

  if (address !== expectedAddress) {
    throw new Error(
      `Authorization Error: This tool can only be run by the deployer address.\n` +
        `Expected address for ${network}: ${expectedAddress}\n` +
        `Your address: ${address}\n\n` +
        `Make sure your mnemonic/account configuration derives to the correct deployer address.`
    );
  }

  console.log(`✅ Authorization verified: Using deployer address ${address}`);
}

function loadAgents(filePath: string): string[] {
  try {
    const fileContent = readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    if (!Array.isArray(data)) {
      throw new Error(
        "Agents file should contain an array of agent account strings"
      );
    }

    if (data.length === 0) {
      throw new Error("No agents found in JSON file");
    }

    // Validate each agent account
    data.forEach((agentAccount: any, index: number) => {
      if (typeof agentAccount !== "string") {
        throw new Error(
          `Invalid agent account at index ${index}: ${JSON.stringify(
            agentAccount
          )}. Expected string.`
        );
      }

      // Basic validation for principal format (address.contract-name)
      const parts = agentAccount.split(".");
      if (
        parts.length !== 2 ||
        parts[0].length === 0 ||
        parts[1].length === 0
      ) {
        throw new Error(
          `Invalid agent account format at index ${index}: ${agentAccount}. Expected format: ADDRESS.CONTRACT-NAME`
        );
      }
    });

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in agents file: ${filePath}`);
    }
    throw new Error(
      `Failed to load agents file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function createRegistrationBatches(
  registryContract: string,
  senderAddress: string,
  agents: string[]
) {
  const BATCH_SIZE = 10;
  const batches = [];

  for (let i = 0; i < agents.length; i += BATCH_SIZE) {
    const batchAgents = agents.slice(i, i + BATCH_SIZE);

    batches.push({
      agents: batchAgents,
      batchIndex: Math.floor(i / BATCH_SIZE),
      batchSize: batchAgents.length,
      isLastBatch: i + BATCH_SIZE >= agents.length,
    });
  }

  return {
    type: "batched",
    batches,
    totalBatches: batches.length,
    totalAgents: agents.length,
    registryContract,
  };
}

async function executeRegistrations(
  registrationBatches: any,
  networkObj: any,
  key: string,
  address: string
) {
  console.log(`🚀 Starting agent registration process...`);
  console.log(`Total batches: ${registrationBatches.totalBatches}`);
  console.log(`Total agents: ${registrationBatches.totalAgents}`);

  const results = [];
  let successCount = 0;
  let failureCount = 0;
  let currentNonce = await getNextNonce(CONFIG.NETWORK, address);

  for (let i = 0; i < registrationBatches.batches.length; i++) {
    const batch = registrationBatches.batches[i];
    console.log(
      `\n📤 Processing batch ${i + 1}/${registrationBatches.totalBatches}`
    );
    console.log(`Agents in batch: ${batch.batchSize}`);

    const batchResults = [];

    for (const agentAccount of batch.agents) {
      try {
        console.log(`  📝 Registering: ${agentAccount}`);

        // Parse registry contract
        const [contractAddress, contractName] =
          registrationBatches.registryContract.split(".");

        const txOptions: SignedContractCallOptions = {
          contractAddress,
          contractName,
          functionName: "register-agent-account",
          functionArgs: [principalCV(agentAccount)],
          network: networkObj,
          nonce: currentNonce,
          senderKey: key,
          fee: 1000,
        };

        console.log(`    TX options:`, {
          ...txOptions,
          senderKey: "REDACTED",
        });

        const transaction = await makeContractCall(txOptions);
        const broadcastResponse = await broadcastTx(transaction, networkObj);

        if (broadcastResponse.success) {
          console.log(
            `    ✅ Success: ${
              (broadcastResponse as any).result?.txid || "Transaction sent"
            }`
          );
          successCount++;
          currentNonce++;
        } else {
          console.log(`    ❌ Failed: ${broadcastResponse.message}`);
          failureCount++;

          // Check for authorization-related errors
          if (
            broadcastResponse.message &&
            (broadcastResponse.message.includes("unauthorized") ||
              broadcastResponse.message.includes("permission") ||
              broadcastResponse.message.includes("owner"))
          ) {
            console.log(
              `    ⚠️  This may be an authorization issue. Ensure you're using the deployer address: ${
                DEPLOYER_ADDRESSES[
                  CONFIG.NETWORK as keyof typeof DEPLOYER_ADDRESSES
                ]
              }`
            );
          }
        }

        batchResults.push({
          agentAccount: agentAccount,
          result: broadcastResponse,
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`    ❌ Error registering ${agentAccount}: ${error}`);
        failureCount++;
        batchResults.push({
          agentAccount: agentAccount,
          result: {
            success: false,
            message: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    results.push({
      batchIndex: i,
      batchResults,
    });

    if (i < registrationBatches.batches.length - 1) {
      console.log("⏳ Waiting 5 seconds before next batch...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  return {
    type: "agent_registration",
    totalBatches: registrationBatches.totalBatches,
    totalAgents: registrationBatches.totalAgents,
    successCount,
    failureCount,
    registryContract: registrationBatches.registryContract,
    results,
  };
}

async function main() {
  console.log(`🏁 Agent Registration Tool`);
  console.log(`Network: ${CONFIG.NETWORK}`);

  const args = validateArgs();

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  // Validate that we're using the correct deployer address
  validateDeployerAddress(CONFIG.NETWORK, address);

  const registryContract = getRegistryContract(CONFIG.NETWORK);
  console.log(`Registry contract: ${registryContract}`);

  console.log(`📂 Loading agents from ${args.agentsFile}...`);
  const agents = loadAgents(args.agentsFile);
  console.log(`✅ Loaded ${agents.length} agents`);

  const registrationBatches = await createRegistrationBatches(
    registryContract,
    address,
    agents
  );

  return await executeRegistrations(
    registrationBatches,
    networkObj,
    key,
    address
  );
}

main()
  .then((result) => {
    console.log(`\n🎉 Registration process completed!`);
    console.log(`✅ Successful registrations: ${result.successCount}`);
    console.log(`❌ Failed registrations: ${result.failureCount}`);

    const toolResponse = {
      success: true,
      message: "Agent registration completed",
      result: result,
    };
    sendToLLM(toolResponse);
  })
  .catch((error) => {
    console.error(`❌ Registration failed:`, error);
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
