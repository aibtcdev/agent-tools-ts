import {
  ContractCategory,
  ContractSubCategory,
  KnownAddresses,
  KnownTraits,
} from "../types/dao-types-v2";

// setup fields for each contract

type BaseFields = {
  name: string;
  templatePath: string;
};

type GeneratedFields = {
  address?: string;
  source?: string;
  hash?: string;
};

type ContractFields = BaseFields & GeneratedFields;

// set up template fields for each contract
// maps to names values used with each contract

type BaseAddresses = {
  ref: keyof KnownAddresses; // key in ADDRESSES
  key: string; // key in template
};

type BaseTraits = {
  ref: keyof KnownTraits; // key in TRAITS
  key: string; // key in template
};

type TemplateFields = BaseFields & {
  requiredAddresses?: BaseAddresses[];
  requiredTraits?: BaseTraits[];
};

// combine all the fields into whats required

type RequiredFields = ContractFields & TemplateFields;

// define a strongly-typed contract registry entry
// this object is the main source of truth for all contracts in the DAO
// and should be cloned to generate and deploy contracts

export type ContractRegistryEntry = {
  [C in ContractCategory]: RequiredFields & {
    type: C;
    subtype: ContractSubCategory<C>;
  };
}[ContractCategory];

/**
 * Central registry for each contract in the DAO.
 * Clone this object to generate and deploy contracts.
 */
