import {
  fetchCallReadOnlyFunction,
  Cl,
  ClarityType,
  cvToValue,
} from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
  ToolResponse,
} from "../../../../../utilities";

const usage =
  "Usage: bun run get-liquid-supply.ts <daoActionProposalVotingContract> <stacksBlockHeight>";
const usageExample =
  "Example: bun run get-liquid-supply.ts ST000000000000000000002AMW42H.aibtc-action-proposal-voting 12345";

interface ExpectedArgs {
  daoActionProposalVotingContract: string;
  stacksBlockHeight: number;
}

function validateArgs(): ExpectedArgs {
  const [daoActionProposalVotingContract, stacksBlockHeightStr] =
    process.argv.slice(2);
  if (!daoActionProposalVotingContract || stacksBlockHeightStr === undefined) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  const stacksBlockHeight = parseInt(stacksBlockHeightStr);
  if (isNaN(stacksBlockHeight)) {
    const errorMessage = [
      `Invalid stacksBlockHeight: ${stacksBlockHeightStr}. Must be a number.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  const [contractAddress, contractName] =
    daoActionProposalVotingContract.split(".");
  if (!contractAddress || !contractName) {
    const errorMessage = [
      `Invalid contract address: ${daoActionProposalVotingContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    daoActionProposalVotingContract,
    stacksBlockHeight,
  };
}

async function main(): Promise<ToolResponse<string>> {
  const args = validateArgs();
  const [contractAddress, contractName] =
    args.daoActionProposalVotingContract.split(".");
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address: senderAddress } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-liquid-supply",
    functionArgs: [Cl.uint(args.stacksBlockHeight)],
    senderAddress,
    network: networkObj,
  });

  if (result.type === ClarityType.ResponseOk) {
    const liquidSupply = cvToValue(result.value, true) as string; // uint as string
    return {
      success: true,
      message: "Liquid supply retrieved successfully.",
      data: liquidSupply,
    };
  } else if (result.type === ClarityType.ResponseErr) {
    const errorValue = cvToValue(result.value);
    throw new Error(
      `Error retrieving liquid supply: ${JSON.stringify(
        errorValue
      )} (Error Code: ${errorValue})`
    );
  } else {
    throw new Error(
      `Unexpected response type: ${JSON.stringify(result)}`
    );
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
