import * as crypto from "crypto";
import * as path from "path";
import { Eta } from "eta";
import { StacksNetworkName } from "@stacks/network";
import {
  CORE_PROPOSAL_REGISTRY,
  GeneratedCoreProposalRegistryEntry,
} from "./dao-core-proposal-registry";
import { getKnownAddresses, getKnownTraits } from "../types/dao-types";
import {
  getContractName,
  getContractsBySubcategory,
} from "./dao-contract-registry";

export class DaoCoreProposalGenerator {
  private eta: Eta;
  private network: StacksNetworkName;
  private senderAddress: string;

  constructor(network: StacksNetworkName, senderAddress: string) {
    this.eta = new Eta({ views: path.join(__dirname, "../templates/dao") });
    this.network = network;
    this.senderAddress = senderAddress;
  }

  private generateContractPrincipal(contractName: string): string {
    return `${this.senderAddress}.${contractName}`;
  }

  /**
   * Generate a core proposal based on the CORE_PROPOSAL_REGISTRY
   *
   * @param tokenSymbol Token symbol for the DAO
   * @param proposalContractName Name of the proposal contract to generate
   * @param proposalArgs Arguments to pass to the proposal contract
   * @returns Generated contract registry entry
   */
  public generateCoreProposal(
    tokenSymbol: string,
    proposalContractName: string,
    proposalArgs: Record<string, string>
  ): GeneratedCoreProposalRegistryEntry {
    // Find the core proposal in the registry
    const coreProposal = CORE_PROPOSAL_REGISTRY.find(
      (proposal) => proposal.name === proposalContractName
    );
    if (!coreProposal) {
      throw new Error(
        `Core proposal not found: ${proposalContractName}. Possible proposals: ${CORE_PROPOSAL_REGISTRY.map(
          (proposal) => proposal.name
        ).join(", ")}`
      );
    }
    // get known trait refs and addresses
    const knownAddresses = getKnownAddresses(this.network);
    const knownTraitRefs = getKnownTraits(this.network);
    // collect any needed addresses
    const templateAddressVars = Object.fromEntries(
      (coreProposal.requiredAddresses || []).map(({ ref, key }) => {
        // Ensure we have a valid address reference
        if (!knownAddresses[ref]) {
          console.warn(`Warning: Missing address reference for ${ref}`);
        }
        return [key, knownAddresses[ref]];
      })
    );
    // collect any needed trait refs
    const templateTraitVars = Object.fromEntries(
      (coreProposal.requiredTraits || []).map(({ ref, key }) => {
        // Ensure we have a valid trait reference
        if (!knownTraitRefs[ref]) {
          console.warn(`Warning: Missing trait reference for ${ref}`);
        }
        return [key, knownTraitRefs[ref]];
      })
    );
    // collect any needed contract addresses
    const templateContractAddressVars = Object.fromEntries(
      (coreProposal.requiredContractAddresses || []).map(
        ({ key, category, subcategory }) => {
          // Find the matching contract in the CONTRACT_REGISTRY
          const [contract] = getContractsBySubcategory(category, subcategory);
          const contractAddress = getContractName(contract.name, tokenSymbol);
          return [key, this.generateContractPrincipal(contractAddress)];
        }
      )
    );
    const runtimeVars = Object.fromEntries(
      (coreProposal.requiredRuntimeValues || []).map(({ key }) => {
        // Handle special cases for parameter name mismatches
        let paramValue = proposalArgs[key];
        if (paramValue === undefined) {
          console.warn(`Warning: Missing argument for ${key}`);
          paramValue = "";
        }
        return [key, paramValue];
      })
    );
    // assemble all vars here to pass to ETA
    const templateVars = {
      ...templateAddressVars,
      ...templateTraitVars,
      ...templateContractAddressVars,
      ...runtimeVars,
    };

    // Debug: Check if all required variables are present
    const missingVars = [];
    for (const { key } of coreProposal.requiredRuntimeValues || []) {
      if (templateVars[key] === undefined) {
        missingVars.push(key);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required template variables: ${missingVars.join(
          ", "
        )} for proposal ${proposalContractName}`
      );
    }

    try {
      // Generate the contract source
      const source = this.eta.render(coreProposal.templatePath, templateVars);

      if (!source) {
        throw new Error(
          `Failed to generate source for proposal ${proposalContractName}`
        );
      }

      return {
        ...coreProposal,
        source,
        hash: crypto.createHash("sha256").update(source).digest("hex"),
      };
    } catch (error) {
      console.error(
        `Error rendering template for ${proposalContractName}:`,
        error
      );
      throw new Error(
        `Failed to generate proposal ${proposalContractName}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Generate all core proposals with default arguments
   * 
   * @param tokenSymbol Token symbol for the DAO
   * @returns Array of generated core proposal registry entries
   */
  public generateAllCoreProposals(
    tokenSymbol: string
  ): GeneratedCoreProposalRegistryEntry[] {
    const results: GeneratedCoreProposalRegistryEntry[] = [];
    
    // Generate each proposal in the registry with default arguments
    for (const proposal of CORE_PROPOSAL_REGISTRY) {
      try {
        // Create default arguments based on required runtime values
        const defaultArgs: Record<string, string> = {};
        
        // For each required runtime value, provide a placeholder value
        (proposal.requiredRuntimeValues || []).forEach(({ key }) => {
          // Set default values based on common parameter types
          if (key.includes('AMOUNT')) {
            defaultArgs[key] = '1000000'; // Default STX amount (1 STX)
          } else if (key.includes('RECIPIENT') || key.includes('ADDRESS')) {
            defaultArgs[key] = this.senderAddress; // Use sender address as default recipient
          } else if (key.includes('PERIOD') || key.includes('HEIGHT')) {
            defaultArgs[key] = '144'; // Default to ~1 day in blocks
          } else {
            defaultArgs[key] = 'default-value'; // Generic default
          }
        });

        // Generate the proposal with default arguments
        const generatedProposal = this.generateCoreProposal(
          tokenSymbol,
          proposal.name,
          defaultArgs
        );
        
        results.push(generatedProposal);
      } catch (error) {
        console.error(`Error generating proposal ${proposal.name}:`, error);
        // Continue with other proposals even if one fails
      }
    }
    
    return results;
  }
}
