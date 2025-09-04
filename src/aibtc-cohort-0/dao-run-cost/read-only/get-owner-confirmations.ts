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

const usage = "Usage: bun run get-owner-confirmations.ts <daoRunCostContract> <id> <nonce>";
const usageExample =
  "Example: bun run get-owner-confirmations.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-run-cost 1 1";

interface ExpectedArgs {
  daoRunCostContract: string;
  id: number;
  nonce: number;
}

function validateArgs(): ExpectedArgs {
  const [daoRunCostContract, idStr, nonceStr] = process.argv.slice(2);
  const id = parseInt(idStr);
  const nonce = parseInt(nonceStr);

  if (!daoRunCostContract || isNaN(id) || isNaN(nonce)) {
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

  return { daoRunCostContract, id, nonce };
}

async function main(): Promise<ToolResponse<boolean | null>> {
  const args = validateArgs();

  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const client = new ContractCallsClient(CONFIG.NETWORK);

  try {
    const result = await client.callContractFunction<boolean | null>(
      args.daoRunCostContract,
      "get-owner-confirmations",
      [Cl.uint(args.id), Cl.uint(args.nonce)],
      { senderAddress: address }
    );

    return {
      success: true,
      message: "Owner confirmations retrieved successfully",
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
