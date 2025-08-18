import { fetchCallReadOnlyFunction } from "@stacks/transactions";
import {
  CONFIG,
  convertClarityTuple,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";

const usage = "Usage: bun run get-registry-config.ts <registryContract>";
const usageExample =
  "Example: bun run get-registry-config.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.agent-account-registry";

interface ExpectedArgs {
  registryContract: string;
}

interface RegistryConfig {
  "attestor-deployer": string;
  attestors: string[];
  "max-attestation-level": bigint;
}

function validateArgs(): ExpectedArgs {
  const [registryContract] = process.argv.slice(2);

  if (!registryContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(registryContract)) {
    const errorMessage = [
      `Invalid registry contract address: ${registryContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    registryContract,
  };
}

async function main(): Promise<ToolResponse<RegistryConfig>> {
  const args = validateArgs();
  const [contractAddress, contractName] = args.registryContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-registry-config",
    functionArgs: [],
    senderAddress: address,
    network: networkObj,
  });

  const config = convertClarityTuple<RegistryConfig>(result);

  return {
    success: true,
    message: "Registry configuration retrieved successfully",
    data: config,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
