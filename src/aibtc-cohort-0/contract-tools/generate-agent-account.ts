import { ContractApiClient } from "../api/client";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
  validateNetwork,
} from "../../utilities";
import { validateStacksAddress } from "@stacks/transactions";
import { GeneratedContractResponse } from "@aibtc/types";
import { saveAgentAccountToFile } from "../utils/save-contract";

const usage =
  "Usage: bun run generate-agent-account.ts <ownerAddress> <agentAddress> <daoTokenContract> <daoTokenDexContract> [network] [saveToFile]";
const usageExample =
  "Example: bun run generate-agent-account.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-faktory ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-faktory-dex testnet true";

interface ExpectedArgs {
  ownerAddress: string;
  agentAddress: string;
  daoTokenContract: string;
  daoTokenDexContract: string;
  network?: string;
  saveToFile?: boolean;
}

function validateArgs(): ExpectedArgs {
  const [
    ownerAddress,
    agentAddress,
    daoTokenContract,
    daoTokenDexContract,
    network = CONFIG.NETWORK,
    saveToFileStr = "false",
  ] = process.argv.slice(2);

  if (!validateStacksAddress(ownerAddress)) {
    const errorMessage = [
      `Invalid owner address: ${ownerAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!validateStacksAddress(agentAddress)) {
    const errorMessage = [
      `Invalid agent address: ${agentAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(daoTokenContract)) {
    const errorMessage = [
      `Invalid DAO token contract: ${daoTokenContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(daoTokenDexContract)) {
    const errorMessage = [
      `Invalid DAO token DEX contract: ${daoTokenDexContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // Parse saveToFile parameter
  const saveToFile = convertStringToBoolean(saveToFileStr);

  return {
    ownerAddress,
    agentAddress,
    daoTokenContract,
    daoTokenDexContract,
    network: validateNetwork(network),
    saveToFile,
  };
}

async function main(): Promise<ToolResponse<GeneratedContractResponse>> {
  const args = validateArgs();
  const apiClient = new ContractApiClient();

  try {
    // Generate contract name in the format aibtc-acct-ABCDE-FGHIJ-KLMNO-PQRST
    const ownerFirst5 = args.ownerAddress.substring(0, 5);
    const ownerLast5 = args.ownerAddress.substring(
      args.ownerAddress.length - 5
    );
    const agentAddress = args.agentAddress;
    const agentFirst5 = agentAddress.substring(0, 5);
    const agentLast5 = agentAddress.substring(agentAddress.length - 5);
    const contractName = `aibtc-acct-${ownerFirst5}-${ownerLast5}-${agentFirst5}-${agentLast5}`;

    // Generate the agent account contract using the new endpoint
    const result = await apiClient.generateAgentAccount(
      contractName,
      args.network,
      {
        account_owner: args.ownerAddress,
        account_agent: args.agentAddress,
        dao_token: args.daoTokenContract,
        dao_token_dex: args.daoTokenDexContract,
        contractName: contractName,
      }
    );

    console.log("Result:", result);

    if (!result.success || !result.data?.contract) {
      if (result.error) {
        throw new Error(result.error.message);
      }
      throw new Error(
        `Failed to generate agent account: ${JSON.stringify(result)}`
      );
    }

    const contract = result.data.contract;
    contract.displayName = contractName;

    // Save contract to file if requested
    if (args.saveToFile) {
      await saveAgentAccountToFile(contract, args.network ?? CONFIG.NETWORK);
    }

    // Truncate source code for response
    const truncatedSource =
      contract.source && contract.source.length > 100
        ? contract.source.substring(0, 97) + "..."
        : contract.source;

    const truncatedContract = {
      ...contract,
      source: truncatedSource,
    };

    return {
      success: true,
      message: `Successfully generated agent account contract for owner ${
        args.ownerAddress
      }${args.saveToFile ? " (saved to file)" : ""}`,
      data: {
        tokenSymbol: "aibtc", // TODO: find cleaner way
        network: args.network ?? CONFIG.NETWORK,
        ...contract,
        contract: truncatedContract,
      },
    };
  } catch (error) {
    const errorMessage = [
      `Error generating agent account:`,
      `${error instanceof Error ? error.message : String(error)}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main()
    .then(sendToLLM)
    .catch((error) => {
      sendToLLM(createErrorResponse(error));
      process.exit(1);
    });
}
