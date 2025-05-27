import { fetchCallReadOnlyFunction, cvToJSON } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
  ToolResponse,
} from "../../../../../utilities";

const usage =
  "Usage: bun run get-total-proposals.ts <daoActionProposalVotingContract>";
const usageExample =
  "Example: bun run get-total-proposals.ts ST000000000000000000002AMW42H.aibtc-action-proposal-voting";

interface ExpectedArgs {
  daoActionProposalVotingContract: string;
}

interface TotalProposalsResponse {
  proposalCount: string; // uint
  concludedProposalCount: string; // uint
  executedProposalCount: string; // uint
  lastProposalStacksBlock: string; // uint
  lastProposalBitcoinBlock: string; // uint
}

function validateArgs(): ExpectedArgs {
  const [daoActionProposalVotingContract] = process.argv.slice(2);
  if (!daoActionProposalVotingContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
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
  };
}

async function main(): Promise<ToolResponse<TotalProposalsResponse>> {
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
    functionName: "get-total-proposals",
    functionArgs: [],
    senderAddress,
    network: networkObj,
  });

  const totalProposalsData = cvToJSON(result).value;

  const response: ToolResponse<TotalProposalsResponse> = {
    success: true,
    message: "Retrieved total proposals data successfully.",
    data: {
      proposalCount: totalProposalsData.proposalCount.value,
      concludedProposalCount: totalProposalsData.concludedProposalCount.value,
      executedProposalCount: totalProposalsData.executedProposalCount.value,
      lastProposalStacksBlock: totalProposalsData.lastProposalStacksBlock.value,
      lastProposalBitcoinBlock:
        totalProposalsData.lastProposalBitcoinBlock.value,
    },
  };
  return response;
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
