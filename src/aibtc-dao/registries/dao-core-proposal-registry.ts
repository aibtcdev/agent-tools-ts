import { ClarityVersion } from "@stacks/transactions";
import {
  ContractCategory,
  ContractSubCategory,
  KnownAddresses,
  KnownTraits,
} from "../types/dao-types";
import { COREPROPOSALS_ACTION_PROPOSALS } from "./core-proposals/action-proposals";
import { COREPROPOSALS_BASE_DAO } from "./core-proposals/base-dao";
import { COREPROPOSALS_CORE_PROPOSALS } from "./core-proposals/core-proposals";
import { COREPROPOSALS_DAO_CHARTER } from "./core-proposals/dao-charter";
import { COREPROPOSALS_ONCHAIN_MESSAGING } from "./core-proposals/onchain-messaging";
import { COREPROPOSALS_PAYMENT_PROCESSOR } from "./core-proposals/payment-processor";
import { COREPROPOSALS_TIMED_VAULT } from "./core-proposals/timed-vault";
import { COREPROPOSALS_TOKEN_OWNER } from "./core-proposals/token-owner";
import { COREPROPOSALS_TREASURY } from "./core-proposals/treasury";

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
  ...COREPROPOSALS_ACTION_PROPOSALS,
  ...COREPROPOSALS_BASE_DAO,
  ...COREPROPOSALS_CORE_PROPOSALS,
  ...COREPROPOSALS_DAO_CHARTER,
  ...COREPROPOSALS_ONCHAIN_MESSAGING,
  ...COREPROPOSALS_PAYMENT_PROCESSOR,
  ...COREPROPOSALS_TIMED_VAULT,
  ...COREPROPOSALS_TOKEN_OWNER,
  ...COREPROPOSALS_TREASURY,
  // bootstrap left out, covered in dao-generator.ts
] as const;
