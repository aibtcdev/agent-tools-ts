import {
  AnchorMode,
  Cl,
  makeContractCall,
  Pc,
  PostConditionMode,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getActionProposalInfo,
  getNetwork,
  getNextNonce,
  sendToLLM,
} from "../../../../utilities";

const usage =
  "Usage: bun run conclude-proposal.ts <daoActionProposalsExtensionContract> <proposalId> <daoActionProposalContract> <daoTokenContract>";
const usageExample =
  "Example: bun run conclude-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2 1 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-send-message ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-token";

interface ExpectedArgs {
  daoActionProposalsExtensionContract: string;
  proposalId: number;
  daoActionProposalContract: string;
  daoTokenContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    actionProposalsExtension,
    proposalIdStr,
    actionContract,
    tokenContract,
  ] = process.argv.slice(2);
  const proposalId = parseInt(proposalIdStr);
  if (
    !actionProposalsExtension ||
    !proposalId ||
    !actionContract ||
    !tokenContract
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [extensionAddress, extensionName] = actionProposalsExtension.split(".");
  const [actionAddress, actionName] = actionContract.split(".");
  const [tokenAddress, tokenName] = tokenContract.split(".");
  if (
    !extensionAddress ||
    !extensionName ||
    !actionAddress ||
    !actionName ||
    !tokenAddress ||
    !tokenName
  ) {
    const errorMessage = [
      `Invalid contract addresses: ${actionProposalsExtension} ${actionContract} ${tokenAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    daoActionProposalsExtensionContract: actionProposalsExtension,
    proposalId,
    daoActionProposalContract: actionContract,
    daoTokenContract: tokenContract,
  };
}

// concludes an action proposal
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoActionProposalsExtensionContract.split(".");
  const [daoTokenAddress, daoTokenName] = args.daoTokenContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  // get the proposal info from the contract
  const proposalInfo = await getActionProposalInfo(
    args.daoActionProposalsExtensionContract,
    args.daoTokenContract,
    address,
    args.proposalId
  );
  // configure post conditions
  const postConditions = [
    Pc.principal(`${extensionAddress}.${extensionName}`)
      .willSendEq(proposalInfo.bond)
      .ft(`${daoTokenAddress}.${daoTokenName}`, proposalInfo.assetName),
  ];
  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "conclude-proposal",
    functionArgs: [
      Cl.uint(args.proposalId),
      Cl.principal(args.daoActionProposalContract),
    ],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny,
    postConditions: postConditions,
  };
  // broadcast transaction and return response
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
