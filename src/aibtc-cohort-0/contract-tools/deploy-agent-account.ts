import { ContractApiClient } from "../api/client";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  getNextNonce,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
  validateNetwork,
} from "../../utilities";
import {
  BroadcastedContractResponse,
  deployContract,
  DeploymentOptions,
} from "../utils/deploy-contract";
import { validateStacksAddress } from "@stacks/transactions";
import { saveAgentAccountToFile } from "../utils/save-contract";

const usage =
  "Usage: bun run deploy-agent-account.ts <ownerAddress> <agentAddress> <daoTokenContract> <daoTokenDexContract> [network] [saveToFile]";
const usageExample =
  'Example: bun run deploy-agent-account.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-token ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-token-dex "testnet" true';

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

async function main(): Promise<ToolResponse<BroadcastedContractResponse>> {
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

    // Generate the agent account contract using the API client
    const generatedContractResponse = await apiClient.generateAgentAccount(
      contractName,
      args.network || CONFIG.NETWORK,
      "aibtc", // Default tokenSymbol for agent accounts
      {
        account_owner: args.ownerAddress,
        account_agent: agentAddress,
        dao_contract_token: args.daoTokenContract,
        dao_contract_token_dex: args.daoTokenDexContract,
        contractName: contractName,
      }
    );

    if (
      !generatedContractResponse.success ||
      !generatedContractResponse.data?.contract
    ) {
      if (generatedContractResponse.error) {
        throw new Error(generatedContractResponse.error.message);
      }
      throw new Error(
        `Failed to generate agent account: ${JSON.stringify(
          generatedContractResponse
        )}`
      );
    }

    const contract = generatedContractResponse.data.contract;
    contract.displayName = contractName;

    // Save contract to file if requested
    if (args.saveToFile) {
      await saveAgentAccountToFile(contract, args.network ?? CONFIG.NETWORK);
    }

    // Prepare for deployment
    const network = args.network || CONFIG.NETWORK;

    // Get deployment credentials
    const { address, key } = await deriveChildAccount(
      network,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    // Get the current nonce for the account
    const currentNonce = await getNextNonce(network, address);

    const deploymentOptions: DeploymentOptions = {
      address,
      key,
      network,
      nonce: currentNonce,
    };

    // Deploy the contract
    const deployResult = await deployContract(contract, deploymentOptions);

    if (!deployResult.success) {
      throw new Error(
        `Failed to deploy agent account contract: ${JSON.stringify(
          deployResult
        )}`
      );
    }

    // Truncate source code for response
    if (deployResult.data) {
      const contractSource = deployResult.data.source ?? "";
      const truncatedSource =
        contractSource.length > 100
          ? contractSource.substring(0, 97) + "..."
          : contractSource;

      deployResult.data.source = truncatedSource;
    }

    return deployResult;
  } catch (error) {
    const errorMessage = [
      `Error deploying agent account:`,
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
