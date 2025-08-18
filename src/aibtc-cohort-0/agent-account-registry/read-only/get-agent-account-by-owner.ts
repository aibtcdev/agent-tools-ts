import {
  fetchCallReadOnlyFunction,
  Cl,
  cvToValue,
  validateStacksAddress,
} from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";

const usage =
  "Usage: bun run get-agent-account-by-owner.ts <registryContract> <ownerPrincipal>";
const usageExample =
  "Example: bun run get-agent-account-by-owner.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.agent-account-registry ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

interface ExpectedArgs {
  registryContract: string;
  ownerPrincipal: string;
}

function validateArgs(): ExpectedArgs {
  const [registryContract, ownerPrincipal] = process.argv.slice(2);

  if (!registryContract || !ownerPrincipal) {
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
  if (!validateStacksAddress(ownerPrincipal)) {
    const errorMessage = [
      `Invalid owner principal: ${ownerPrincipal}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    registryContract,
    ownerPrincipal,
  };
}

async function main(): Promise<ToolResponse<string | null>> {
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
    functionName: "get-agent-account-by-owner",
    functionArgs: [Cl.principal(args.ownerPrincipal)],
    senderAddress: address,
    network: networkObj,
  });

  const agentAccount = cvToValue(result, true) as string | null;

  return {
    success: true,
    message: "Agent account by owner retrieved successfully",
    data: agentAccount,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
