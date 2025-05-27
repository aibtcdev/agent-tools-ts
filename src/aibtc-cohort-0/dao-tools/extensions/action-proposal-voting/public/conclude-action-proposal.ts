import {
  Cl,
  makeContractCall,
  Pc,
  PostConditionMode,
  SignedContractCallOptions,
  fetchCallReadOnlyFunction,
  ClarityType,
  cvToJSON,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
  validateStacksAddress,
  isValidContractPrincipal,
} from "../../../../../utilities";
import { TokenInfoService } from "../../../../../api/token-info-service";

const usage =
  "Usage: bun run conclude-action-proposal.ts <daoActionProposalVotingContract> <proposalId> <actionContractToExecute> <daoTokenContract>";
const usageExample =
  "Example: bun run conclude-action-proposal.ts ST000000000000000000002AMW42H.aibtc-action-proposal-voting 1 ST000000000000000000002AMW42H.some-action-contract ST000000000000000000002AMW42H.aibtc-token";

interface ExpectedArgs {
  daoActionProposalVotingContract: string;
  proposalId: number;
  actionContractToExecute: string;
  daoTokenContract: string;
}

interface ProposalDataForBond {
  bond: string; // uint - string representation of number
  // We only need bond for post-condition, but get-proposal returns more
}


function validateArgs(): ExpectedArgs {
  const [
    daoActionProposalVotingContract,
    proposalIdStr,
    actionContractToExecute,
    daoTokenContract,
  ] = process.argv.slice(2);

  if (
    !daoActionProposalVotingContract ||
    proposalIdStr === undefined ||
    !actionContractToExecute ||
    !daoTokenContract
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(daoActionProposalVotingContract)) {
    const errorMessage = [
      `Invalid DAO Action Proposal Voting contract: ${daoActionProposalVotingContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  const proposalId = parseInt(proposalIdStr);
  if (isNaN(proposalId)) {
    const errorMessage = [
      `Invalid proposalId: ${proposalIdStr}. Must be a number.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(actionContractToExecute)) {
     const errorMessage = [
      `Invalid action contract to execute: ${actionContractToExecute}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(daoTokenContract)) {
    const errorMessage = [
      `Invalid DAO token contract: ${daoTokenContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    daoActionProposalVotingContract,
    proposalId,
    actionContractToExecute,
    daoTokenContract,
  };
}

async function getProposalBond(
  extensionContractAddress: string,
  extensionContractName: string,
  proposalId: number,
  senderAddress: string,
  network: any
): Promise<string> {
  const result = await fetchCallReadOnlyFunction({
    contractAddress: extensionContractAddress,
    contractName: extensionContractName,
    functionName: "get-proposal",
    functionArgs: [Cl.uint(proposalId)],
    senderAddress,
    network,
  });

  if (result.type === ClarityType.OptionalSome) {
    const proposal = cvToJSON(result.value).value as ProposalDataForBond;
    if (proposal && proposal.bond) {
      return proposal.bond;
    }
    throw new Error(
      `Could not find bond in proposal data: ${JSON.stringify(proposal)}`
    );
  } else if (result.type === ClarityType.OptionalNone) {
    throw new Error(`Proposal with ID ${proposalId} not found.`);
  } else {
    const errorValue = (result as any).value ? cvToJSON((result as any).value) : result;
    throw new Error(
      `Error retrieving proposal for bond: ${JSON.stringify(errorValue)}`
    );
  }
}


async function main() {
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoActionProposalVotingContract.split(".");
  const [daoTokenAddress, daoTokenName] = args.daoTokenContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  const proposalBondAmount = await getProposalBond(
    extensionAddress,
    extensionName,
    args.proposalId,
    address, // sender for read-only call
    networkObj
  );

  const tokenInfoService = new TokenInfoService(CONFIG.NETWORK);
  const daoTokenAssetName = await tokenInfoService.getAssetNameFromAbi(
    args.daoTokenContract
  );
  if (!daoTokenAssetName) {
    throw new Error(
      `Could not determine asset name for DAO token contract: ${args.daoTokenContract}`
    );
  }

  const postConditions = [
    Pc.principal(`${extensionAddress}.${extensionName}`)
      .willSendEq(proposalBondAmount)
      .ft(`${daoTokenAddress}.${daoTokenName}`, daoTokenAssetName),
  ];

  const functionArgs = [
    Cl.uint(args.proposalId),
    Cl.principal(args.actionContractToExecute),
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "conclude-action-proposal",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny,
    postConditions: postConditions,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTx(transaction, networkObj);
  return broadcastResponse;
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
