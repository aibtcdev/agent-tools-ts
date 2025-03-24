import * as fs from "fs";
import * as path from "path";
import { DaoCoreProposalGenerator } from "./services/dao-core-proposal-generator";
import { DaoCoreProposalDeployer } from "./services/dao-core-proposal-deployer";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  getCurrentBlockHeights,
  sendToLLM,
  ToolResponse,
} from "../utilities";
import { DeployedCoreProposalRegistryEntry } from "./services/dao-core-proposal-registry";
import { getContractName } from "./services/dao-contract-registry";

const usage = `Usage: bun run deploy-core-proposal.ts <daoDeployerAddress> <daoTokenSymbol> <proposalContractName> <proposalArgs> [generateFiles]`;
const usageExample = `Example: bun run deploy-core-proposal.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM aibtc aibtc-treasury-withdraw-stx '{"stx_amount": "1000000", "recipient_address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"}' true`;

interface ExpectedArgs {
  daoDeployerAddress: string;
  daoTokenSymbol: string;
  proposalContractName: string;
  proposalArgs: Record<string, string>;
  generateFiles?: boolean;
}

function validateArgs(): ExpectedArgs {
  // capture all arguments
  const [
    daoDeployerAddress,
    daoTokenSymbol,
    proposalContractName,
    proposalArgsJson,
    generateFiles,
  ] = process.argv.slice(2);

  // verify required arguments are provided
  if (!daoDeployerAddress || !daoTokenSymbol || !proposalContractName) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // parse proposal args if provided, or default to empty object
  let proposalArgs: Record<string, string> = {};
  if (proposalArgsJson) {
    try {
      proposalArgs = JSON.parse(proposalArgsJson);
    } catch (error) {
      // Provide more helpful error message with the specific JSON error
      const errorMessage = [
        `Invalid JSON for proposal arguments: ${proposalArgsJson}`,
        `JSON parse error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        usage,
        usageExample,
      ].join("\n");
      throw new Error(errorMessage);
    }
  }

  // convert generateFiles to boolean
  const shouldGenerateFiles = convertStringToBoolean(generateFiles);

  // return validated arguments
  return {
    daoDeployerAddress,
    daoTokenSymbol,
    proposalContractName,
    proposalArgs,
    generateFiles: shouldGenerateFiles,
  };
}

async function main(): Promise<
  ToolResponse<DeployedCoreProposalRegistryEntry>
> {
  // Step 0 - prep work

  // validate and store provided args
  const args = validateArgs();

  // setup network and wallet info
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const truncatedAddress = `${address.substring(0, 5)}-${address.slice(-5)}`;

  // get current block height
  const blockHeights = await getCurrentBlockHeights();

  // Step 1 - generate core proposal
  console.log(`Generating core proposal: ${args.proposalContractName}`);
  console.log(`With arguments:`, args.proposalArgs);

  // create proposal generator instance
  const proposalGenerator = new DaoCoreProposalGenerator(
    CONFIG.NETWORK,
    args.daoDeployerAddress
  );

  // generate the proposal
  const generatedProposal = proposalGenerator.generateCoreProposal(
    args.daoTokenSymbol,
    args.proposalContractName,
    args.proposalArgs
  );

  // Step 2 - deploy the proposal
  console.log(`Deploying core proposal: ${args.proposalContractName}`);

  // create proposal deployer instance
  const proposalDeployer = new DaoCoreProposalDeployer(
    CONFIG.NETWORK,
    address,
    key
  );

  // create a unique name for the proposal contract
  const contractName = getContractName(
    args.proposalContractName,
    args.daoTokenSymbol
  );
  const proposalName = `${contractName}-${blockHeights.stacks}`;

  // deploy the proposal
  const deployedProposal = await proposalDeployer.deployProposal(
    proposalName,
    generatedProposal
  );

  // Step 3 - save proposal (optional)
  if (args.generateFiles) {
    const outputDir = path.join(
      "generated",
      "proposals",
      args.daoTokenSymbol,
      "deployed"
    );
    fs.mkdirSync(outputDir, { recursive: true });

    // Save the proposal source code
    const sourceFileName = `${proposalName}.clar`;
    const sourceFilePath = path.join(outputDir, sourceFileName);
    fs.writeFileSync(sourceFilePath, generatedProposal.source);

    // Save deployment info
    const infoFileName = `${proposalName}.json`;
    const infoFilePath = path.join(outputDir, infoFileName);
    const deploymentInfo = {
      name: deployedProposal.name,
      friendlyName: deployedProposal.friendlyName,
      contractAddress: deployedProposal.contractAddress,
      sender: deployedProposal.sender,
      success: deployedProposal.success,
      txId: deployedProposal.txId,
      deployedAt: new Date().toISOString(),
      blockHeight: blockHeights.stacks,
    };
    fs.writeFileSync(infoFilePath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`Proposal source saved to ${sourceFilePath}`);
    console.log(`Deployment info saved to ${infoFilePath}`);
  }

  // Step 4 - return deployment result
  if (deployedProposal.success) {
    return {
      success: true,
      message: `Core proposal ${args.proposalContractName} deployed successfully`,
      data: {
        ...deployedProposal,
        // limit source to set chars for display / context size
        source: deployedProposal.source.substring(0, 250) + "...",
      },
    };
  } else {
    return {
      success: false,
      message: `Failed to deploy core proposal ${args.proposalContractName}`,
      data: {
        ...deployedProposal,
        // limit source to set chars for display / context size
        source: deployedProposal.source.substring(0, 250) + "...",
      },
    };
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
