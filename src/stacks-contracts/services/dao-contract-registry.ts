import {
  ContractCategory,
  ContractSubCategory,
  KnownAddresses,
  KnownTraits,
} from "../types/dao-types-v2";

// base contract info that persists through all stages
type BaseContractInfo = {
  [C in ContractCategory]: {
    name: string;
    type: C;
    subtype: ContractSubCategory<C>;
    deploymentOrder: number; // Lower numbers deploy first
  };
}[ContractCategory];

// create mapping of known addresses
type BaseAddresses = {
  ref: keyof KnownAddresses; // key in ADDRESSES
  key: string; // key in template
};

// create mapping of known traits
type BaseTraits = {
  ref: keyof KnownTraits; // key in TRAITS
  key: string; // key in template
};

// create mapping for generated contract addresses
// the ref will be added at runtime as generated contract name
// the key is the string in the template
type ContractAddresses = {
  key: string;
  category: ContractCategory;
  subcategory: ContractSubCategory<ContractCategory>;
};

// template requirements - only needed for generation
type TemplateRequirements = {
  templatePath: string;
  requiredAddresses?: BaseAddresses[];
  requiredTraits?: BaseTraits[];
  requiredContractAddresses?: ContractAddresses[];
};

// full registry entry combines base info and template requirements
export type BaseContractRegistryEntry = BaseContractInfo & TemplateRequirements;

// generated contract drops template requirements, adds source and hash
export type GeneratedContractRegistryEntry = BaseContractInfo & {
  source: string;
  hash?: string;
};

// deployment result includes transaction and deployment status
export type DeployedContractRegistryEntry = GeneratedContractRegistryEntry & {
  sender: string; // address from config that deployed
  success: boolean; // deployment success status
  txId?: string; // transaction ID if successful
  address: string; // contract address after deployment
};

/**
 * Central registry for each contract in the DAO.
 * Clone this object to generate and deploy contracts.
 */
