import * as fs from "fs";
import * as path from "path";
import { DaoCoreProposalGenerator } from "./services/dao-core-proposal-generator";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  getCurrentBlockHeights,
  sendToLLM,
  ToolResponse,
} from "../utilities";
import { GeneratedCoreProposalRegistryEntry } from "./services/dao-core-proposal-registry";

const usage = `Usage: bun run generate-all-core-proposals.ts <daoTokenSymbol> [generateFiles]`;
const usageExample = `Example: bun run generate-all-core-proposals.ts aibtc true`;

interface ExpectedArgs {
  tokenSymbol: string;
  generateFiles?: boolean;
}

function validateArgs(): ExpectedArgs {
  // capture all arguments
  const [tokenSymbol, generateFiles] = process.argv.slice(2);

  // verify required arguments are provided
  if (!tokenSymbol) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // convert generateFiles to boolean
  const shouldGenerateFiles = convertStringToBoolean(generateFiles);

  // return validated arguments
  return {
    tokenSymbol,
    generateFiles: shouldGenerateFiles,
  };
}

async function main(): Promise<
  ToolResponse<GeneratedCoreProposalRegistryEntry[]>
> {
  // Step 0 - prep work

  // validate and store provided args
  const args = validateArgs();

  // setup network and wallet info
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const truncatedAddress = `${address.substring(0, 5)}-${address.slice(-5)}`;

  // get current block height - we'll use the same height for all proposals
  const blockHeights = await getCurrentBlockHeights();

  // create proposal generator instance
  const proposalGenerator = new DaoCoreProposalGenerator(
    CONFIG.NETWORK,
    address
  );

  // Step 1 - generate all core proposals
  console.log(`Generating all core proposals for ${args.tokenSymbol}`);

  const generatedProposals = proposalGenerator.generateAllCoreProposals(
    args.tokenSymbol
  );

  console.log(`Generated ${generatedProposals.length} core proposals`);

  // Step 2 - save proposals (optional)
  if (args.generateFiles) {
    const outputDir = path.join("generated", "proposals", args.tokenSymbol);
    fs.mkdirSync(outputDir, { recursive: true });

    // Create a summary file with information about all proposals
    const summaryPath = path.join(
      outputDir,
      `${args.tokenSymbol}-proposals-summary.json`
    );
    const summary = generatedProposals.map((proposal) => ({
      name: proposal.name,
      friendlyName: proposal.friendlyName,
      hash: proposal.hash,
      fileName: `${proposal.name}-${truncatedAddress}-${blockHeights.stacks}.clar`,
    }));
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`Proposal summary saved to ${summaryPath}`);

    // Save each individual proposal
    generatedProposals.forEach((proposal) => {
      const fileName = `${proposal.name}-${truncatedAddress}-${blockHeights.stacks}.clar`;
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, proposal.source);
      console.log(`Proposal saved to ${filePath}`);
    });
  }

  // Step 3 - return generated proposals
  return {
    success: true,
    message: `Generated ${generatedProposals.length} core proposals for ${args.tokenSymbol}`,
    data: generatedProposals,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
