import {
  makeContractCall,
  PostConditionMode,
  SignedContractCallOptions,
  uintCV,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  isValidContractPrincipal,
  sendToLLM,
} from "../../utilities";

const usage =
  "Usage: bun run execute-dao-proposal.ts <daoGovernanceContract> <proposalId>";
const usageExample =
  "Example: bun run execute-dao-proposal.ts ST2V0YVFX1AD1JHFKVPPR1EDBRQ1K9BWN2VTH42VE.dao-governance 1";

interface ExpectedArgs {
  daoGovernanceContract: string;
  proposalId: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoGovernanceContract, proposalIdStr] = process.argv.slice(2);

  if (!daoGovernanceContract || !proposalIdStr) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // Validate proposal ID
  const proposalId = parseInt(proposalIdStr);
  if (isNaN(proposalId) || proposalId <= 0) {
    const errorMessage = [
      `Invalid proposal ID: ${proposalIdStr}. Must be a positive number.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // verify contract address
  if (!isValidContractPrincipal(daoGovernanceContract)) {
    const errorMessage = [
      `Invalid contract address: ${daoGovernanceContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // return validated arguments
  return {
    daoGovernanceContract,
    proposalId,
  };
}

// Executes an approved proposal in the DAO governance contract
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.daoGovernanceContract.split(".");

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
    contractAddress,
    contractName,
    functionName: "execute-proposal",
    functionArgs: [uintCV(args.proposalId)],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Allow,
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
