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
   * Generate mock runtime values based on proposal type and parameter name
   * 
   * @param proposalName Name of the proposal
   * @param paramKey Parameter key
   * @returns Appropriate mock value for the parameter
   */
  private generateMockRuntimeValue(proposalName: string, paramKey: string, tokenSymbol: string = 'DAO'): string {
    // Convert to lowercase for easier matching
    const keyLower = paramKey.toLowerCase();
    const proposalLower = proposalName.toLowerCase();

    // STX and token amounts
    if (keyLower.includes('stx_amount') || keyLower === 'amount_to_fund_stx') {
      return '10000000'; // 10 STX
    }
    
    if (keyLower === 'token_amount' || keyLower === 'amount_to_fund_ft') {
      return '1000000000'; // 1000 tokens (assuming 6 decimals)
    }
    
    if (keyLower === 'bond_amount') {
      return '5000000'; // 5 STX for proposal bonds
    }
    
    if (keyLower === 'delegate_amount') {
      return '100000000'; // 100 STX for delegation
    }
    
    if (keyLower === 'withdrawal_amount') {
      return '2500000'; // 2.5 STX for withdrawals
    }

    // Addresses and principals
    if (keyLower.includes('address') || 
        keyLower.includes('recipient') || 
        keyLower === 'account_holder' ||
        keyLower === 'delegate_to' ||
        keyLower === 'payout_address') {
      return this.senderAddress;
    }
    
    if (keyLower.includes('contract') || keyLower.includes('extension')) {
      return `${this.senderAddress}.example-contract`;
    }

    // Time periods
    if (keyLower.includes('period') || keyLower.includes('block')) {
      return '144'; // ~1 day in blocks
    }
    
    if (keyLower === 'last_withdrawal_block') {
      return '100000'; // Some past block
    }

    // Resource-related fields
    if (keyLower === 'resource_name') {
      return 'example-resource';
    }
    
    if (keyLower === 'resource_description') {
      return 'This is an example resource for the DAO';
    }
    
    if (keyLower === 'resource_price' || keyLower === 'resource_amount') {
      return '1000000'; // 1 STX
    }
    
    if (keyLower === 'resource_url') {
      return 'https://example.com/resource';
    }
    
    if (keyLower === 'resource_index') {
      return '0'; // First resource
    }

    // NFT-related fields
    if (keyLower === 'nft_id') {
      return '1';
    }

    // Message-related fields
    if (keyLower === 'message' || keyLower === 'message_to_send') {
      return `"Example DAO message from ${tokenSymbol} DAO"`;
    }

    // DAO Charter fields
    if (keyLower === 'dao_charter_text') {
      return `"This is the charter for the ${tokenSymbol} DAO"`;
    }
    
    if (keyLower === 'dao_charter_inscription_id') {
      return '"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"';
    }

    // Token URI
    if (keyLower === 'token_uri') {
      return `"https://example.com/${tokenSymbol.toLowerCase()}-metadata.json"`;
    }

    // Default fallback
    return `"default-value-for-${paramKey}"`;
  }

  /**
   * Generate all core proposals with intelligent mock arguments
   * 
   * @param tokenSymbol Token symbol for the DAO
   * @returns Array of generated core proposal registry entries
   */
  public generateAllCoreProposals(
    tokenSymbol: string
  ): GeneratedCoreProposalRegistryEntry[] {
    const results: GeneratedCoreProposalRegistryEntry[] = [];
    
    // Generate each proposal in the registry with mock arguments
    for (const proposal of CORE_PROPOSAL_REGISTRY) {
      try {
        // Create mock arguments based on required runtime values
        const mockArgs: Record<string, string> = {};
        
        // For each required runtime value, provide an appropriate mock value
        (proposal.requiredRuntimeValues || []).forEach(({ key }) => {
          mockArgs[key] = this.generateMockRuntimeValue(proposal.name, key, tokenSymbol);
        });

        // Generate the proposal with mock arguments
        const generatedProposal = this.generateCoreProposal(
          tokenSymbol,
          proposal.name,
          mockArgs
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
