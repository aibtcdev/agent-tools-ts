import * as fs from "fs";
import * as path from "path";
import { validateStacksAddress } from "@stacks/transactions";
import { DaoCoreProposalGenerator } from "../../services/dao-core-proposal-generator";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";
import { GeneratedCoreProposalRegistryEntry } from "../../services/dao-core-proposal-registry";

const usage = `Usage: bun run generate-core-proposal.ts <proposalContractName> [proposalArgs]`;
const usageExample = `Example: bun run generate-core-proposal.ts aibtc-treasury-withdraw-stx '{"amount": "1000000"}'`;

interface ProposalGeneratorArgs {
  proposalContractName: string;
  proposalArgs: Record<string, string>;
}

function validateArgs(): ProposalGeneratorArgs {
  // capture all arguments
  const [proposalContractName, proposalArgsJson] = process.argv.slice(2);

  // verify required arguments are provided
  if (!proposalContractName) {
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
      const errorMessage = [
        `Invalid JSON for proposal arguments: ${proposalArgsJson}`,
        usage,
        usageExample,
      ].join("\n");
      throw new Error(errorMessage);
    }
  }

  // return validated arguments
  return {
    proposalContractName,
    proposalArgs,
  };
}

async function main(): Promise<ToolResponse<GeneratedCoreProposalRegistryEntry>> {
  // Step 0 - prep work
  
  // validate and store provided args
  const args = validateArgs();
  
  // setup network and wallet info
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  
  // create proposal generator instance
  const proposalGenerator = new DaoCoreProposalGenerator(CONFIG.NETWORK, address);

  // Step 1 - generate core proposal
  
  const generatedProposal = proposalGenerator.generateCoreProposal(
    args.proposalContractName,
    args.proposalArgs
  );

  // Step 2 - save proposal (optional)
  
  const outputDir = path.join("generated", "proposals");
  fs.mkdirSync(outputDir, { recursive: true });
  const fileName = `${args.proposalContractName}.clar`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, generatedProposal.source);

  // Step 3 - return generated proposal
  
  return {
    success: true,
    message: `Core proposal ${args.proposalContractName} generated successfully`,
    data: {
      ...generatedProposal,
      // limit source to set chars for display / context size
      source: generatedProposal.source.substring(0, 250) + "...",
    },
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
