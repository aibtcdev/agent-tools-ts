import { fetchCallReadOnlyFunction, Cl } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  decodeClarityValues,
  deriveChildAccount,
  getNetwork,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";

const usage =
  "Usage: bun run get-account-attestors.ts <registryContract> <agentAccountContract>";
const usageExample =
  "Example: bun run get-account-attestors.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.agent-account-registry ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test";

interface ExpectedArgs {
  registryContract: string;
  agentAccountContract: string;
}

interface AccountAttestors {
  "attestor-1": boolean;
  "attestor-2": boolean;
  "attestor-deployer": boolean;
}

function validateArgs(): ExpectedArgs {
  const [registryContract, agentAccountContract] = process.argv.slice(2);

  if (!registryContract || !agentAccountContract) {
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
  if (!isValidContractPrincipal(agentAccountContract)) {
    const errorMessage = [
      `Invalid agent account contract address: ${agentAccountContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    registryContract,
    agentAccountContract,
  };
}

async function main(): Promise<ToolResponse<AccountAttestors>> {
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
    functionName: "get-account-attestors",
    functionArgs: [Cl.principal(args.agentAccountContract)],
    senderAddress: address,
    network: networkObj,
  });

  const attestors = decodeClarityValues(result) as AccountAttestors;

  return {
    success: true,
    message: "Account attestors retrieved successfully",
    data: attestors,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
