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
  extensionContract: string;
}

function validateArgs(): ExpectedArgs {
  const [baseDaoContract, extensionContract] = process.argv.slice(2);
  if (!baseDaoContract || !extensionContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      "Usage: bun run is-extension.ts <baseDaoContract> <extensionContract>",
      "Example: bun run is-extension.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-base-dao ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-core-proposals-extension",
    ].join("\n");
    throw new Error(errorMessage);
  }
  return {
    baseDaoContract,
    extensionContract,
  };
}

async function main(): Promise<ToolResponse<boolean>> {
  const args = validateArgs();
  const [baseDaoAddress, baseDaoName] = args.baseDaoContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);

  const functionOptions: ReadOnlyFunctionOptions = {
    contractAddress: baseDaoAddress,
    contractName: baseDaoName,
    functionName: "is-extension",
    functionArgs: [Cl.principal(args.extensionContract)],
    network: networkObj,
  };

  try {
    const result: ReadOnlyFunctionResponse = await networkObj.callReadOnlyFunction(
      functionOptions
    );
    const isExtension = cvToValue(result.value);
    return {
      status: "success",
      result: isExtension,
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
