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
  "Usage: bun run get-voting-configuration.ts <daoActionProposalVotingContract>";
const usageExample =
  "Example: bun run get-voting-configuration.ts ST000000000000000000002AMW42H.aibtc-action-proposal-voting";

interface ExpectedArgs {
  daoActionProposalVotingContract: string;
}

interface VotingConfiguration {
  self: string; // principal
  deployedBitcoinBlock: string; // uint
  deployedStacksBlock: string; // uint
  delay: string; // uint (VOTING_DELAY)
  period: string; // uint (VOTING_PERIOD)
  quorum: string; // uint (VOTING_QUORUM)
  threshold: string; // uint (VOTING_THRESHOLD)
  treasury: string; // principal (VOTING_TREASURY)
  proposalBond: string; // uint (VOTING_BOND)
  proposalReward: string; // uint (VOTING_REWARD)
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

async function main(): Promise<ToolResponse<VotingConfiguration>> {
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
    functionName: "get-voting-configuration",
    functionArgs: [],
    senderAddress,
    network: networkObj,
  });

  const votingConfigData = cvToJSON(result).value;

  const responseData: VotingConfiguration = {
    self: votingConfigData.self.value,
    deployedBitcoinBlock: votingConfigData.deployedBitcoinBlock.value,
    deployedStacksBlock: votingConfigData.deployedStacksBlock.value,
    delay: votingConfigData.delay.value,
    period: votingConfigData.period.value,
    quorum: votingConfigData.quorum.value,
    threshold: votingConfigData.threshold.value,
    treasury: votingConfigData.treasury.value,
    proposalBond: votingConfigData.proposalBond.value,
    proposalReward: votingConfigData.proposalReward.value,
  };

  return {
    success: true,
    message: "Voting configuration retrieved successfully.",
    data: responseData,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
