import { ClarityVersion } from "@stacks/transactions";
import {
  ContractCategory,
  ContractSubCategory,
  KnownAddresses,
  KnownTraits,
} from "../types/dao-types";

// base contract info for a core proposal
type BaseContractInfo = {
  name: string;
  friendlyName: string;
  deploymentOrder?: number;
  clarityVersion?: ClarityVersion;
};

// base reference for known addresses
type BaseAddresses = {
  ref: keyof KnownAddresses; // key in ADDRESSES
  key: string; // key in template
};

// base reference for known traits
type BaseTraits = {
  ref: keyof KnownTraits; // key in TRAITS
  key: string; // key in template
};

// base reference for generated contract addresses
type BaseContractAddresses = {
  key: string; // key in template
  category: ContractCategory; // category in CONTRACT_REGISTRY
  subcategory: ContractSubCategory<ContractCategory>; // subcategory in CONTRACT_REGISTRY
};

// reference for runtime values matched as simple key/value pair
type ContractRuntimeValues = {
  key: string;
};

// template requirements - only needed for generation
type ContractTemplateInfo = {
  templatePath: string;
  requiredAddresses?: BaseAddresses[];
  requiredTraits?: BaseTraits[];
  requiredContractAddresses?: BaseContractAddresses[];
  requiredRuntimeValues?: ContractRuntimeValues[];
};

// full base registry entry for a core proposal
export type BaseCoreProposalRegistryEntry = BaseContractInfo &
  ContractTemplateInfo;

// generated contract fields
type GeneratedContractInfo = {
  source: string;
  hash?: string;
};

// generated registry entry for a core proposal
export type GeneratedCoreProposalRegistryEntry = BaseContractInfo &
  GeneratedContractInfo;

// deployed contract fields
type DeployedContractInfo = {
  contractAddress: string;
  sender: string;
  success: boolean;
  txId?: string;
};

// deployed registry entry for a core proposal
export type DeployedCoreProposalRegistryEntry =
  GeneratedCoreProposalRegistryEntry & DeployedContractInfo;

/**
 * Central registry for each core proposal in the DAO.
 * Core proposals can access any protected functions within the DAO.
 * Clone this object to generate and deploy core proposals.
 */
