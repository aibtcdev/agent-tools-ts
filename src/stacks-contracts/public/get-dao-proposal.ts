import {
  fetchCallReadOnlyFunction,
  ClarityValue,
  cvToJSON,
  uintCV,
} from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  getNetwork,
  isValidContractPrincipal,
  sendToLLM,
} from "../../utilities";

const usage =
  "Usage: bun run get-dao-proposal.ts <daoGovernanceContract> <proposalId>";
const usageExample =
  "Example: bun run get-dao-proposal.ts ST2V0YVFX1AD1JHFKVPPR1EDBRQ1K9BWN2VTH42VE.dao-governance 1";

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

// Gets details about a proposal from the DAO governance contract
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.daoGovernanceContract.split(".");

  // setup network
  const networkObj = getNetwork(CONFIG.NETWORK);

  // call the read-only function
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-proposal",
    functionArgs: [uintCV(args.proposalId)],
    network: networkObj,
    senderAddress: contractAddress,
  });

  // parse and return the result
  const jsonResult = cvToJSON(result as ClarityValue);

  return {
    success: true,
    message: `Retrieved proposal #${args.proposalId}`,
    data: jsonResult,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
