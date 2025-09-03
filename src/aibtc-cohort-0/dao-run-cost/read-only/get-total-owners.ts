import { ContractCallsClient } from "../../../api/contract-calls-client";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";

const usage = "Usage: bun run get-total-owners.ts <daoRunCostContract>";
const usageExample =
  "Example: bun run get-total-owners.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-run-cost";

interface ExpectedArgs {
  daoRunCostContract: string;
}

function validateArgs(): ExpectedArgs {
  const [daoRunCostContract] = process.argv.slice(2);
  if (!daoRunCostContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(daoRunCostContract)) {
    const errorMessage = [
      `Invalid DAO run cost contract address: ${daoRunCostContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return { daoRunCostContract };
}

async function main(): Promise<ToolResponse<string>> {
  const args = validateArgs();

  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const client = new ContractCallsClient(CONFIG.NETWORK);

  try {
    const result = await client.callContractFunction<string>(
      args.daoRunCostContract,
      "get-total-owners",
      [],
      { senderAddress: address }
    );

    return {
      success: true,
      message: "Total owners retrieved successfully",
      data: result,
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
