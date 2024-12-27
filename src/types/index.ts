import { TRAITS, ADDRESSES } from "../constants";

// matches string definitions in Stacks.js
export type NetworkType = "mainnet" | "testnet" | "devnet" | "mocknet";

export type NetworkTraits = {
  SIP10: string;
  SIP09: string;
  DAO_BASE: string;
  DAO_PROPOSAL: string;
  DAO_EXTENSION: string;
  DAO_DIRECT_EXECUTE: string;
  DAO_TREASURY: string;
  DAO_PAYMENTS: string;
  DAO_MESSAGING: string;
  DAO_BANK_ACCOUNT: string;
  DAO_RESOURCES: string;
  DAO_INVOICES: string;
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

export type TraitType = keyof typeof TRAITS.testnet;
export type AddressType = keyof typeof ADDRESSES.testnet;

export enum ContractType {
  TOKEN = 'token',
  POOL = 'pool',
  DEX = 'dex',
  DAO_BASE = 'aibtcdev-base-dao',
  DAO_ACTIONS = 'aibtc-ext001-actions',
  DAO_BANK_ACCOUNT = 'aibtc-ext002-bank-account',
  DAO_DIRECT_EXECUTE = 'aibtc-ext003-direct-execute',
  DAO_MESSAGING = 'aibtc-ext004-messaging',
  DAO_PAYMENTS = 'aibtc-ext005-payments',
  DAO_TREASURY = 'aibtc-ext006-treasury',
  DAO_PROPOSAL_BOOTSTRAP = 'aibtc-prop001-bootstrap',
}

export type ContractNames = {
  [key in ContractType]: string;
};