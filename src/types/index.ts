import { TRAITS } from "../constants";

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
};

export type NetworkTraitsMap = {
  [key in NetworkType]: NetworkTraits;
};

export type TraitType = keyof typeof TRAITS.testnet;
