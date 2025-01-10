import { TRAITS, ADDRESSES } from "../constants";

// matches string definitions in Stacks.js
export type NetworkType = "mainnet" | "testnet" | "devnet" | "mocknet";

export type NetworkTraits = {
  SIP10: string;
  SIP09: string;
  DAO_BASE: string;
  DAO_PROPOSAL: string;
  DAO_EXTENSION: string;
  DAO_CORE_PROPOSALS: string;
  DAO_TREASURY: string;
  DAO_MESSAGING: string;
  DAO_BANK_ACCOUNT: string;
  DAO_RESOURCES: string;
  DAO_INVOICES: string;
  DAO_ACTION: string;
  BITFLOW_POOL: string;
};

export type NetworkTraitsMap = {
  [key in NetworkType]: NetworkTraits;
};

export type NetworkAddresses = {
  POX: string;
  BURN: string;
  STXCITY_SWAP_FEE: string;
  STXCITY_COMPLETE_FEE: string;
  STXCITY_TOKEN_DEPLOYMENT_FEE: string;
  STXCITY_DEX_DEPLOYMENT_FEE: string;
  BITFLOW_CORE: string;
  BITFLOW_STX_TOKEN: string;
  BITFLOW_FEE: string;
};

export type NetworkAddressMap = {
  [key in NetworkType]: NetworkAddresses;
};

export type NetworkTraitType = keyof typeof TRAITS.testnet;
export type NetworkAddressType = keyof typeof ADDRESSES.testnet;
