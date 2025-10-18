import {
  fetchCallReadOnlyFunction,
  ClarityType,
  Cl,
} from "@stacks/transactions";
import {
  CONFIG,
  convertClarityTuple,
  createErrorResponse,
  DaoMonarch,
  deriveChildAccount,
  getNetwork,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../../../utilities";

interface ExpectedArgs {
  daoCharterContract: string;
  index: number;
}

const usage = "Usage: bun run get-dao-monarch.ts <daoCharterContract> <index>";
const usageExample =
  "Example: bun run get-dao-monarch.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-charter 1";

function validateArgs(): ExpectedArgs {
  const [daoCharterContract, indexStr] = process.argv.slice(2);
  if (!daoCharterContract || !indexStr) {
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

  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 0) {
    const errorMessage = [
      `Invalid index: ${indexStr}. Must be a non-negative integer.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    daoCharterContract,
    index,
  };
}

async function main(): Promise<ToolResponse<DaoMonarch | null>> {
  const args = validateArgs();
  const [contractAddress, contractName] = args.daoCharterContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const resultCV = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-dao-monarch",
    functionArgs: [Cl.uint(args.index)],
    senderAddress: address,
    network: networkObj,
  });

  let data: DaoMonarch | null = null;
  if (resultCV.type === ClarityType.OptionalSome) {
    const tupleObj = convertClarityTuple<{
      burnHeight: bigint;
      createdAt: bigint;
      caller: string;
      sender: string;
      previousMonarch: string;
      newMonarch: string;
    }>(resultCV.value);
    data = {
      burnHeight: Number(tupleObj.burnHeight),
      createdAt: Number(tupleObj.createdAt),
      caller: tupleObj.caller,
      sender: tupleObj.sender,
      previousMonarch: tupleObj.previousMonarch,
      newMonarch: tupleObj.newMonarch,
    };
  }

  return {
    success: true,
    message: "DAO monarch record retrieved successfully",
    data,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