export const CORE_PROPOSAL_REGISTRY: BaseCoreProposalRegistryEntry[] = [
  // Action Proposals
  {
    name: "aibtc-action-proposals-set-proposal-bond",
    friendlyName: "Action Proposals: Set Proposal Bond",
    templatePath: "proposals/aibtc-action-proposals-set-proposal-bond.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_BOND_AMOUNT" }
    ],
  },

  // Base DAO Proposals
  {
    name: "aibtc-base-add-new-extension",
    friendlyName: "Base DAO: Add New Extension",
    templatePath: "proposals/aibtc-base-add-new-extension.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_EXTENSION_CONTRACT" },
      { key: "CFG_EXTENSION_ENABLED" }
    ],
  },
  {
    name: "aibtc-base-disable-extension",
    friendlyName: "Base DAO: Disable Extension",
    templatePath: "proposals/aibtc-base-disable-extension.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_EXTENSION_CONTRACT" }
    ],
  },
  {
    name: "aibtc-base-enable-extension",
    friendlyName: "Base DAO: Enable Extension",
    templatePath: "proposals/aibtc-base-enable-extension.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_EXTENSION_CONTRACT" }
    ],
  },
  {
    name: "aibtc-base-replace-extension",
    friendlyName: "Base DAO: Replace Extension",
    templatePath: "proposals/aibtc-base-replace-extension.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_OLD_EXTENSION_CONTRACT" },
      { key: "CFG_NEW_EXTENSION_CONTRACT" },
      { key: "CFG_EXTENSION_ENABLED" }
    ],
  },
  {
    name: "aibtc-base-replace-extension-proposal-voting",
    friendlyName: "Base DAO: Replace Extension Proposal Voting",
    templatePath: "proposals/aibtc-base-replace-extension-proposal-voting.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_OLD_EXTENSION_CONTRACT" },
      { key: "CFG_NEW_EXTENSION_CONTRACT" }
    ],
  },

  // Core Proposals
  {
    name: "aibtc-core-proposals-set-proposal-bond",
    friendlyName: "Core Proposals: Set Proposal Bond",
    templatePath: "proposals/aibtc-core-proposals-set-proposal-bond.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_BOND_AMOUNT" }
    ],
  },

  // DAO Charter Proposals
  {
    name: "aibtc-dao-charter-set-dao-charter",
    friendlyName: "DAO Charter: Set DAO Charter",
    templatePath: "proposals/aibtc-dao-charter-set-dao-charter.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_CHARTER_URL" }
    ],
  },

  // Messaging Proposals
  {
    name: "aibtc-onchain-messaging-send",
    friendlyName: "Onchain Messaging: Send Message",
    templatePath: "proposals/aibtc-onchain-messaging-send.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_OFFICIAL" }
    ],
  },

  // Payments & Invoices Proposals
  {
    name: "aibtc-payments-invoices-add-resource",
    friendlyName: "Payments & Invoices: Add Resource",
    templatePath: "proposals/aibtc-payments-invoices-add-resource.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_RESOURCE_NAME" },
      { key: "CFG_RESOURCE_DESCRIPTION" },
      { key: "CFG_RESOURCE_PRICE" },
      { key: "CFG_RESOURCE_URL" }
    ],
  },
  {
    name: "aibtc-payments-invoices-pay-invoice-by-resource-name",
    friendlyName: "Payments & Invoices: Pay Invoice By Resource Name",
    templatePath:
      "proposals/aibtc-payments-invoices-pay-invoice-by-resource-name.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_RESOURCE_NAME" },
      { key: "CFG_INVOICE_MEMO" },
      { key: "CFG_RECIPIENT" }
    ],
  },
  {
    name: "aibtc-payments-invoices-pay-invoice",
    friendlyName: "Payments & Invoices: Pay Invoice",
    templatePath: "proposals/aibtc-payments-invoices-pay-invoice.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_RESOURCE_ID" },
      { key: "CFG_INVOICE_MEMO" },
      { key: "CFG_RECIPIENT" }
    ],
  },
  {
    name: "aibtc-payments-invoices-set-payment-address",
    friendlyName: "Payments & Invoices: Set Payment Address",
    templatePath: "proposals/aibtc-payments-invoices-set-payment-address.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_PAYMENT_ADDRESS" }
    ],
  },
  {
    name: "aibtc-payments-invoices-toggle-resource-by-name",
    friendlyName: "Payments & Invoices: Toggle Resource By Name",
    templatePath:
      "proposals/aibtc-payments-invoices-toggle-resource-by-name.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_RESOURCE_NAME" }
    ],
  },
  {
    name: "aibtc-payments-invoices-toggle-resource",
    friendlyName: "Payments & Invoices: Toggle Resource",
    templatePath: "proposals/aibtc-payments-invoices-toggle-resource.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_RESOURCE_ID" }
    ],
  },

  // Timed Vault Proposals
  {
    name: "aibtc-timed-vault-initialize-new-account",
    friendlyName: "Timed Vault: Initialize New Account",
    templatePath: "proposals/aibtc-timed-vault-initialize-new-account.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_ACCOUNT_NAME" },
      { key: "CFG_ACCOUNT_HOLDER" },
      { key: "CFG_WITHDRAWAL_AMOUNT" },
      { key: "CFG_WITHDRAWAL_PERIOD" }
    ],
  },
  {
    name: "aibtc-timed-vault-override-last-withdrawal-block",
    friendlyName: "Timed Vault: Override Last Withdrawal Block",
    templatePath:
      "proposals/aibtc-timed-vault-override-last-withdrawal-block.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_ACCOUNT_NAME" },
      { key: "CFG_BLOCK_HEIGHT" }
    ],
  },
  {
    name: "aibtc-timed-vault-set-account-holder",
    friendlyName: "Timed Vault: Set Account Holder",
    templatePath: "proposals/aibtc-timed-vault-set-account-holder.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_ACCOUNT_NAME" },
      { key: "CFG_ACCOUNT_HOLDER" }
    ],
  },
  {
    name: "aibtc-timed-vault-set-withdrawal-amount",
    friendlyName: "Timed Vault: Set Withdrawal Amount",
    templatePath: "proposals/aibtc-timed-vault-set-withdrawal-amount.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_ACCOUNT_NAME" },
      { key: "CFG_WITHDRAWAL_AMOUNT" }
    ],
  },
  {
    name: "aibtc-timed-vault-set-withdrawal-period",
    friendlyName: "Timed Vault: Set Withdrawal Period",
    templatePath: "proposals/aibtc-timed-vault-set-withdrawal-period.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_ACCOUNT_NAME" },
      { key: "CFG_WITHDRAWAL_PERIOD" }
    ],
  },
  {
    name: "aibtc-timed-vault-withdraw-stx",
    friendlyName: "Timed Vault: Withdraw STX",
    templatePath: "proposals/aibtc-timed-vault-withdraw-stx.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_ACCOUNT_NAME" },
      { key: "CFG_RECIPIENT" }
    ],
  },

  // Token Owner Proposals
  {
    name: "aibtc-token-owner-set-token-uri",
    friendlyName: "Token Owner: Set Token URI",
    templatePath: "proposals/aibtc-token-owner-set-token-uri.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_TOKEN_URI" }
    ],
  },
  {
    name: "aibtc-token-owner-transfer-ownership",
    friendlyName: "Token Owner: Transfer Ownership",
    templatePath: "proposals/aibtc-token-owner-transfer-ownership.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_NEW_OWNER" }
    ],
  },

  // Treasury Proposals
  {
    name: "aibtc-treasury-allow-asset",
    friendlyName: "Treasury: Allow Asset",
    templatePath: "proposals/aibtc-treasury-allow-asset.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_ASSET_CONTRACT" }
    ],
  },
  {
    name: "aibtc-treasury-delegate-stx",
    friendlyName: "Treasury: Delegate STX",
    templatePath: "proposals/aibtc-treasury-delegate-stx.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_AMOUNT" },
      { key: "CFG_DELEGATE_TO" },
      { key: "CFG_UNTIL_BURN_HEIGHT" },
      { key: "CFG_POX_ADDRESS" }
    ],
  },
  {
    name: "aibtc-treasury-disable-asset",
    friendlyName: "Treasury: Disable Asset",
    templatePath: "proposals/aibtc-treasury-disable-asset.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_ASSET_CONTRACT" }
    ],
  },
  {
    name: "aibtc-treasury-revoke-delegation",
    friendlyName: "Treasury: Revoke Delegation",
    templatePath: "proposals/aibtc-treasury-revoke-delegation.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_AMOUNT" },
      { key: "CFG_DELEGATE_TO" }
    ],
  },
  {
    name: "aibtc-treasury-withdraw-ft",
    friendlyName: "Treasury: Withdraw FT",
    templatePath: "proposals/aibtc-treasury-withdraw-ft.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_TOKEN_CONTRACT" },
      { key: "CFG_AMOUNT" },
      { key: "CFG_RECIPIENT" }
    ],
  },
  {
    name: "aibtc-treasury-withdraw-nft",
    friendlyName: "Treasury: Withdraw NFT",
    templatePath: "proposals/aibtc-treasury-withdraw-nft.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_NFT_CONTRACT" },
      { key: "CFG_NFT_ID" },
      { key: "CFG_RECIPIENT" }
    ],
  },
  {
    name: "aibtc-treasury-withdraw-stx",
    friendlyName: "Treasury: Withdraw STX",
    templatePath: "proposals/aibtc-treasury-withdraw-stx.clar",
    requiredRuntimeValues: [
      { key: "CFG_MESSAGE" },
      { key: "CFG_AMOUNT" },
      { key: "CFG_RECIPIENT" }
    ],
  },
] as const;
