import {
  AnchorMode,
  Cl,
  makeContractCall,
  PostConditionMode,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
} from "../../../utilities";

const usage =
  "Usage: bun run proxy-create-proposal.ts <smartWalletContract> <daoCoreProposalsExtensionContract> <daoProposalContract> <daoTokenContract>";
const usageExample =
  "Example: bun run proxy-create-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-user-agent-smart-wallet ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-core-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.proposal-add-extension ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token";

interface ExpectedArgs {
  smartWalletContract: string;
  daoCoreProposalsExtensionContract: string;
  daoProposalContract: string;
  daoTokenContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    smartWalletContract,
    daoCoreProposalsExtensionContract,
    daoProposalContract,
    daoTokenContract,
  ] = process.argv.slice(2);
  if (
    !smartWalletContract ||
    !daoCoreProposalsExtensionContract ||
    !daoProposalContract ||
    !daoTokenContract
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [walletAddress, walletName] = smartWalletContract.split(".");
  const [extensionAddress, extensionName] =
    daoCoreProposalsExtensionContract.split(".");
  const [proposalAddress, proposalName] = daoProposalContract.split(".");
  const [tokenAddress, tokenName] = daoTokenContract.split(".");
  if (
    !walletAddress ||
    !walletName ||
    !extensionAddress ||
    !extensionName ||
    !proposalAddress ||
    !proposalName ||
    !tokenAddress ||
    !tokenName
  ) {
    const errorMessage = [
      `Invalid contract addresses: ${smartWalletContract} ${daoCoreProposalsExtensionContract} ${daoProposalContract} ${daoTokenContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    smartWalletContract,
    daoCoreProposalsExtensionContract,
    daoProposalContract,
    daoTokenContract,
  };
}

// creates a new core proposal through a smart wallet
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [walletAddress, walletName] = args.smartWalletContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: walletAddress,
    contractName: walletName,
    functionName: "proxy-create-proposal",
    functionArgs: [
      Cl.principal(args.daoCoreProposalsExtensionContract),
      Cl.principal(args.daoProposalContract),
    ],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [],
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
