import { Cl } from "@stacks/transactions";
import { ContractCallsClient } from "../../../api/contract-calls-client";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";

const usage = "Usage: bun run is-allowed-asset.ts <daoRunCostContract> <assetContract>";
const usageExample =
  "Example: bun run is-allowed-asset.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-run-cost ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5.aibtc-token";

interface ExpectedArgs {
  daoRunCostContract: string;
  assetContract: string;
}

function validateArgs(): ExpectedArgs {
  const [daoRunCostContract, assetContract] = process.argv.slice(2);
  if (!daoRunCostContract || !assetContract) {
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

  if (!isValidContractPrincipal(assetContract)) {
    const errorMessage = [
      `Invalid asset contract principal: ${assetContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return { daoRunCostContract, assetContract };
}

async function main(): Promise<ToolResponse<boolean>> {
  const args = validateArgs();

  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const client = new ContractCallsClient(CONFIG.NETWORK);

  try {
    const result = await client.callContractFunction<boolean>(
      args.daoRunCostContract,
      "is-allowed-asset",
      [Cl.principal(args.assetContract)],
      { senderAddress: address }
    );

    return {
      success: true,
      message: "Allowed asset status retrieved successfully",
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
