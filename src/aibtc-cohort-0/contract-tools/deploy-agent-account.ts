import { ContractApiClient } from "../api/client";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  getExplorerUrl,
  getNextNonce,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
  TxBroadcastResultWithLink,
  validateNetwork,
} from "../../utilities";
import { deployContract, DeploymentOptions } from "../utils/deploy-contract";
import { validateStacksAddress } from "@stacks/transactions";
import { ContractResponse } from "@aibtc/types";

const usage =
  "Usage: bun run deploy-agent-account.ts <ownerAddress> <daoTokenContract> <daoTokenDexContract> [agentAddress] [tokenSymbol] [network] [saveToFile]";
const usageExample =
  'Example: bun run deploy-agent-account.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-token ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-token-dex ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM MYTOKEN "testnet" true';

interface ExpectedArgs {
  ownerAddress: string;
  daoTokenContract: string;
  daoTokenDexContract: string;
  agentAddress?: string;
  tokenSymbol?: string;
  network?: string;
  saveToFile?: boolean;
}

function validateArgs(): ExpectedArgs {
  const [
    ownerAddress,
    daoTokenContract,
    daoTokenDexContract,
    agentAddress,
    tokenSymbol = "aibtc",
    network = CONFIG.NETWORK,
    saveToFileStr = "false",
  ] = process.argv.slice(2);

  if (!ownerAddress) {
    const errorMessage = [
      "Owner address is required",
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!validateStacksAddress(ownerAddress)) {
    const errorMessage = [
      `Invalid owner address: ${ownerAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!daoTokenContract) {
    const errorMessage = [
      "DAO token contract is required",
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

  if (!daoTokenDexContract) {
    const errorMessage = [
      "DAO token DEX contract is required",
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

  // If agent address is provided, validate it
  if (agentAddress && !validateStacksAddress(agentAddress)) {
    const errorMessage = [
      `Invalid agent address: ${agentAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // Parse saveToFile parameter
  const saveToFile = convertStringToBoolean(saveToFileStr);

  return {
    ownerAddress,
    daoTokenContract,
    daoTokenDexContract,
    agentAddress,
    tokenSymbol,
    network: validateNetwork(network),
    saveToFile,
  };
}

async function main(): Promise<ToolResponse<TxBroadcastResultWithLink>> {
  const args = validateArgs();
  const apiClient = new ContractApiClient();

  try {
    // Generate contract name in the format aibtc-acct-ABCDE-FGHIJ-KLMNO-PQRST
    const ownerFirst5 = args.ownerAddress.substring(0, 5);
    const ownerLast5 = args.ownerAddress.substring(
      args.ownerAddress.length - 5
    );
    const agentAddress = args.agentAddress || args.ownerAddress;
    const agentFirst5 = agentAddress.substring(0, 5);
    const agentLast5 = agentAddress.substring(agentAddress.length - 5);
    const contractName = `aibtc-acct-${ownerFirst5}-${ownerLast5}-${agentFirst5}-${agentLast5}`;

    // Generate the agent account contract using the API client
    const generatedContractResponse = await apiClient.generateAgentAccount(
      contractName,
      args.network || CONFIG.NETWORK,
      {
        account_owner: args.ownerAddress,
        account_agent: agentAddress,
        dao_token: args.daoTokenContract,
        dao_token_dex: args.daoTokenDexContract,
        contractName: contractName,
      }
    );

    if (!generatedContractResponse.success || !generatedContractResponse.data?.contract) {
      if (generatedContractResponse.error) {
        throw new Error(generatedContractResponse.error.message);
      }
      throw new Error(
        `Failed to generate agent account: ${JSON.stringify(generatedContractResponse)}`
      );
    }

    const contract = generatedContractResponse.data.contract;

    // Prepare for deployment
    const network = args.network || CONFIG.NETWORK;
    const validNetwork = validateNetwork(network);

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
    const deployResult = await deployContract(
      {
        name: contractName,
        source: contract.source,
        clarityVersion: contract.clarityVersion,
        hash: contract.hash,
        deploymentOrder: 0, // Not used for agent accounts
      },
      deploymentOptions
    );

    if (!deployResult.success) {
      return {
        success: false,
        message: `Failed to deploy agent account: ${deployResult.message}`,
        data: null,
      };
    }

    const explorerUrl = getExplorerUrl(validNetwork, deployResult.data.txid);

    return {
      success: true,
      message: `Successfully deployed agent account contract for owner ${args.ownerAddress}`,
      data: {
        ...deployResult.data,
        link: explorerUrl,
      },
    };
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

// Export for use in other modules
export interface DeployAgentAccountParams {
  ownerAddress: string;
  agentAddress?: string;
  daoTokenContract: string;
  daoTokenDexContract: string;
  tokenSymbol?: string;
  network?: string;
  saveToFile?: boolean;
}

export async function deployAgentAccount(params: DeployAgentAccountParams): Promise<ToolResponse<TxBroadcastResultWithLink>> {
  const {
    ownerAddress,
    agentAddress = ownerAddress,
    daoTokenContract,
    daoTokenDexContract,
    tokenSymbol = "aibtc",
    network = CONFIG.NETWORK,
    saveToFile = false,
  } = params;

  const validNetwork = validateNetwork(network);
  const apiClient = new ContractApiClient();

  try {
    // Generate contract name in the format aibtc-acct-ABCDE-FGHIJ-KLMNO-PQRST
    const ownerFirst5 = ownerAddress.substring(0, 5);
    const ownerLast5 = ownerAddress.substring(ownerAddress.length - 5);
    const agentFirst5 = agentAddress.substring(0, 5);
    const agentLast5 = agentAddress.substring(agentAddress.length - 5);
    const contractName = `aibtc-acct-${ownerFirst5}-${ownerLast5}-${agentFirst5}-${agentLast5}`;

    // Generate the agent account contract using the API client
    const generatedContractResponse = await apiClient.generateAgentAccount(
      contractName,
      validNetwork,
      {
        account_owner: ownerAddress,
        account_agent: agentAddress,
        dao_token: daoTokenContract,
        dao_token_dex: daoTokenDexContract,
        contractName: contractName,
      }
    );

    if (!generatedContractResponse.success || !generatedContractResponse.data?.contract) {
      if (generatedContractResponse.error) {
        throw new Error(generatedContractResponse.error.message);
      }
      throw new Error(
        `Failed to generate agent account: ${JSON.stringify(generatedContractResponse)}`
      );
    }

    const contract = generatedContractResponse.data.contract;

    // Get deployment credentials
    const { address, key } = await deriveChildAccount(
      validNetwork,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    // Get the current nonce for the account
    const currentNonce = await getNextNonce(validNetwork, address);

    const deploymentOptions: DeploymentOptions = {
      address,
      key,
      network: validNetwork,
      nonce: currentNonce,
    };

    // Deploy the contract
    const deployResult = await deployContract(
      {
        name: contractName,
        source: contract.source,
        clarityVersion: contract.clarityVersion,
        hash: contract.hash,
        deploymentOrder: 0, // Not used for agent accounts
      },
      deploymentOptions
    );

    if (!deployResult.success) {
      throw new Error(
        `Failed to deploy agent account: ${deployResult.message}`
      );
    }

    const explorerUrl = getExplorerUrl(validNetwork, deployResult.data.txid);

    return {
      success: true,
      message: `Successfully deployed agent account contract for owner ${ownerAddress}`,
      data: {
        ...deployResult.data,
        link: explorerUrl,
      },
    };
  } catch (error) {
    console.error("Error deploying agent account:", error);
    return {
      success: false,
      message: `Error deploying agent account: ${error instanceof Error ? error.message : String(error)}`,
      data: null,
    };
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
