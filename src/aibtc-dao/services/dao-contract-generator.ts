import * as crypto from "crypto";
import * as path from "path";
import { Eta } from "eta";
import { StacksNetworkName } from "@stacks/network";
import {
  CONTRACT_REGISTRY,
  BaseContractRegistryEntry,
  GeneratedContractRegistryEntry,
  getContractName,
  getContractsBySubcategory,
} from "../registries/dao-contract-registry";
import {
  ContractCategory,
  ContractSubCategory,
  ContractCopyConfig,
  ExpectedContractGeneratorArgs,
  getKnownAddresses,
  getKnownTraits,
} from "../types/dao-types";

export class DaoContractGenerator {
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
   * Generate contracts based on the CONTRACT_REGISTRY
   *
   * @param args Configuration arguments for contract generation
   * @param contractCopies Configuration for contracts that need multiple copies
   * @param contractIds Optional array of registry entries to filter by
   * @returns Record<string, GeneratedContractRegistryEntry> Dictionary of generated contracts
   */
  public generateContracts(
    args: ExpectedContractGeneratorArgs,
    contractCopies?: ContractCopyConfig[],
    contractIds?: BaseContractRegistryEntry[]
  ): Record<string, GeneratedContractRegistryEntry> {
    const traitRefs = getKnownTraits(this.network);
    const knownAddresses = getKnownAddresses(this.network);

    // Filter by contract IDs or default to "all in registry"
    const contractsToGenerate = contractIds
      ? CONTRACT_REGISTRY.filter((contract) => contractIds.includes(contract))
      : CONTRACT_REGISTRY;

    // Create a dictionary to hold the generated contracts
    const generatedContracts: Record<string, GeneratedContractRegistryEntry> = {};

    // Sort contracts by deployment order and generate each one
    const sortedContracts = [...contractsToGenerate].sort(
      (a, b) => a.deploymentOrder - b.deploymentOrder
    );

    sortedContracts.forEach((contract) => {
      // Check if this contract needs multiple copies
      const copyConfig = contractCopies?.find(
        config => config.type === contract.type && config.subtype === contract.subtype
      );
      
      // If no copies needed, generate a single contract as before
      if (!copyConfig) {
        this.generateSingleContract(contract, args, generatedContracts);
        return;
      }
      
      // Generate multiple copies with numbered suffixes
      const count = copyConfig.count || 1;
      const nameFormat = copyConfig.nameFormat || "{name}-{index}";
      
      for (let i = 1; i <= count; i++) {
        // Create a copy of the contract with a modified name
        const contractCopy = { ...contract };
        const baseName = getContractName(contract.name, args.tokenSymbol);
        const numberedName = nameFormat
          .replace("{name}", baseName)
          .replace("{index}", i.toString());
        
        // Generate the contract with the numbered name
        this.generateSingleContract(
          contractCopy, 
          args, 
          generatedContracts, 
          numberedName
        );
      }
    });

    return generatedContracts;
  }

