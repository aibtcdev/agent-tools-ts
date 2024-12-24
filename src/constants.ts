import { NetworkTraitsMap, NetworkAddressMap } from "./types";

export const DEPLOYER = ""; // for testnet, need to redeploy
export const CONTRACT_NAME = "aibtcdev-aibtc"; // for testnet, need to redeploy
export const TOKEN_CONTRACT_NAME = "aibtc-token"; // for testnet, need to redeploy

export const ADDRESSES: NetworkAddressMap = {
  mainnet: {
    BURN_ADDRESS: "SP000000000000000000002Q6VF78",
    SWAP_FEE_ADDRESS: "SP295MNE41DC74QYCPRS8N37YYMC06N6Q3T5P1YC2",
    COMPLETE_FEE_ADDRESS: "SP295MNE41DC74QYCPRS8N37YYMC06N6Q3T5P1YC2",
    BITFLOW_CORE_ADDRESS: "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR"
  },
  testnet: {
    BURN_ADDRESS: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR",
    SWAP_FEE_ADDRESS: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR",
    COMPLETE_FEE_ADDRESS: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR",
    BITFLOW_CORE_ADDRESS: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR"
  },
  devnet: {
    BURN_ADDRESS: "",
    SWAP_FEE_ADDRESS: "",
    COMPLETE_FEE_ADDRESS: "",
    BITFLOW_CORE_ADDRESS: ""
  },
  mocknet: {
    BURN_ADDRESS: "",
    SWAP_FEE_ADDRESS: "",
    COMPLETE_FEE_ADDRESS: "",
    BITFLOW_CORE_ADDRESS: ""
  }
};

export const TRAITS = {
  mainnet: {
    SIP010_FT:
      "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait",
    PROPOSAL:
      "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.charisma-traits-v1.proposal-trait",
    EXTENSION:
      "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.charisma-traits-v1.extension-trait",
    EXECUTOR: ".aibtcdev-traits-v1.executor-trait",
    TREASURY: ".aibtcdev-traits-v1.treasury-trait",
    PAYMENTS: ".aibtcdev-traits-v1.payments-trait",
    MESSAGING: ".aibtcdev-traits-v1.messaging-trait",
    BANK_ACCOUNT: ".aibtcdev-traits-v1.bank-account-trait",
    RESOURCE: ".aibtcdev-traits-v1.resource-trait",
    INVOICE: ".aibtcdev-traits-v1.invoice-trait",
    NFT: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.charisma-traits-v1.nft-trait",
    FT_PLUS:
      "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.charisma-traits-v1.ft-plus-trait",
    SHARE_FEE_TO:
      "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.charisma-traits-v1.share-fee-to-trait",
  },
  testnet: {
    SIP010_FT:
      "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR.aibtcdev-traits-rc1.sip010-ft-trait",
    PROPOSAL:
      "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR.aibtcdev-traits-rc1.proposal-trait",
    EXTENSION:
      "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR.aibtcdev-traits-rc1.extension-trait",
    EXECUTOR:
      "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR.aibtcdev-traits-rc1.executor-trait",
    TREASURY:
      "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR.aibtcdev-traits-rc1.treasury-trait",
    PAYMENTS:
      "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR.aibtcdev-traits-rc1.payments-trait",
    MESSAGING:
      "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR.aibtcdev-traits-rc1.messaging-trait",
    BANK_ACCOUNT:
      "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR.aibtcdev-traits-rc1.bank-account-trait",
    RESOURCE:
      "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR.aibtcdev-traits-rc1.resource-trait",
    INVOICE:
      "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR.aibtcdev-traits-rc1.invoice-trait",
    NFT: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR.aibtcdev-traits-rc1.nft-trait",
    FT_PLUS:
      "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR.aibtcdev-traits-rc1.ft-plus-trait",
    SHARE_FEE_TO:
      "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR.aibtcdev-traits-rc1.share-fee-to-trait",
  },
};
