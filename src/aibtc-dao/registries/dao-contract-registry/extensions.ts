import { BaseContractRegistryEntry } from "../dao-contract-registry";
import { DEPLOYMENT_ORDER } from "../deployment-order";

// Extension contracts
export const EXTENSION_CONTRACTS: BaseContractRegistryEntry[] = [
  {
    name: "aibtc-action-proposals-v2",
    type: "EXTENSIONS",
    subtype: "ACTION_PROPOSALS",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-action-proposals-v2"],
    clarityVersion: 3,
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
        key: "token_pre_dex_contract",
        category: "TOKEN",
        subcategory: "PRELAUNCH",
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
    name: "aibtc-core-proposals-v2",
    type: "EXTENSIONS",
    subtype: "CORE_PROPOSALS",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-core-proposals-v2"],
    clarityVersion: 3,
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
        key: "token_pre_dex_contract",
        category: "TOKEN",
        subcategory: "PRELAUNCH",
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
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-dao-charter"],
    clarityVersion: 3,
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
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-onchain-messaging"],
    clarityVersion: 3,
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
    name: "aibtc-payment-processor-dao",
    type: "EXTENSIONS",
    subtype: "PAYMENTS_DAO",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-payment-processor-dao"],
    templatePath: `extensions/aibtc-payment-processor-dao.clar`,
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
      {
        key: "treasury_contract",
        category: "EXTENSIONS",
        subcategory: "TREASURY",
      },
      {
        key: "token_contract",
        category: "TOKEN",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-payment-processor-sbtc",
    type: "EXTENSIONS",
    subtype: "PAYMENTS_SBTC",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-payment-processor-sbtc"],
    templatePath: `extensions/aibtc-payment-processor-sbtc.clar`,
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
      {
        key: "treasury_contract",
        category: "EXTENSIONS",
        subcategory: "TREASURY",
      },
    ],
  },
  {
    name: "aibtc-payment-processor-stx",
    type: "EXTENSIONS",
    subtype: "PAYMENTS_STX",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-payment-processor-stx"],
    templatePath: `extensions/aibtc-payment-processor-stx.clar`,
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
      {
        key: "treasury_contract",
        category: "EXTENSIONS",
        subcategory: "TREASURY",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-dao",
    type: "EXTENSIONS",
    subtype: "TIMED_VAULT_DAO",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-timed-vault-dao"],
    templatePath: `extensions/aibtc-timed-vault-dao.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_TIMED_VAULT",
        key: "timed_vault_trait",
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
    ],
  },
  {
    name: "aibtc-timed-vault-sbtc",
    type: "EXTENSIONS",
    subtype: "TIMED_VAULT_SBTC",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-timed-vault-sbtc"],
    templatePath: `extensions/aibtc-timed-vault-sbtc.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_TIMED_VAULT",
        key: "timed_vault_trait",
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
    name: "aibtc-timed-vault-stx",
    type: "EXTENSIONS",
    subtype: "TIMED_VAULT_STX",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-timed-vault-stx"],
    templatePath: `extensions/aibtc-timed-vault-stx.clar`,
    requiredTraits: [
      {
        ref: "DAO_EXTENSION",
        key: "extension_trait",
      },
      {
        ref: "DAO_TIMED_VAULT",
        key: "timed_vault_trait",
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
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-token-owner"],
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
    ],
  },
  {
    name: "aibtc-treasury",
    type: "EXTENSIONS",
    subtype: "TREASURY",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-treasury"],
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
];
