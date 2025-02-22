import { Eta } from "eta";
import * as path from "path";
import {
  GeneratedContract,
  getKnownAddresses,
  getKnownTraits,
  NetworkName,
} from "../types/dao-types-v2";
import {
  CONTRACT_REGISTRY,
  ContractRegistryEntry,
} from "./dao-contract-registry";

export class DaoContractGenerator {
  private eta: Eta;
  private network: NetworkName;

  constructor(network: NetworkName) {
    this.eta = new Eta({ views: path.join(__dirname, "../templates/dao") });
    this.network = network;
  }

  public generateContracts(
    symbol: string,
    contractIds?: ContractRegistryEntry[]
  ): GeneratedContract[] {
    const traitRefs = getKnownTraits(this.network);
    const knownAddresses = getKnownAddresses(this.network);

    // Filter by contract IDs or default to “all in registry”
    const contractsToGenerate = contractIds
      ? CONTRACT_REGISTRY.filter((contract) => contractIds.includes(contract))
      : CONTRACT_REGISTRY;

    return contractsToGenerate.map((contract) => {
      // Build contract name by replacing aibtc symbol
      const contractName = contract.name.replace(
        /aibtc/g,
        symbol.toLowerCase()
      );

      // Collect all traits into template variables
      const traitVars = Object.fromEntries(
        (contract.requiredTraits || []).map(({ ref, key }) => {
          return [key, traitRefs[ref]];
        })
      );

      // Collect any needed addresses
      const addressVars = Object.fromEntries(
        (contract.requiredAddresses || []).map(({ ref, key }) => {
          return [key, knownAddresses[ref]];
        })
      );

      // Combine them into a single object for the template
      const templateVars = {
        network: this.network,
        ...traitVars,
        ...addressVars,
      };

      // Render the template
      const claritySource = this.eta.render(
        contract.templatePath,
        templateVars
      );

      return {
        name: contractName,
        source: claritySource,
      };
    });
  }
}
