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
   * @param proposalContractName Name of the proposal contract to generate
   * @param proposalArgs Arguments to pass to the proposal contract
   * @returns Generated contract registry entry
   */
  public generateCoreProposal(
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
          //console.warn(`Warning: Missing trait reference for ${ref}`);
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
          const contractAddress = getContractName(
            contract.name,
            "aibtc" //args.tokenSymbol
          );
          return [key, this.generateContractPrincipal(contractAddress)];
        }
      )
    );
    const runtimeVars = Object.fromEntries(
      (coreProposal.requiredRuntimeValues || []).map(({ key }) => {
        // Handle special cases for parameter name mismatches
        let paramValue = proposalArgs[key];
        
        // Map common parameter name variations
        if (paramValue === undefined) {
          // Handle common parameter name variations
          if (key === 'CFG_STX_AMOUNT' && proposalArgs['CFG_AMOUNT'] !== undefined) {
            paramValue = proposalArgs['CFG_AMOUNT'];
            console.log(`Using CFG_AMOUNT value for ${key}`);
          } else if (key === 'CFG_AMOUNT' && proposalArgs['CFG_STX_AMOUNT'] !== undefined) {
            paramValue = proposalArgs['CFG_STX_AMOUNT'];
            console.log(`Using CFG_STX_AMOUNT value for ${key}`);
          }
        }
        
        // Skip CFG_MESSAGE for now as it's handled separately
        if (key !== 'CFG_MESSAGE' && paramValue === undefined) {
          throw new Error(`Missing required runtime value: ${key} for proposal ${proposalContractName}. Available args: ${Object.keys(proposalArgs).join(', ')}`);
        }
        
        // Use the provided value or a default empty string for CFG_MESSAGE
        const value = key === 'CFG_MESSAGE' 
          ? (paramValue || 'DAO proposal execution')
          : paramValue;
          
        return [key, value];
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
      throw new Error(`Missing required template variables: ${missingVars.join(', ')} for proposal ${proposalContractName}`);
    }
    
    // Debug output to help with troubleshooting
    console.log(`Template variables for ${proposalContractName}:`, 
      Object.keys(templateVars).reduce((acc, key) => {
        acc[key] = typeof templateVars[key] === 'string' && 
                  templateVars[key].length > 30 ? 
                  templateVars[key].substring(0, 30) + '...' : 
                  templateVars[key];
        return acc;
      }, {})
    );

    try {
      // Generate the contract source
      const source = this.eta.render(coreProposal.templatePath, templateVars);
      
      if (!source) {
        throw new Error(`Failed to generate source for proposal ${proposalContractName}`);
      }
      
      return {
        ...coreProposal,
        source,
        hash: crypto.createHash("sha256").update(source).digest("hex"),
      };
    } catch (error) {
      console.error(`Error rendering template for ${proposalContractName}:`, error);
      throw new Error(`Failed to generate proposal ${proposalContractName}: ${error.message}`);
    }
    // This code is now handled in the try/catch block above
  }
}