export const CONTRACT_REGISTRY: ContractRegistryEntry[] = [
  // token contracts
  {
    name: "aibtc-faktory",
    type: "TOKEN",
    subtype: "DAO",
    templatePath: `extensions/aibtc-token.clar`,
  },
  {
    name: "aibtc-faktory-dex",
    type: "TOKEN",
    subtype: "DEX",
    templatePath: `extensions/aibtc-token-dex.clar`,
  },
  {
    name: "xyk-pool-stx-aibtc-v-1-1",
    type: "TOKEN",
    subtype: "POOL",
    templatePath: `extensions/aibtc-bitflow-pool.clar`,
  },
  // base dao
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
  // dao extensions
  {
    name: "aibtc-action-proposals-v2",
    type: "EXTENSIONS",
    subtype: "ACTION_PROPOSALS",
    templatePath: `extensions/aibtcdev-action-proposals-v2.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_ACTION_PROPOSALS",
        key: "action_proposals_trait",
      },
      {
        ref: "DAO_ACTION",
        key: "action_trait",
      },
      {
        ref: "DAO_TREASURY",
        key: "treasury_trait",
      },
    ],
  },
  {
    name: "aibtc-bank-account",
    type: "EXTENSIONS",
    subtype: "BANK_ACCOUNT",
    templatePath: `extensions/aibtc-bank-account.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_BANK_ACCOUNT",
        key: "bank_account_trait",
      },
    ],
  },
  {
    name: "aibtc-core-proposals-v2",
    type: "EXTENSIONS",
    subtype: "CORE_PROPOSALS",
    templatePath: `extensions/aibtcdev-core-proposals-v2.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_CORE_PROPOSALS",
        key: "core_proposals_trait",
      },
      {
        ref: "DAO_PROPOSAL",
        key: "proposal_trait",
      },
      {
        ref: "DAO_TREASURY",
        key: "treasury_trait",
      },
    ],
  },
  {
    name: "aibtc-dao-charter",
    type: "EXTENSIONS",
    subtype: "CHARTER",
    templatePath: `extensions/aibtc-dao-charter.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_CHARTER",
        key: "charter_trait",
      },
    ],
  },
  {
    name: "aibtc-onchain-messaging",
    type: "EXTENSIONS",
    subtype: "MESSAGING",
    templatePath: `extensions/aibtc-onchain-messaging.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_MESSAGING",
        key: "messaging_trait",
      },
    ],
  },
  {
    name: "aibtc-payments-invoices",
    type: "EXTENSIONS",
    subtype: "PAYMENTS",
    templatePath: `extensions/aibtc-payments-invoices.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_INVOICES",
        key: "payments_trait",
      },
      {
        ref: "DAO_RESOURCES",
        key: "resources_trait",
      },
    ],
  },
  {
    name: "aibtc-token-owner",
    type: "EXTENSIONS",
    subtype: "TOKEN_OWNER",
    templatePath: `extensions/aibtc-token-owner.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_TOKEN_OWNER",
        key: "token_owner_trait",
      },
    ],
  },
  {
    name: "aibtc-treasury",
    type: "EXTENSIONS",
    subtype: "TREASURY",
    templatePath: `extensions/aibtc-treasury.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_TREASURY",
        key: "treasury_trait",
      },
      {
        ref: "STANDARD_SIP010",
        key: "sip10_trait",
      },
      {
        ref: "STANDARD_SIP009",
        key: "sip9_trait",
      },
    ],
  },
  // dao action extensions
  {
    name: "aibtc-action-add-resource",
    type: "ACTIONS",
    subtype: "PAYMENTS_INVOICES_ADD_RESOURCE",
    templatePath: `extensions/actions/aibtc-action-add-resource.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_ACTION",
        key: "action_trait",
      },
    ],
  },
  {
    name: "aibtc-action-allow-asset.clar",
    type: "ACTIONS",
    subtype: "TREASURY_ALLOW_ASSET",
    templatePath: `extensions/actions/aibtc-action-allow-asset.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_ACTION",
        key: "action_trait",
      },
    ],
  },
  {
    name: "aibtc-action-send-message",
    type: "ACTIONS",
    subtype: "MESSAGING_SEND_MESSAGE",
    templatePath: `extensions/actions/aibtc-action-send-message.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_ACTION",
        key: "action_trait",
      },
    ],
  },
  {
    name: "aibtc-action-set-account-holder",
    type: "ACTIONS",
    subtype: "BANK_ACCOUNT_SET_ACCOUNT_HOLDER",
    templatePath: `extensions/actions/aibtc-set-account-holder.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_ACTION",
        key: "action_trait",
      },
    ],
  },
  {
    name: "aibtc-action-set-withdrawal-amount",
    type: "ACTIONS",
    subtype: "BANK_ACCOUNT_SET_WITHDRAWAL_AMOUNT",
    templatePath: `extensions/actions/aibtc-set-withdrawal-amount.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_ACTION",
        key: "action_trait",
      },
    ],
  },
  {
    name: "aibtc-action-set-withdrawal-period",
    type: "ACTIONS",
    subtype: "BANK_ACCOUNT_SET_WITHDRAWAL_PERIOD",
    templatePath: `extensions/actions/aibtc-set-withdrawal-period.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_ACTION",
        key: "action_trait",
      },
    ],
  },
  {
    name: "aibtc-action-toggle-resource",
    type: "ACTIONS",
    subtype: "PAYMENTS_INVOICES_TOGGLE_RESOURCE",
    templatePath: `extensions/actions/aibtc-toggle-resource.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_ACTION",
        key: "action_trait",
      },
    ],
  },
  // proposals
  {
    name: "aibtc-base-bootstrap-initialization-v2",
    type: "PROPOSALS",
    subtype: "BOOTSTRAP_INIT",
    templatePath: `proposals/aibtc-base-bootstrap-initialization-v2.clar`,
    requiredTraits: [
      {
        ref: "DAO_PROPOSAL",
        key: "proposal_trait",
      },
    ],
  },
] as const;

/**
 * Generate a contract name by replacing the token symbol
 *
 * @param originalName Original contract name from the registry
 * @param tokenSymbol Token symbol to use in the name
 * @param replaceText Text to replace in the original name (default: "aibtc")
 * @returns String with replaceText replaced by the lowercase token symbol
 */
export function getContractName(
  originalName: string,
  tokenSymbol: string,
  replaceText = "aibtc"
): string {
  return originalName.replace(replaceText, tokenSymbol.toLowerCase());
}

/**
 * Filter contracts by category
 *
 * @param category Contract category to filter by
 * @returns ContractRegistryEntry[] filtered list of contracts
 */
export function getContractsByCategory<C extends ContractCategory>(
  category: C
): ContractRegistryEntry[] {
  return CONTRACT_REGISTRY.filter((contract) => contract.type === category);
}

/**
 * Filter contracts by subcategory
 *
 * @param category Contract category
 * @param subcategory Contract subcategory
 * @returns ContractRegistryEntry[] filtered list of contracts
 */
export function getContractsBySubcategory<C extends ContractCategory>(
  category: C,
  subcategory: ContractSubCategory<C>
): ContractRegistryEntry[] {
  return CONTRACT_REGISTRY.filter(
    (contract) => contract.type === category && contract.subtype === subcategory
  );
}
