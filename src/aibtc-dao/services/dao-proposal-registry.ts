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
  // Bank Account Proposals
  {
    name: "aibtc-bank-account-deposit-stx",
    friendlyName: "Bank Account: Deposit STX",
    templatePath: "proposals/aibtc-bank-account-deposit-stx.clar",
  },
  {
    name: "aibtc-bank-account-initialize-new-account",
    friendlyName: "Bank Account: Initialize New Account",
    templatePath: "proposals/aibtc-bank-account-initialize-new-account.clar",
  },
  {
    name: "aibtc-bank-account-override-last-withdrawal-block",
    friendlyName: "Bank Account: Override Last Withdrawal Block",
    templatePath:
      "proposals/aibtc-bank-account-override-last-withdrawal-block.clar",
  },
  {
    name: "aibtc-bank-account-set-account-holder",
    friendlyName: "Bank Account: Set Account Holder",
    templatePath: "proposals/aibtc-bank-account-set-account-holder.clar",
  },
  {
    name: "aibtc-bank-account-set-withdrawal-amount",
    friendlyName: "Bank Account: Set Withdrawal Amount",
    templatePath: "proposals/aibtc-bank-account-set-withdrawal-amount.clar",
  },
  {
    name: "aibtc-bank-account-set-withdrawal-period",
    friendlyName: "Bank Account: Set Withdrawal Period",
    templatePath: "proposals/aibtc-bank-account-set-withdrawal-period.clar",
  },
  {
    name: "aibtc-bank-account-withdraw-stx",
    friendlyName: "Bank Account: Withdraw STX",
    templatePath: "proposals/aibtc-bank-account-withdraw-stx.clar",
  },

  // Base DAO Proposals
  {
    name: "aibtc-base-add-new-extension",
    friendlyName: "Base DAO: Add New Extension",
    templatePath: "proposals/aibtc-base-add-new-extension.clar",
  },
  /* REMOVING as these are just used for construction
  {
    name: "aibtc-base-bootstrap-initialization",
    friendlyName: "Base DAO: Bootstrap Initialization",
    templatePath: "proposals/aibtc-base-bootstrap-initialization.clar",
  },
  {
    name: "aibtc-base-bootstrap-initialization-v2",
    friendlyName: "Base DAO: Bootstrap Initialization v2",
    templatePath: "proposals/aibtc-base-bootstrap-initialization-v2.clar",
  },
  */
  {
    name: "aibtc-base-disable-extension",
    friendlyName: "Base DAO: Disable Extension",
    templatePath: "proposals/aibtc-base-disable-extension.clar",
  },
  {
    name: "aibtc-base-enable-extension",
    friendlyName: "Base DAO: Enable Extension",
    templatePath: "proposals/aibtc-base-enable-extension.clar",
  },
  {
    name: "aibtc-base-replace-extension",
    friendlyName: "Base DAO: Replace Extension",
    templatePath: "proposals/aibtc-base-replace-extension.clar",
  },
  {
    name: "aibtc-base-replace-extension-proposal-voting",
    friendlyName: "Base DAO: Replace Extension Proposal Voting",
    templatePath: "proposals/aibtc-base-replace-extension-proposal-voting.clar",
  },

  // DAO Charter Proposals
  {
    name: "aibtc-dao-charter-set-dao-charter",
    friendlyName: "DAO Charter: Set DAO Charter",
    templatePath: "proposals/aibtc-dao-charter-set-dao-charter.clar",
  },

  // Messaging Proposals
  {
    name: "aibtc-onchain-messaging-send",
    friendlyName: "Onchain Messaging: Send Message",
    templatePath: "proposals/aibtc-onchain-messaging-send.clar",
  },

  // Payments & Invoices Proposals
  {
    name: "aibtc-payments-invoices-add-resource",
    friendlyName: "Payments & Invoices: Add Resource",
    templatePath: "proposals/aibtc-payments-invoices-add-resource.clar",
  },
  {
    name: "aibtc-payments-invoices-pay-invoice-by-resource-name",
    friendlyName: "Payments & Invoices: Pay Invoice By Resource Name",
    templatePath:
      "proposals/aibtc-payments-invoices-pay-invoice-by-resource-name.clar",
  },
  {
    name: "aibtc-payments-invoices-pay-invoice",
    friendlyName: "Payments & Invoices: Pay Invoice",
    templatePath: "proposals/aibtc-payments-invoices-pay-invoice.clar",
  },
  {
    name: "aibtc-payments-invoices-set-payment-address",
    friendlyName: "Payments & Invoices: Set Payment Address",
    templatePath: "proposals/aibtc-payments-invoices-set-payment-address.clar",
  },
  {
    name: "aibtc-payments-invoices-toggle-resource-by-name",
    friendlyName: "Payments & Invoices: Toggle Resource By Name",
    templatePath:
      "proposals/aibtc-payments-invoices-toggle-resource-by-name.clar",
  },
  {
    name: "aibtc-payments-invoices-toggle-resource",
    friendlyName: "Payments & Invoices: Toggle Resource",
    templatePath: "proposals/aibtc-payments-invoices-toggle-resource.clar",
  },

  // Token Owner Proposals
  {
    name: "aibtc-token-owner-set-token-uri",
    friendlyName: "Token Owner: Set Token URI",
    templatePath: "proposals/aibtc-token-owner-set-token-uri.clar",
  },
  {
    name: "aibtc-token-owner-transfer-ownership",
    friendlyName: "Token Owner: Transfer Ownership",
    templatePath: "proposals/aibtc-token-owner-transfer-ownership.clar",
  },

  // Treasury Proposals
  {
    name: "aibtc-treasury-allow-asset",
    friendlyName: "Treasury: Allow Asset",
    templatePath: "proposals/aibtc-treasury-allow-asset.clar",
  },
  {
    name: "aibtc-treasury-delegate-stx",
    friendlyName: "Treasury: Delegate STX",
    templatePath: "proposals/aibtc-treasury-delegate-stx.clar",
  },
  {
    name: "aibtc-treasury-deposit-ft",
    friendlyName: "Treasury: Deposit FT",
    templatePath: "proposals/aibtc-treasury-deposit-ft.clar",
  },
  {
    name: "aibtc-treasury-deposit-nft",
    friendlyName: "Treasury: Deposit NFT",
    templatePath: "proposals/aibtc-treasury-deposit-nft.clar",
  },
  {
    name: "aibtc-treasury-deposit-stx",
    friendlyName: "Treasury: Deposit STX",
    templatePath: "proposals/aibtc-treasury-deposit-stx.clar",
  },
  {
    name: "aibtc-treasury-disable-asset",
    friendlyName: "Treasury: Disable Asset",
    templatePath: "proposals/aibtc-treasury-disable-asset.clar",
  },
  {
    name: "aibtc-treasury-revoke-delegation",
    friendlyName: "Treasury: Revoke Delegation",
    templatePath: "proposals/aibtc-treasury-revoke-delegation.clar",
  },
  {
    name: "aibtc-treasury-withdraw-ft",
    friendlyName: "Treasury: Withdraw FT",
    templatePath: "proposals/aibtc-treasury-withdraw-ft.clar",
  },
  {
    name: "aibtc-treasury-withdraw-nft",
    friendlyName: "Treasury: Withdraw NFT",
    templatePath: "proposals/aibtc-treasury-withdraw-nft.clar",
  },
  {
    name: "aibtc-treasury-withdraw-stx",
    friendlyName: "Treasury: Withdraw STX",
    templatePath: "proposals/aibtc-treasury-withdraw-stx.clar",
  },
];