  /**
   * Generate a single contract
   * 
   * @param contract Contract registry entry
   * @param args Configuration arguments
   * @param generatedContracts Output dictionary to store the result
   * @param overrideName Optional name override
   */
  private generateSingleContract(
    contract: BaseContractRegistryEntry,
    args: ExpectedContractGeneratorArgs,
    generatedContracts: Record<string, GeneratedContractRegistryEntry>,
    overrideName?: string
  ): void {
    // build contract name by replacing aibtc symbol (or use override)
    const contractName = overrideName || getContractName(contract.name, args.tokenSymbol);
    
    // these are generated through Faktory API URLs instead of templates
    if (contract.type === "TOKEN") {
      if (contract.subtype === "POOL_STX") return; // skip STX pool contract
      const faktoryContract: GeneratedContractRegistryEntry = {
        name: contractName,
        type: contract.type,
        subtype: contract.subtype,
        source: "",
      } as GeneratedContractRegistryEntry; // make TS happy
      generatedContracts[contractName] = faktoryContract;
      return;
    }
    
    const traitRefs = getKnownTraits(this.network);
    const knownAddresses = getKnownAddresses(this.network);
    
    // collect all traits into template variables
    const traitVars = Object.fromEntries(
      (contract.requiredTraits || []).map(({ ref, key }) => {
        // Ensure we have a valid trait reference
        if (!traitRefs[ref]) {
          //console.warn(`Warning: Missing trait reference for ${ref}`);
        }
        return [key, traitRefs[ref]];
      })
    );

    // Collect any needed addresses
    const addressVars = Object.fromEntries(
      (contract.requiredAddresses || []).map(({ ref, key }) => {
        // Ensure we have a valid address reference
        if (!knownAddresses[ref]) {
          //console.warn(`Warning: Missing address reference for ${ref}`);
        }
        return [key, knownAddresses[ref]];
      })
    );
    
    // Collect any required contract addresses
    const contractAddressVars = Object.fromEntries(
      (contract.requiredContractAddresses || []).map(
        ({ key, category, subcategory }) => {
          // Find the matching contract in the CONTRACT_REGISTRY
          const [contract] = getContractsBySubcategory(category, subcategory);
          const contractAddress = getContractName(
            contract.name,
            args.tokenSymbol
          );
          return [key, this.generateContractPrincipal(contractAddress)];
        }
      )
    );

    // Collect all required runtime template variables
    const runtimeVars: Record<string, string | number | boolean | undefined> = {};
    (contract.requiredRuntimeValues || []).forEach(({ key }) => {
      // Handle specific runtime values based on the key
      switch (key) {
        case "hash":
          runtimeVars[key] = ""; // temporary override
          break;
        case "target_stx":
          // Default to 0 if not provided
          runtimeVars[key] = 0;
          break;
        case "token_max_supply":
          runtimeVars[key] = args.tokenMaxSupply;
          break;
        case "token_name":
          runtimeVars[key] = args.tokenName;
          break;
        case "token_symbol":
          runtimeVars[key] = args.tokenSymbol;
          break;
        case "token_decimals":
          // Default to 6 if not provided
          runtimeVars[key] = 6;
          break;
        case "token_uri":
          runtimeVars[key] = args.tokenUri;
          break;
        case "token_deployment_fee_address":
          // Use the BITFLOW_FEE address from knownAddresses
          runtimeVars[key] = knownAddresses.BITFLOW_FEE;
          break;
        case "dao_manifest":
          runtimeVars[key] = args.daoManifest;
          break;
        case "dao_manifest_inscription_id":
          // This would typically come from an external source
          // For now, use a placeholder or derive from other values
          runtimeVars[key] = `${args.daoManifestInscriptionId}`;
          break;
        default:
          //console.warn(`Warning: Unknown runtime value key: ${key}`);
          runtimeVars[key] = undefined;
      }

      if (runtimeVars[key] === undefined) {
        //console.warn(`Warning: Missing runtime value for ${key}`);
      }
    });

    // combine them into a single object for the template where
    // key is the object key and value is the object value
    const templateVars = {
      ...traitVars,
      ...addressVars,
      ...contractAddressVars,
      ...runtimeVars,
    };

    // render the template
    const source = this.eta.render(contract.templatePath, templateVars);

    // hash the contract
    const hash = crypto.createHash("sha256").update(source).digest("hex");

    // create the generated contract entry
    const generatedContract: GeneratedContractRegistryEntry = {
      name: contractName,
      type: contract.type,
      subtype: contract.subtype,
      source,
      hash,
    } as GeneratedContractRegistryEntry; // make TS happy

    // Add to results dictionary
    generatedContracts[contractName] = generatedContract;
  }

  /**
   * Generate bootstrap template code for multiple timed vault copies
   * 
   * @param baseContractName Base contract name
   * @param count Number of copies
   * @param tokenSymbol Token symbol to replace in contract names
   * @returns String with Clarity code to initialize all timed vault copies
   */
  public generateTimedVaultBootstrapCode(
    baseContractName: string,
    count: number,
    tokenSymbol: string
  ): string {
    let code = "";
    
    // Add the base contract
    const baseName = getContractName(baseContractName, tokenSymbol);
    code += `(try! (contract-call? .base-dao-contract add-extension .${baseName}-contract))\n`;
    
    // Add all the numbered copies
    for (let i = 1; i <= count; i++) {
      const numberedName = `${baseName}-${i}`;
      code += `(try! (contract-call? .base-dao-contract add-extension .${numberedName}-contract))\n`;
    }
    
    return code;
  }
}
