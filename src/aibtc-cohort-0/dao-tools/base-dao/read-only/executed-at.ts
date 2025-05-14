import {
  Cl,
  cvToValue,
  fetchCallReadOnlyFunction,
  ReadOnlyFunctionOptions,
} from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage =
  "Usage: bun run executed-at.ts <baseDaoContract> <proposalContract>";
const usageExample =
  "Example: bun run executed-at.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-base-dao ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-bootstrap-initialization";

interface ExpectedArgs {
  baseDaoContract: string;
  proposalContract: string;
}

function validateArgs(): ExpectedArgs {
  const [baseDaoContract, proposalContract] = process.argv.slice(2);
  if (!isValidContractPrincipal(baseDaoContract)) {
    const errorMessage = [
      `Invalid base DAO contract address: ${baseDaoContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(proposalContract)) {
    const errorMessage = [
      `Invalid proposal contract address: ${proposalContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  return {
    baseDaoContract,
    proposalContract,
  };
}

async function main(): Promise<ToolResponse<number | null>> {
  const args = validateArgs();
  const [baseDaoAddress, baseDaoName] = args.baseDaoContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);

  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const functionOptions: ReadOnlyFunctionOptions = {
    contractAddress: baseDaoAddress,
    contractName: baseDaoName,
    functionName: "executed-at",
    functionArgs: [Cl.principal(args.proposalContract)],
    network: networkObj,
    senderAddress: address,
  };

  try {
    const result = await fetchCallReadOnlyFunction(functionOptions);
    const executedAt = cvToValue(result);
    return {
      success: true,
      data: executedAt,
      message: `Proposal ${args.proposalContract} was executed at block ${executedAt === null ? 'never' : executedAt}`,
    };
  } catch (error) {
    const errorMessage = [
      `Error fetching execution status:`,
      `${error instanceof Error ? error.message : String(error)}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
