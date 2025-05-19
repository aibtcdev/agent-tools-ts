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
import { generateAgentAccount, saveContractToFile } from "./generate-agent-account";

const usage =
  "Usage: bun run deploy-agent-account.ts <ownerAddress> <daoTokenContract> <daoTokenDexContract> [agentAddress] [network] [saveToFile]";
const usageExample =
  "Example: bun run deploy-agent-account.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-token ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-token-dex ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM \"testnet\" true";

interface ExpectedArgs {
  ownerAddress: string;
  daoTokenContract: string;
  daoTokenDexContract: string;
  agentAddress?: string;
  network?: string;
  saveToFile?: boolean;
  // build replacements from params
  customReplacements?: Record<string, string>;
}

function validateArgs(): ExpectedArgs {
  const [
    ownerAddress,
    daoTokenContract,
    daoTokenDexContract,
    agentAddress,
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
    network: validateNetwork(network),
    saveToFile,
    // build replacements from params
    customReplacements: {
      owner_address: ownerAddress,
      agent_address: agentAddress || ownerAddress,
      dao_token_contract: daoTokenContract,
      dao_token_dex_contract: daoTokenDexContract,
    },
  };
}

async function main(): Promise<ToolResponse<TxBroadcastResultWithLink>> {
  const args = validateArgs();

  try {
    // Generate the agent account contract
    const generatedContractResponse = await generateAgentAccount({
      ownerAddress: args.ownerAddress,
      agentAddress: args.agentAddress,
      daoTokenContract: args.daoTokenContract,
      daoTokenDexContract: args.daoTokenDexContract,
      network: args.network,
      saveToFile: args.saveToFile,
    });

    if (!generatedContractResponse.success || !generatedContractResponse.contract) {
      return {
        success: false,
        message: `Failed to generate agent account: ${
          generatedContractResponse.message || "Unknown error"
        }`,
        data: null,
      };
    }

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
    const contractName = `${args.ownerAddress.split(".")[0]}-agent-account`;
    const deployResult = await deployContract({
      name: contractName,
      source: generatedContractResponse.contract.source,
      clarityVersion: generatedContractResponse.contract.clarityVersion,
      hash: generatedContractResponse.contract.hash,
      deploymentOrder: 0, // Not used for agent accounts
    }, deploymentOptions);

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
  network?: string;
  saveToFile?: boolean;
}

export async function deployAgentAccount(params: DeployAgentAccountParams) {
  const {
    ownerAddress,
    agentAddress = ownerAddress,
    daoTokenContract,
    daoTokenDexContract,
    network = CONFIG.NETWORK,
    saveToFile = false,
  } = params;

  const validNetwork = validateNetwork(network);

  try {
    // Generate the agent account contract
    const generatedContractResponse = await generateAgentAccount({
      ownerAddress,
      agentAddress,
      daoTokenContract,
      daoTokenDexContract,
      network: validNetwork,
      saveToFile,
    });

    if (!generatedContractResponse.contract) {
      throw new Error("Failed to generate agent account contract");
    }

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
    const contractName = `${ownerAddress.split(".")[0]}-agent-account`;
    const deployResult = await deployContract({
      name: contractName,
      source: generatedContractResponse.contract.source,
      clarityVersion: generatedContractResponse.contract.clarityVersion,
      hash: generatedContractResponse.contract.hash,
      deploymentOrder: 0, // Not used for agent accounts
    }, deploymentOptions);

    if (!deployResult.success) {
      throw new Error(`Failed to deploy agent account: ${deployResult.message}`);
    }

    const explorerUrl = getExplorerUrl(validNetwork, deployResult.data.txid);

    return {
      ...deployResult,
      data: {
        ...deployResult.data,
        link: explorerUrl,
      },
    };
  } catch (error) {
    console.error("Error deploying agent account:", error);
    throw error;
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
