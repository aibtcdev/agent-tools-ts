import { BaseContractRegistryEntry } from "../dao-contract-registry";
import { DEPLOYMENT_ORDER } from "./deployment-order";

// Action contracts
export const ACTION_CONTRACTS: BaseContractRegistryEntry[] = [
  {
    name: "aibtc-action-configure-timed-vault-dao",
    type: "ACTIONS",
    subtype: "CONFIGURE_TIMED_VAULT_DAO",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-action-configure-timed-vault-dao"],
    templatePath: `extensions/actions/aibtc-action-configure-timed-vault-dao.clar`,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "messaging_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_dao",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_DAO",
      },
      {
        key: "dao_token_name",
        category: "TOKEN",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-action-configure-timed-vault-sbtc",
    type: "ACTIONS",
    subtype: "CONFIGURE_TIMED_VAULT_SBTC",
    deploymentOrder:
      DEPLOYMENT_ORDER["aibtc-action-configure-timed-vault-sbtc"],
    templatePath: `extensions/actions/aibtc-action-configure-timed-vault-sbtc.clar`,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "messaging_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_sbtc",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_SBTC",
      },
    ],
  },
  {
    name: "aibtc-action-configure-timed-vault-stx",
    type: "ACTIONS",
    subtype: "CONFIGURE_TIMED_VAULT_STX",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-action-configure-timed-vault-stx"],
    templatePath: `extensions/actions/aibtc-action-configure-timed-vault-stx.clar`,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "messaging_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_stx",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_STX",
      },
    ],
  },
  {
    name: "aibtc-action-pmt-dao-add-resource",
    type: "ACTIONS",
    subtype: "PMT_DAO_ADD_RESOURCE",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-action-pmt-dao-add-resource"],
    templatePath: `extensions/actions/aibtc-action-pmt-dao-add-resource.clar`,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "messaging_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "payments_contract",
        category: "EXTENSIONS",
        subcategory: "PAYMENTS_DAO",
      },
    ],
  },
  {
    name: "aibtc-action-pmt-dao-toggle-resource",
    type: "ACTIONS",
    subtype: "PMT_DAO_TOGGLE_RESOURCE",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-action-pmt-dao-toggle-resource"],
    templatePath: `extensions/actions/aibtc-action-pmt-dao-toggle-resource.clar`,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "messaging_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "payments_contract",
        category: "EXTENSIONS",
        subcategory: "PAYMENTS_DAO",
      },
    ],
  },
  {
    name: "aibtc-action-pmt-sbtc-add-resource",
    type: "ACTIONS",
    subtype: "PMT_SBTC_ADD_RESOURCE",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-action-pmt-sbtc-add-resource"],
    templatePath: `extensions/actions/aibtc-action-pmt-sbtc-add-resource.clar`,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "messaging_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "payments_contract",
        category: "EXTENSIONS",
        subcategory: "PAYMENTS_SBTC",
      },
    ],
  },
  {
    name: "aibtc-action-pmt-sbtc-toggle-resource",
    type: "ACTIONS",
    subtype: "PMT_SBTC_TOGGLE_RESOURCE",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-action-pmt-sbtc-toggle-resource"],
    templatePath: `extensions/actions/aibtc-action-pmt-sbtc-toggle-resource.clar`,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "messaging_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "payments_contract",
        category: "EXTENSIONS",
        subcategory: "PAYMENTS_SBTC",
      },
    ],
  },
  {
    name: "aibtc-action-pmt-stx-add-resource",
    type: "ACTIONS",
    subtype: "PMT_STX_ADD_RESOURCE",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-action-pmt-stx-add-resource"],
    templatePath: `extensions/actions/aibtc-action-pmt-stx-add-resource.clar`,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "messaging_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "payments_contract",
        category: "EXTENSIONS",
        subcategory: "PAYMENTS_STX",
      },
    ],
  },
  {
    name: "aibtc-action-pmt-stx-toggle-resource",
    type: "ACTIONS",
    subtype: "PMT_STX_TOGGLE_RESOURCE",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-action-pmt-stx-toggle-resource"],
    templatePath: `extensions/actions/aibtc-action-pmt-stx-toggle-resource.clar`,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "messaging_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "payments_contract",
        category: "EXTENSIONS",
        subcategory: "PAYMENTS_STX",
      },
    ],
  },
  {
    name: "aibtc-action-send-message",
    type: "ACTIONS",
    subtype: "MESSAGING_SEND_MESSAGE",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-action-send-message"],
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "messaging_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
    ],
  },
  {
    name: "aibtc-action-treasury-allow-asset",
    type: "ACTIONS",
    subtype: "TREASURY_ALLOW_ASSET",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-action-treasury-allow-asset"],
    templatePath: `extensions/actions/aibtc-action-treasury-allow-asset.clar`,
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
    requiredContractAddresses: [
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "messaging_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "treasury_contract",
        category: "EXTENSIONS",
        subcategory: "TREASURY",
      },
    ],
  },
];
