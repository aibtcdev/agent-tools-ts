import { ContractApiClient } from "../api/client";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  getNextNonce,
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
  "Usage: bun run deploy-agent-account.ts <ownerAddress> <agentAddress> [network] [saveToFile]";
const usageExample =
  'Example: bun run deploy-agent-account.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM "testnet" true';

interface ExpectedArgs {
  ownerAddress: string;
  agentAddress: string;
  network?: string;
  saveToFile?: boolean;
}

function validateArgs(): ExpectedArgs {
  const [
    ownerAddress,
    agentAddress,
    network = CONFIG.NETWORK,
    saveToFileStr = "false",
  ] = process.argv.slice(2);

  if (!validateStacksAddress(ownerAddress)) {
    throw new Error(`Invalid owner address: ${ownerAddress}`);
  }

  if (!validateStacksAddress(agentAddress)) {
    throw new Error(`Invalid agent address: ${agentAddress}`);
  }

  // Parse saveToFile parameter
  const saveToFile = convertStringToBoolean(saveToFileStr);

  return {
    ownerAddress,
    agentAddress,
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
      throw new Error(JSON.stringify(generatedContractResponse));
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
      throw new Error(JSON.stringify(deployResult));
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
