import { Eta } from "eta";
import * as path from "path";
import {
  ExtensionRegistryEntry,
  EXTENSION_REGISTRY,
} from "./dao-extensions-registry";
import {
  getKnownAddresses,
  getTraitReferences,
  NetworkName,
} from "../types/dao-types-v2";

export class DaoContractGenerator {
  private eta: Eta;
  private network: NetworkName;

  constructor(network: NetworkName) {
    this.eta = new Eta({ views: path.join(__dirname, "../templates/dao") });
    this.network = network;
  }

  public generateExtensions(symbol: string, extensionIds?: string[]) {
    const traitRefs = getTraitReferences(this.network);
    const knownAddresses = getKnownAddresses(this.network);

    // Filter by extension IDs or default to “all in registry”
    const extensionsToGenerate = extensionIds
      ? EXTENSION_REGISTRY.filter((ext) => extensionIds.includes(ext.id))
      : EXTENSION_REGISTRY;

    return extensionsToGenerate.map((ext) => {
      // Build contract name by replacing SYMBOL
      const contractName = ext.contractNamePattern.replace(
        /SYMBOL/g,
        symbol.toLowerCase()
      );

      // Collect all traits into template variables
      const traitVars = Object.fromEntries(
        ext.requiredTraits.map(({ category, contract, key }) => {
          const ref = traitRefs[category][contract];
          // e.g. "ST12ABC.xyz::myTrait"
          const traitAddress = `${ref.contractAddress}.${ref.contractName}::${ref.traitName}`;
          return [key, traitAddress];
        })
      );

      // Collect any needed addresses
      const addressVars = Object.fromEntries(
        (ext.requiredAddresses || []).map(({ ref, key }) => {
          return [key, knownAddresses[ref]];
        })
      );

      // Collect additional variables from `getVariables`
      const extraVars = ext.getVariables?.(symbol) ?? {};

      // Combine them into a single object for the template
      const templateVars = {
        network: this.network,
        ...traitVars,
        ...addressVars,
        ...extraVars,
      };

      // Render the template
      const clarSource = this.eta.render(ext.templatePath, templateVars);

      return {
        id: ext.id,
        name: contractName,
        source: clarSource,
      };
    });
  }
}
