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
  isValidContractPrincipal,
  replaceBigintWithString,
  sendToLLM,
} from "../../../utilities";

const usage =
  "Usage: bun run conclude-action-proposal.ts <smartWalletContract> <daoActionProposalsExtensionContract> <daoTokenContract> <proposalId>";
const usageExample =
  "Example: bun run conclude-action-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-user-agent-smart-wallet ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token 12";

interface ExpectedArgs {
  smartWalletContract: string;
  daoActionProposalsExtensionContract: string;
  daoTokenContract: string;
  proposalId: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    smartWalletContract,
    actionProposalsExtension,
    tokenContract,
    proposalIdStr,
  ] = process.argv.slice(2);
  const proposalId = parseInt(proposalIdStr);
  if (
    !smartWalletContract ||
    !actionProposalsExtension ||
    !proposalId ||
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
  if (!isValidContractPrincipal(smartWalletContract)) {
    const errorMessage = [
      `Invalid contract address: ${smartWalletContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(actionProposalsExtension)) {
    const errorMessage = [
      `Invalid contract address: ${actionProposalsExtension}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(tokenContract)) {
    const errorMessage = [
      `Invalid contract address: ${tokenContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // return validated arguments
  return {
    smartWalletContract,
    daoActionProposalsExtensionContract: actionProposalsExtension,
    daoTokenContract: tokenContract,
    proposalId,
  };
}

// concludes an action proposal through a smart wallet
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [smartWalletAddress, smartWalletName] =
    args.smartWalletContract.split(".");
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
    Pc.principal(args.daoActionProposalsExtensionContract)
      .willSendEq(proposalInfo.bond.toString())
      .ft(`${daoTokenAddress}.${daoTokenName}`, proposalInfo.assetName),
  ];

  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: smartWalletAddress,
    contractName: smartWalletName,
    functionName: "conclude-action-proposal",
    functionArgs: [
      Cl.principal(args.daoActionProposalsExtensionContract),
      Cl.uint(args.proposalId),
      Cl.principal(proposalInfo.action),
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
