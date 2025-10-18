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

const usage = "Usage: bun run get-current-dao-monarch.ts <daoCharterContract>";
const usageExample =
  "Example: bun run get-current-dao-monarch.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-charter";

async function main(): Promise<ToolResponse<DaoMonarch | null>> {
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
    functionName: "get-current-dao-monarch",
    functionArgs: [],
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
    message: "Current DAO monarch record retrieved successfully",
    data,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
