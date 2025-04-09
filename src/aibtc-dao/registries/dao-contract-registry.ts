import { ClarityVersion } from "@stacks/transactions";
import {
  ContractCategory,
  ContractSubCategory,
  KnownAddresses,
  KnownTraits,
} from "../types/dao-types";
import { TOKEN_CONTRACTS } from "./dao-contract-registry/token";
import { EXTENSION_CONTRACTS } from "./dao-contract-registry/extensions";
import { ACTION_CONTRACTS } from "./dao-contract-registry/actions";
import { DEPLOYMENT_ORDER, visualizeDeploymentOrder, validateDeploymentOrder } from "./deployment-order";

// base contract info that persists through all stages
type BaseContractInfo = {
  [C in ContractCategory]: {
    name: string;
    type: C;
    subtype: ContractSubCategory<C>;
    deploymentOrder: number; // lower numbers deploy first
    clarityVersion?: ClarityVersion; // optional for deployment
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

type RuntimeValues = {
  key: string;
};

// template requirements - only needed for generation
type TemplateRequirements = {
  templatePath: string;
  requiredAddresses?: BaseAddresses[];
  requiredTraits?: BaseTraits[];
  requiredContractAddresses?: ContractAddresses[];
  requiredRuntimeValues?: RuntimeValues[];
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

// Base DAO contracts
const BASE_CONTRACTS: BaseContractRegistryEntry[] = [
  {
    name: "aibtc-base-dao",
    type: "BASE",
    subtype: "DAO",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-base-dao"],
    clarityVersion: 3,
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

// Proposal contracts
const BOOTSTRAP_PROPOSAL: BaseContractRegistryEntry[] = [
  {
    name: "aibtc-base-bootstrap-initialization-v2",
    type: "PROPOSALS",
    subtype: "BOOTSTRAP_INIT",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-base-bootstrap-initialization-v2"],
    templatePath: `proposals/aibtc-base-bootstrap-initialization-v2.clar`,
    requiredTraits: [
      {
        ref: "DAO_PROPOSAL",
        key: "proposal_trait",
      },
    ],
    requiredAddresses: [
      {
        ref: "SBTC",
        key: "sbtc_contract",
      },
    ],
    requiredContractAddresses: [
      // base dao
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      // token
      {
        key: "token_contract",
        category: "TOKEN",
        subcategory: "DAO",
      },
      // extensions
      {
        key: "action_proposals_contract",
        category: "EXTENSIONS",
        subcategory: "ACTION_PROPOSALS",
      },
      {
        key: "core_proposals_contract",
        category: "EXTENSIONS",
        subcategory: "CORE_PROPOSALS",
      },
      {
        key: "dao_charter_contract",
        category: "EXTENSIONS",
        subcategory: "CHARTER",
      },
      {
        key: "messaging_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "payments_dao_contract",
        category: "EXTENSIONS",
        subcategory: "PAYMENTS_DAO",
      },
      {
        key: "payments_sbtc_contract",
        category: "EXTENSIONS",
        subcategory: "PAYMENTS_SBTC",
      },
      {
        key: "payments_stx_contract",
        category: "EXTENSIONS",
        subcategory: "PAYMENTS_STX",
      },
      {
        key: "timed_vault_dao_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_DAO",
      },
      {
        key: "timed_vault_sbtc_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_SBTC",
      },
      {
        key: "timed_vault_stx_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_STX",
      },
      {
        key: "token_owner_contract",
        category: "EXTENSIONS",
        subcategory: "TOKEN_OWNER",
      },
      {
        key: "treasury_contract",
        category: "EXTENSIONS",
        subcategory: "TREASURY",
      },
      // action extensions
      {
        key: "action_configure_timed_vault_dao_contract",
        category: "ACTIONS",
        subcategory: "CONFIGURE_TIMED_VAULT_DAO",
      },
      {
        key: "action_configure_timed_vault_sbtc_contract",
        category: "ACTIONS",
        subcategory: "CONFIGURE_TIMED_VAULT_SBTC",
      },
      {
        key: "action_configure_timed_vault_stx_contract",
        category: "ACTIONS",
        subcategory: "CONFIGURE_TIMED_VAULT_STX",
      },
      {
        key: "action_pmt_dao_add_resource_contract",
        category: "ACTIONS",
        subcategory: "PMT_DAO_ADD_RESOURCE",
      },
      {
        key: "action_pmt_dao_toggle_resource_contract",
        category: "ACTIONS",
        subcategory: "PMT_DAO_TOGGLE_RESOURCE",
      },
      {
        key: "action_pmt_sbtc_add_resource_contract",
        category: "ACTIONS",
        subcategory: "PMT_SBTC_ADD_RESOURCE",
      },
      {
        key: "action_pmt_sbtc_toggle_resource_contract",
        category: "ACTIONS",
        subcategory: "PMT_SBTC_TOGGLE_RESOURCE",
      },
      {
        key: "action_pmt_stx_add_resource_contract",
        category: "ACTIONS",
        subcategory: "PMT_STX_ADD_RESOURCE",
      },
      {
        key: "action_pmt_stx_toggle_resource_contract",
        category: "ACTIONS",
        subcategory: "PMT_STX_TOGGLE_RESOURCE",
      },
      {
        key: "action_send_message_contract",
        category: "ACTIONS",
        subcategory: "MESSAGING_SEND_MESSAGE",
      },
      {
        key: "action_treasury_allow_asset_contract",
        category: "ACTIONS",
        subcategory: "TREASURY_ALLOW_ASSET",
      },
    ],
    requiredRuntimeValues: [
      { key: "dao_manifest" },
      { key: "dao_manifest_inscription_id" },
    ],
  },
];

/**
 * Central registry for each contract in the DAO.
 * Clone this object to generate and deploy contracts.
 */
export const CONTRACT_REGISTRY: BaseContractRegistryEntry[] = [
  ...BASE_CONTRACTS,
  ...BOOTSTRAP_PROPOSAL,
  ...TOKEN_CONTRACTS,
  ...EXTENSION_CONTRACTS,
  ...ACTION_CONTRACTS,
] as const;

/**
 * Visualize the deployment order of all contracts in the registry
 */
export function visualizeContractDeploymentOrder() {
  visualizeDeploymentOrder(CONTRACT_REGISTRY);
}

/**
 * Validate that the deployment order respects all dependencies
 * @returns Array of error messages, empty if no issues found
 */
export function validateContractDeploymentOrder() {
  return validateDeploymentOrder(CONTRACT_REGISTRY);
}
