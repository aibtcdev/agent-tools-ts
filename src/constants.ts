import { NetworkTraitsMap } from "./types";

export const DEPLOYER = ""; // for testnet, need to redeploy
export const CONTRACT_NAME = "aibtcdev-aibtc"; // for testnet, need to redeploy
export const TOKEN_CONTRACT_NAME = "aibtc-token"; // for testnet, need to redeploy

export const TRAITS: NetworkTraitsMap = {
  mainnet: {
    SIP010_FT: {
      contractAddress: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
      contractName: "sip-010-trait-ft-standard",
      traitName: "sip-010-trait",
    },
    PROPOSAL: {
      contractAddress: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS",
      contractName: "charisma-traits-v1",
      traitName: "proposal-trait",
    },
    EXTENSION: {
      contractAddress: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS",
      contractName: "charisma-traits-v1",
      traitName: "extension-trait",
    },
    NFT: {
      contractAddress: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS",
      contractName: "charisma-traits-v1",
      traitName: "nft-trait",
    },
    FT_PLUS: {
      contractAddress: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS",
      contractName: "charisma-traits-v1",
      traitName: "ft-plus-trait",
    },
    SHARE_FEE_TO: {
      contractAddress: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS",
      contractName: "charisma-traits-v1",
      traitName: "share-fee-to-trait",
    },
  },
  testnet: {
    SIP010_FT: {
      contractAddress: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR",
      contractName: "aibtcdev-traits-rc1",
      traitName: "sip010-ft-trait",
    },
    PROPOSAL: {
      contractAddress: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR",
      contractName: "aibtcdev-traits-rc1",
      traitName: "proposal-trait",
    },
    EXTENSION: {
      contractAddress: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR",
      contractName: "aibtcdev-traits-rc1",
      traitName: "extension-trait",
    },
    NFT: {
      contractAddress: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR",
      contractName: "aibtcdev-traits-rc1",
      traitName: "nft-trait",
    },
    FT_PLUS: {
      contractAddress: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR",
      contractName: "aibtcdev-traits-rc1",
      traitName: "ft-plus-trait",
    },
    SHARE_FEE_TO: {
      contractAddress: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR",
      contractName: "aibtcdev-traits-rc1",
      traitName: "share-fee-to-trait",
    },
  },
  devnet: {
    SIP010_FT: {
      contractAddress: "",
      contractName: "aibtcdev-traits-rc1",
      traitName: "sip010-ft-trait",
    },
    PROPOSAL: {
      contractAddress: "",
      contractName: "aibtcdev-traits-rc1",
      traitName: "proposal-trait",
    },
    EXTENSION: {
      contractAddress: "",
      contractName: "aibtcdev-traits-rc1",
      traitName: "extension-trait",
    },
    NFT: {
      contractAddress: "",
      contractName: "aibtcdev-traits-rc1",
      traitName: "nft-trait",
    },
    FT_PLUS: {
      contractAddress: "",
      contractName: "aibtcdev-traits-rc1",
      traitName: "ft-plus-trait",
    },
    SHARE_FEE_TO: {
      contractAddress: "",
      contractName: "aibtcdev-traits-rc1",
      traitName: "share-fee-to-trait",
    },
  },
  mocknet: {
    SIP010_FT: {
      contractAddress: "",
      contractName: "aibtcdev-traits-rc1",
      traitName: "sip010-ft-trait",
    },
    PROPOSAL: {
      contractAddress: "",
      contractName: "aibtcdev-traits-rc1",
      traitName: "proposal-trait",
    },
    EXTENSION: {
      contractAddress: "",
      contractName: "aibtcdev-traits-rc1",
      traitName: "extension-trait",
    },
    NFT: {
      contractAddress: "",
      contractName: "aibtcdev-traits-rc1",
      traitName: "nft-trait",
    },
    FT_PLUS: {
      contractAddress: "",
      contractName: "aibtcdev-traits-rc1",
      traitName: "ft-plus-trait",
    },
    SHARE_FEE_TO: {
      contractAddress: "",
      contractName: "aibtcdev-traits-rc1",
      traitName: "share-fee-to-trait",
    },
  },
};
