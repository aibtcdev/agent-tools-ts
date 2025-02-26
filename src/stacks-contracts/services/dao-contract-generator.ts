import * as path from "path";
import { SHA256 } from "bun";
import { Eta } from "eta";
import { StacksNetworkName } from "@stacks/network";
import {
  ExpectedContractGeneratorArgs,
  getKnownAddresses,
  getKnownTraits,
} from "../types/dao-types";
import {
  CONTRACT_REGISTRY,
  BaseContractRegistryEntry,
  GeneratedContractRegistryEntry,
  getContractName,
  getContractsBySubcategory,
} from "./dao-contract-registry";

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
   * @param tokenSymbol Token symbol to replace in contract names
   * @param contractIds Optional array of registry entries to filter by
   * @returns Record<string, GeneratedContractRegistryEntry> Dictionary of generated contracts
   */
  public generateContracts(
    args: ExpectedContractGeneratorArgs,
    contractIds?: BaseContractRegistryEntry[]
  ): Record<string, GeneratedContractRegistryEntry> {
    const traitRefs = getKnownTraits(this.network);
    const knownAddresses = getKnownAddresses(this.network);

    // Filter by contract IDs or default to "all in registry"
    const contractsToGenerate = contractIds
      ? CONTRACT_REGISTRY.filter((contract) => contractIds.includes(contract))
      : CONTRACT_REGISTRY;

    // Create a dictionary to hold the generated contracts
    const generatedContracts: Record<string, GeneratedContractRegistryEntry> =
      {};

    // Sort contracts by deployment order and generate each one
    const sortedContracts = [...contractsToGenerate].sort(
      (a, b) => a.deploymentOrder - b.deploymentOrder
    );

    sortedContracts.forEach((contract) => {
      //console.log("===================================");
      //console.log(`Generating contract: ${contract.name}`);
      // Build contract name by replacing aibtc symbol
      const contractName = getContractName(contract.name, args.tokenSymbol);

      // Collect all traits into template variables
      const traitVars = Object.fromEntries(
        (contract.requiredTraits || []).map(({ ref, key }) => {
          // Ensure we have a valid trait reference
          if (!traitRefs[ref]) {
            console.warn(`Warning: Missing trait reference for ${ref}`);
          }
          return [key, traitRefs[ref]];
        })
      );
      //console.log(`- required traits: ${Object.keys(traitVars)}`);

      // Collect any needed addresses
      const addressVars = Object.fromEntries(
        (contract.requiredAddresses || []).map(({ ref, key }) => {
          // Ensure we have a valid address reference
          if (!knownAddresses[ref]) {
            console.warn(`Warning: Missing address reference for ${ref}`);
          }
          return [key, knownAddresses[ref]];
        })
      );
      //console.log(`- required addresses: ${Object.keys(addressVars)}`);
      //console.log(`- generated contracts: ${Object.keys(generatedContracts)}`);
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
      const runtimeVars: Record<string, string | number | boolean | undefined> =
        {};
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
            console.warn(`Warning: Unknown runtime value key: ${key}`);
            runtimeVars[key] = undefined;
        }

        if (runtimeVars[key] === undefined) {
          console.warn(`Warning: Missing runtime value for ${key}`);
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
      //console.log(`templateVars: ${JSON.stringify(templateVars)}`);

      // render the template
      const source = this.eta.render(contract.templatePath, templateVars);

      // hash the contract
      const sha256 = new SHA256();
      sha256.update(source);
      const hash = sha256.digest("hex");

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
    });

    return generatedContracts;
  }
}