export const CONTRACT_REGISTRY: BaseContractRegistryEntry[] = [
  // token contracts
  {
    name: "aibtc-faktory",
    type: "TOKEN",
    subtype: "DAO",
    deploymentOrder: 1,
    templatePath: `extensions/aibtc-token.clar`,
    requiredTraits: [
      {
        ref: "STANDARD_SIP010",
        key: "sip10_trait",
      },
    ],
    requiredAddresses: [
      {
        ref: "BITFLOW_FEE",
        key: "stxcity_token_deployment_fee_address",
      },
    ],
  },
  {
    name: "aibtc-faktory-dex",
    type: "TOKEN",
    subtype: "DEX",
    deploymentOrder: 2,
    templatePath: `extensions/aibtc-token-dex.clar`,
    requiredTraits: [
      {
        ref: "STANDARD_SIP010",
        key: "sip10_trait",
      },
    ],
    requiredAddresses: [
      {
        ref: "BITFLOW_CORE",
        key: "bitflow_core_contract",
      },
      {
        ref: "BITFLOW_STX_TOKEN",
        key: "bitflow_stx_token_address",
      },
      {
        ref: "BITFLOW_FEE",
        key: "bitflow_fee_address",
      },
      {
        ref: "BURN",
        key: "burn",
      },
      {
        ref: "DEPLOYER",
        key: "pool_contract",
      },
      {
        ref: "BITFLOW_FEE",
        key: "stxcity_swap_fee",
      },
      {
        ref: "BITFLOW_FEE",
        key: "stxcity_complete_fee",
      },
      {
        ref: "DEPLOYER",
        key: "token_contract",
      },
      {
        ref: "BITFLOW_FEE",
        key: "stxcity_dex_deployment_fee_address",
      },
    ],
  },
  {
    name: "xyk-pool-stx-aibtc-v-1-1",
    type: "TOKEN",
    subtype: "POOL",
    deploymentOrder: 3,
    templatePath: `extensions/aibtc-bitflow-pool.clar`,
    requiredTraits: [
      {
        ref: "BITFLOW_POOL",
        key: "bitflow_pool_trait",
      },
      {
        ref: "STANDARD_SIP010",
        key: "sip10_trait",
      },
      {
        ref: "DAO_TOKEN_POOL",
        key: "dao_bitflow_pool_trait",
      },
    ],
    requiredAddresses: [
      {
        ref: "BITFLOW_CORE",
        key: "bitflow_xyk_core_address",
      },
    ],
  },
  // base dao
  {
    name: "aibtc-base-dao",
    type: "BASE",
    subtype: "DAO",
    deploymentOrder: 4,
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
    deploymentOrder: 5,
    templatePath: `extensions/aibtc-action-proposals-v2.clar`,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "token_contract",
        category: "TOKEN",
        subcategory: "DAO",
      },
      {
        key: "token_dex_contract",
        category: "TOKEN",
        subcategory: "DEX",
      },
      {
        key: "token_pool_contract",
        category: "TOKEN",
        subcategory: "POOL",
      },
      {
        key: "treasury_contract",
        category: "EXTENSIONS",
        subcategory: "TREASURY",
      },
    ],
  },
  {
    name: "aibtc-bank-account",
    type: "EXTENSIONS",
    subtype: "BANK_ACCOUNT",
    deploymentOrder: 6,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-core-proposals-v2",
    type: "EXTENSIONS",
    subtype: "CORE_PROPOSALS",
    deploymentOrder: 7,
    templatePath: `extensions/aibtc-core-proposals-v2.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_CORE_PROPOSALS",
        key: "core_proposal_trait",
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "token_contract",
        category: "TOKEN",
        subcategory: "DAO",
      },
      {
        key: "token_dex_contract",
        category: "TOKEN",
        subcategory: "DEX",
      },
      {
        key: "token_pool_contract",
        category: "TOKEN",
        subcategory: "POOL",
      },
      {
        key: "treasury_contract",
        category: "EXTENSIONS",
        subcategory: "TREASURY",
      },
    ],
  },
  {
    name: "aibtc-dao-charter",
    type: "EXTENSIONS",
    subtype: "CHARTER",
    deploymentOrder: 8,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-onchain-messaging",
    type: "EXTENSIONS",
    subtype: "MESSAGING",
    deploymentOrder: 9,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-payments-invoices",
    type: "EXTENSIONS",
    subtype: "PAYMENTS",
    deploymentOrder: 10,
    templatePath: `extensions/aibtc-payments-invoices.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_INVOICES",
        key: "invoices_trait",
      },
      {
        ref: "DAO_RESOURCES",
        key: "resources_trait",
      },
    ],
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-token-owner",
    type: "EXTENSIONS",
    subtype: "TOKEN_OWNER",
    deploymentOrder: 11,
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
    requiredAddresses: [
      {
        ref: "DEPLOYER",
        key: "token_contract",
      },
    ],
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-treasury",
    type: "EXTENSIONS",
    subtype: "TREASURY",
    deploymentOrder: 12,
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
        key: "sip09_trait",
      },
    ],
    requiredAddresses: [
      {
        ref: "POX",
        key: "pox_contract",
      },
    ],
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
    ],
  },
  // dao action extensions
  {
    name: "aibtc-action-add-resource",
    type: "ACTIONS",
    subtype: "PAYMENTS_INVOICES_ADD_RESOURCE",
    deploymentOrder: 13,
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
    name: "aibtc-action-allow-asset",
    type: "ACTIONS",
    subtype: "TREASURY_ALLOW_ASSET",
    deploymentOrder: 14,
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
    requiredAddresses: [
      {
        ref: "DEPLOYER",
        key: "treasury_contract",
      },
    ],
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-action-send-message",
    type: "ACTIONS",
    subtype: "MESSAGING_SEND_MESSAGE",
    deploymentOrder: 15,
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
    requiredAddresses: [
      {
        ref: "DEPLOYER",
        key: "messaging_contract",
      },
    ],
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-action-set-account-holder",
    type: "ACTIONS",
    subtype: "BANK_ACCOUNT_SET_ACCOUNT_HOLDER",
    deploymentOrder: 16,
    templatePath: `extensions/actions/aibtc-action-set-account-holder.clar`,
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
    requiredAddresses: [
      {
        ref: "DEPLOYER",
        key: "bank_account_contract",
      },
    ],
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-action-set-withdrawal-amount",
    type: "ACTIONS",
    subtype: "BANK_ACCOUNT_SET_WITHDRAWAL_AMOUNT",
    deploymentOrder: 17,
    templatePath: `extensions/actions/aibtc-action-set-withdrawal-amount.clar`,
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
    requiredAddresses: [
      {
        ref: "DEPLOYER",
        key: "bank_account_contract",
      },
    ],
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-action-set-withdrawal-period",
    type: "ACTIONS",
    subtype: "BANK_ACCOUNT_SET_WITHDRAWAL_PERIOD",
    deploymentOrder: 18,
    templatePath: `extensions/actions/aibtc-action-set-withdrawal-period.clar`,
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
    requiredAddresses: [
      {
        ref: "DEPLOYER",
        key: "bank_account_contract",
      },
    ],
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-action-toggle-resource",
    type: "ACTIONS",
    subtype: "PAYMENTS_INVOICES_TOGGLE_RESOURCE",
    deploymentOrder: 19,
    templatePath: `extensions/actions/aibtc-action-toggle-resource.clar`,
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
    requiredAddresses: [
      {
        ref: "DEPLOYER",
        key: "payments_contract",
      },
    ],
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
    ],
  },
  // proposals
  {
    name: "aibtc-base-bootstrap-initialization-v2",
    type: "PROPOSALS",
    subtype: "BOOTSTRAP_INIT",
    deploymentOrder: 20,
    templatePath: `proposals/aibtc-base-bootstrap-initialization-v2.clar`,
    requiredTraits: [
      {
        ref: "DAO_PROPOSAL",
        key: "proposal_trait",
      },
    ],
    requiredAddresses: [
      {
        ref: "DEPLOYER",
        key: "dao_contract",
      },
      {
        ref: "DEPLOYER",
        key: "messaging_contract",
      },
      {
        ref: "DEPLOYER",
        key: "treasury_contract",
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
 * @returns BaseContractRegistryEntry[] filtered list of contracts
 */
export function getContractsByCategory<C extends ContractCategory>(
  category: C
): BaseContractRegistryEntry[] {
  return CONTRACT_REGISTRY.filter((contract) => contract.type === category);
}

/**
 * Filter contracts by subcategory
 *
 * @param category Contract category
 * @param subcategory Contract subcategory
 * @returns BaseContractRegistryEntry[] filtered list of contracts
 */
export function getContractsBySubcategory<C extends ContractCategory>(
  category: C,
  subcategory: ContractSubCategory<C>
): BaseContractRegistryEntry[] {
  return CONTRACT_REGISTRY.filter(
    (contract) => contract.type === category && contract.subtype === subcategory
  );
}
