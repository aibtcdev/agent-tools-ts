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

const usage = "Usage: bun run get-set-owner-proposal.ts <daoRunCostContract> <nonce>";
const usageExample =
  "Example: bun run get-set-owner-proposal.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-run-cost 1";

interface ExpectedArgs {
  daoRunCostContract: string;
  nonce: number;
}

interface SetOwnerProposal {
  who: string;
  status: boolean;
  executed: string | null;
  created: string;
}

function validateArgs(): ExpectedArgs {
  const [daoRunCostContract, nonceStr] = process.argv.slice(2);
  const nonce = parseInt(nonceStr);

  if (!daoRunCostContract || isNaN(nonce)) {
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

  return { daoRunCostContract, nonce };
}

async function main(): Promise<ToolResponse<SetOwnerProposal | null>> {
  const args = validateArgs();

  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const client = new ContractCallsClient(CONFIG.NETWORK);

  try {
    const result = await client.callContractFunction<SetOwnerProposal | null>(
      args.daoRunCostContract,
      "get-set-owner-proposal",
      [Cl.uint(args.nonce)],
      { senderAddress: address }
    );

    return {
      success: true,
      message: "Set owner proposal retrieved successfully",
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
