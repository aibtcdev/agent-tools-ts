import { NetworkTraitsMap } from "./types";

export const DEPLOYER = ""; // for testnet, need to redeploy
export const CONTRACT_NAME = "aibtcdev-aibtc"; // for testnet, need to redeploy
export const TOKEN_CONTRACT_NAME = "aibtc-token"; // for testnet, need to redeploy

const MAINNET_TRAITS_CONTRACT = "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS";
const MAINNET_TRAITS_NAME = "charisma-traits-v1";
const TESTNET_TRAITS_CONTRACT = "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR";
const TESTNET_TRAITS_NAME = "aibtcdev-traits-rc1";
const DEVNET_TRAITS_CONTRACT = "";
const DEVNET_TRAITS_NAME = "aibtcdev-traits-rc1";
const MOCKNET_TRAITS_CONTRACT = "";
const MOCKNET_TRAITS_NAME = "aibtcdev-traits-rc1";

export const TRAITS: NetworkTraitsMap = {
  mainnet: {
    SIP010_FT: {
      contractAddress: MAINNET_TRAITS_CONTRACT,
      contractName: MAINNET_TRAITS_NAME,
      traitName: "sip010-ft-trait",
    },
    PROPOSAL: {
      contractAddress: MAINNET_TRAITS_CONTRACT,
      contractName: MAINNET_TRAITS_NAME,
      traitName: "proposal-trait",
    },
    EXTENSION: {
      contractAddress: MAINNET_TRAITS_CONTRACT,
      contractName: MAINNET_TRAITS_NAME,
      traitName: "extension-trait",
    },
    NFT: {
      contractAddress: MAINNET_TRAITS_CONTRACT,
      contractName: MAINNET_TRAITS_NAME,
      traitName: "nft-trait",
    },
    FT_PLUS: {
      contractAddress: MAINNET_TRAITS_CONTRACT,
      contractName: MAINNET_TRAITS_NAME,
      traitName: "ft-plus-trait",
    },
    SHARE_FEE_TO: {
      contractAddress: MAINNET_TRAITS_CONTRACT,
      contractName: MAINNET_TRAITS_NAME,
      traitName: "share-fee-to-trait",
    },
  },
  testnet: {
    SIP010_FT: {
      contractAddress: TESTNET_TRAITS_CONTRACT,
      contractName: TESTNET_TRAITS_NAME,
      traitName: "sip010-ft-trait",
    },
    PROPOSAL: {
      contractAddress: TESTNET_TRAITS_CONTRACT,
      contractName: TESTNET_TRAITS_NAME,
      traitName: "proposal-trait",
    },
    EXTENSION: {
      contractAddress: TESTNET_TRAITS_CONTRACT,
      contractName: TESTNET_TRAITS_NAME,
      traitName: "extension-trait",
    },
    NFT: {
      contractAddress: TESTNET_TRAITS_CONTRACT,
      contractName: TESTNET_TRAITS_NAME,
      traitName: "nft-trait",
    },
    FT_PLUS: {
      contractAddress: TESTNET_TRAITS_CONTRACT,
      contractName: TESTNET_TRAITS_NAME,
      traitName: "ft-plus-trait",
    },
    SHARE_FEE_TO: {
      contractAddress: TESTNET_TRAITS_CONTRACT,
      contractName: TESTNET_TRAITS_NAME,
      traitName: "share-fee-to-trait",
    },
  },
  devnet: {
    SIP010_FT: {
      contractAddress: DEVNET_TRAITS_CONTRACT,
      contractName: DEVNET_TRAITS_NAME,
      traitName: "sip010-ft-trait",
    },
    PROPOSAL: {
      contractAddress: DEVNET_TRAITS_CONTRACT,
      contractName: DEVNET_TRAITS_NAME,
      traitName: "proposal-trait",
    },
    EXTENSION: {
      contractAddress: DEVNET_TRAITS_CONTRACT,
      contractName: DEVNET_TRAITS_NAME,
      traitName: "extension-trait",
    },
    NFT: {
      contractAddress: DEVNET_TRAITS_CONTRACT,
      contractName: DEVNET_TRAITS_NAME,
      traitName: "nft-trait",
    },
    FT_PLUS: {
      contractAddress: DEVNET_TRAITS_CONTRACT,
      contractName: DEVNET_TRAITS_NAME,
      traitName: "ft-plus-trait",
    },
    SHARE_FEE_TO: {
      contractAddress: DEVNET_TRAITS_CONTRACT,
      contractName: DEVNET_TRAITS_NAME,
      traitName: "share-fee-to-trait",
    },
  },
  mocknet: {
    SIP010_FT: {
      contractAddress: MOCKNET_TRAITS_CONTRACT,
      contractName: MOCKNET_TRAITS_NAME,
      traitName: "sip010-ft-trait",
    },
    PROPOSAL: {
      contractAddress: MOCKNET_TRAITS_CONTRACT,
      contractName: MOCKNET_TRAITS_NAME,
      traitName: "proposal-trait",
    },
    EXTENSION: {
      contractAddress: MOCKNET_TRAITS_CONTRACT,
      contractName: MOCKNET_TRAITS_NAME,
      traitName: "extension-trait",
    },
    NFT: {
      contractAddress: MOCKNET_TRAITS_CONTRACT,
      contractName: MOCKNET_TRAITS_NAME,
      traitName: "nft-trait",
    },
    FT_PLUS: {
      contractAddress: MOCKNET_TRAITS_CONTRACT,
      contractName: MOCKNET_TRAITS_NAME,
      traitName: "ft-plus-trait",
    },
    SHARE_FEE_TO: {
      contractAddress: MOCKNET_TRAITS_CONTRACT,
      contractName: MOCKNET_TRAITS_NAME,
      traitName: "share-fee-to-trait",
    },
  },
};
