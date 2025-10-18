import {
  fetchCallReadOnlyFunction,
  cvToValue,
  ClarityType,
} from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../../../utilities";

const usage =
  "Usage: bun run get-current-dao-charter-index.ts <daoCharterContract>";
const usageExample =
  "Example: bun run get-current-dao-charter-index.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-charter";

async function main(): Promise<ToolResponse<number | null>> {
  const [daoCharterContract] = process.argv.slice(2);
  if (!daoCharterContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(daoCharterContract)) {
    const errorMessage = [
      `Invalid DAO charter contract address: ${daoCharterContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  const [contractAddress, contractName] = daoCharterContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const resultCV = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-current-dao-charter-index",
    functionArgs: [],
    senderAddress: address,
    network: networkObj,
  });

  let data: number | null = null;
  if (resultCV.type === ClarityType.OptionalSome) {
    data = Number(cvToValue(resultCV.value));
  }

  return {
    success: true,
    message: "Current DAO charter index retrieved successfully",
    data,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
