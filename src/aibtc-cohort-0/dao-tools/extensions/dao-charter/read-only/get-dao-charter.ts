import { fetchCallReadOnlyFunction, cvToValue } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../../../utilities";

const usage = "Usage: bun run get-dao-charter.ts <daoCharterContract> <version>";
const usageExample =
  "Example: bun run get-dao-charter.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-charter 1";

async function main(): Promise<ToolResponse<DaoCharter | null>> {
  const [daoCharterContract, versionStr] = process.argv.slice(2);
  if (!daoCharterContract || !versionStr) {
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

  const version = parseInt(versionStr, 10);
  if (isNaN(version) || version < 0) {
    const errorMessage = [
      `Invalid version: ${versionStr}. Must be a non-negative integer.`,
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
    functionName: "get-dao-charter",
    functionArgs: [Cl.uint(version)],
    senderAddress: address,
    network: networkObj,
  });

  let data: DaoCharter | null = null;
  if (resultCV.type === ClarityType.OptionalSome) {
    const tupleObj = convertClarityTuple<{
      burnHeight: bigint;
      createdAt: bigint;
      caller: string;
      sender: string;
      charter: string;
    }>(resultCV.value);
    data = {
      burnHeight: Number(tupleObj.burnHeight),
      createdAt: Number(tupleObj.createdAt),
      caller: tupleObj.caller,
      sender: tupleObj.sender,
      charter: tupleObj.charter,
    };
  }

  return {
    success: true,
    message: "DAO charter record retrieved successfully",
    data,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
