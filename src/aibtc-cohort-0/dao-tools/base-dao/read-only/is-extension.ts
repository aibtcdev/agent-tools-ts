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
  "Usage: bun run is-extension.ts <baseDaoContract> <extensionContract>";
const usageExample =
  "Example: bun run is-extension.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-base-dao ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-core-proposals-extension";

interface ExpectedArgs {
  baseDaoContract: string;
  extensionContract: string;
}

function validateArgs(): ExpectedArgs {
  const [baseDaoContract, extensionContract] = process.argv.slice(2);
  if (!isValidContractPrincipal(baseDaoContract)) {
    const errorMessage = [
      `Invalid base DAO contract address: ${baseDaoContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(extensionContract)) {
    const errorMessage = [
      `Invalid extension contract address: ${extensionContract}`,
      usage,
      usageExample,
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

  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const functionOptions: ReadOnlyFunctionOptions = {
    contractAddress: baseDaoAddress,
    contractName: baseDaoName,
    functionName: "is-extension",
    functionArgs: [Cl.principal(args.extensionContract)],
    network: networkObj,
    senderAddress: address,
  };

  try {
    const result = await fetchCallReadOnlyFunction(functionOptions);
    const isExtension = cvToValue(result);
    return {
      success: true,
      data: isExtension,
      message: `The contract ${args.extensionContract} is ${
        isExtension ? "" : "not "
      }an extension of ${args.baseDaoContract}`,
    };
  } catch (error) {
    const errorMessage = [
      `Error fetching extension status:`,
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
