import {
  Cl,
  cvToValue,
  ReadOnlyFunctionOptions,
  ReadOnlyFunctionResponse,
} from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  getNetwork,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

interface ExpectedArgs {
  baseDaoContract: string;
  proposalContract: string;
}

function validateArgs(): ExpectedArgs {
  const [baseDaoContract, proposalContract] = process.argv.slice(2);
  if (!baseDaoContract || !proposalContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      "Usage: bun run executed-at.ts <baseDaoContract> <proposalContract>",
      "Example: bun run executed-at.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-base-dao ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-bootstrap-initialization",
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

  const functionOptions: ReadOnlyFunctionOptions = {
    contractAddress: baseDaoAddress,
    contractName: baseDaoName,
    functionName: "executed-at",
    functionArgs: [Cl.principal(args.proposalContract)],
    network: networkObj,
  };

  try {
    const result: ReadOnlyFunctionResponse = await networkObj.callReadOnlyFunction(
      functionOptions
    );
    const executedAt = cvToValue(result.value);
    return {
      status: "success",
      result: executedAt,
    };
  } catch (error) {
    return createErrorResponse(error);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
