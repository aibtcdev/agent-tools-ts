import {
  Cl,
  makeContractCall,
  Pc,
  PostConditionMode,
  SignedContractCallOptions,
  cvToJSON,
  fetchCallReadOnlyFunction,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
  isValidContractPrincipal,
} from "../../../../../utilities";
import { TokenInfoService } from "../../../../../api/token-info-service";

// This constant reflects the contract's definition and is used if dynamic fetching fails or as a fallback.
const AIBTC_DAO_RUN_COST_AMOUNT = 10000000000; // u10000000000 from contract

const usage =
  "Usage: bun run create-action-proposal.ts <daoActionProposalVotingContract> <actionContractToExecute> <messageToSend> <daoTokenContract> [memo]";
const usageExample =
  'Example: bun run create-action-proposal.ts ST000000000000000000002AMW42H.aibtc-action-proposal-voting ST000000000000000000002AMW42H.some-action-contract "hello from the dao" ST000000000000000000002AMW42H.aibtc-token "My proposal memo"';

interface ExpectedArgs {
  daoActionProposalVotingContract: string;
  actionContractToExecute: string;
  messageToSend: string;
  daoTokenContract: string;
  memo?: string;
}

interface VotingConfigurationData {
  proposalBond: string; // uint
  // other fields from get-voting-configuration if needed later
}

async function getVotingConfigurationFromContract(
  contractAddress: string,
  contractName: string,
  senderAddress: string,
  network: any
): Promise<VotingConfigurationData> {
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-voting-configuration",
    functionArgs: [],
    senderAddress,
    network,
  });
  const jsonData = cvToJSON(result).value;
  if (jsonData && jsonData.proposalBond && jsonData.proposalBond.value) {
    return {
      proposalBond: jsonData.proposalBond.value,
    };
  }
  throw new Error(
    `Could not retrieve proposalBond from voting configuration: ${JSON.stringify(
      jsonData
    )}`
  );
}

function validateArgs(): ExpectedArgs {
  const [
    daoActionProposalVotingContract,
    actionContractToExecute,
    messageToSend,
    daoTokenContract,
    memo,
  ] = process.argv.slice(2);

  if (
    !daoActionProposalVotingContract ||
    !actionContractToExecute ||
    !messageToSend ||
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
    actionContractToExecute,
    messageToSend,
    daoTokenContract,
    memo: memo || undefined,
  };
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

  const votingConfig = await getVotingConfigurationFromContract(
    extensionAddress,
    extensionName,
    address, // sender for read-only call
    networkObj
  );
  const dynamicProposalBond = parseInt(votingConfig.proposalBond);
  const totalCostAmount = dynamicProposalBond + AIBTC_DAO_RUN_COST_AMOUNT;

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
    Pc.principal(address)
      .willSendGte(totalCostAmount.toString())
      .ft(`${daoTokenAddress}.${daoTokenName}`, daoTokenAssetName),
  ];

  console.log("==========");
  console.log(`Creating action proposal with the following parameters:`);
  console.log(
    `DAO Action Proposal Voting Contract: ${args.daoActionProposalVotingContract}`
  );
  console.log(`Action Contract to Execute: ${args.actionContractToExecute}`);
  console.log(`Message: ${args.messageToSend}`);
  console.log(`DAO Token Contract: ${args.daoTokenContract}`);
  console.log(`Memo: ${args.memo || "None"}`);
  console.log(`Total Cost Amount: ${totalCostAmount}`);
  console.log(`Post Conditions: ${JSON.stringify(postConditions, null, 2)}`);
  console.log(`Sender Address: ${address}`);

  const functionArgs = [
    Cl.principal(args.actionContractToExecute),
    Cl.bufferFromHex(Cl.serialize(Cl.stringAscii(args.messageToSend))),
    args.memo ? Cl.some(Cl.stringAscii(args.memo)) : Cl.none(),
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "create-action-proposal",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Allow,
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
