import {
  ContractCategory,
  ContractSubCategory,
  getTraitReference,
  KnownAddresses,
  KnownTraits,
} from "../types/dao-types-v2";

type BaseFields = {
  name: string;
  templatePath: string;
  contractAddress?: string;
  sourceCode?: string;
};

type BaseAddresses = {
  ref: keyof KnownAddresses; // key in ADDRESSES
  key: string; // key in template
};

type BaseTraits = {
  ref: keyof KnownTraits; // key in TRAITS
  key: string; // key in template
};

type RequiredFields = BaseFields & {
  requiredAddresses?: BaseAddresses[];
  requiredTraits?: BaseTraits[];
};

type ContractRegistryEntry = {
  [C in ContractCategory]: RequiredFields & {
    type: C;
    subtype: ContractSubCategory<C>;
  };
}[ContractCategory];

/**
 * Central registry for each contract.
 */
export const CONTRACT_REGISTRY: ContractRegistryEntry[] = [
  {
    name: "aibtc-base-dao",
    type: "BASE",
    subtype: "DAO",
    templatePath: `aibtc-base-dao.clar`,
    requiredTraits: [
      {
        ref: "DAO_BASE",
        key: "base_dao_trait",
      },
      {
        ref: "DAO_PROPOSAL",
        key: "proposal_trait",
      },
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
    ],
  },
];
