import { TRAITS, ADDRESSES } from "../constants";

// matches string definitions in Stacks.js
export type NetworkType = "mainnet" | "testnet" | "devnet" | "mocknet";

export type TraitDefinition = {
  contractAddress: string;
  contractName: string;
  traitName: string;
};

export type NetworkTraits = {
  SIP010_FT: TraitDefinition;
  PROPOSAL: TraitDefinition;
  EXTENSION: TraitDefinition;
  NFT: TraitDefinition;
  FT_PLUS: TraitDefinition;
  SHARE_FEE_TO: TraitDefinition;
  BITFLOW_POOL: TraitDefinition;
  BITFLOW_SIP10: TraitDefinition;
};

export type NetworkTraitsMap = {
  [key in NetworkType]: NetworkTraits;
};

export type NetworkAddresses = {
  BURN_ADDRESS: string;
  SWAP_FEE_ADDRESS: string;
  COMPLETE_FEE_ADDRESS: string;
  BITFLOW_CORE_ADDRESS: string;
};

export type NetworkAddressMap = {
  [key in NetworkType]: NetworkAddresses;
};

export type TraitType = keyof typeof TRAITS.testnet;
export type AddressType = keyof typeof ADDRESSES.testnet;

export enum ContractType {
  TOKEN = 'token',
  POOL = 'pool',
  DEX = 'dex'
}

export type ContractNames = {
  [key in ContractType]: string;
};