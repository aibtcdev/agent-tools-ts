import { BaseContractRegistryEntry } from "./dao-contract-registry";

// Token contracts
export const TOKEN_CONTRACTS: BaseContractRegistryEntry[] = [
  {
    name: "aibtc-pre-faktory",
    type: "TOKEN",
    subtype: "PRELAUNCH",
    deploymentOrder: 0,
    templatePath: `token/aibtc-pre-dex.clar`,
  },
  {
    name: "aibtc-faktory",
    type: "TOKEN",
    subtype: "DAO",
    deploymentOrder: 1,
    templatePath: `token/aibtc-token.clar`,
    requiredTraits: [
      {
        ref: "STANDARD_SIP010",
        key: "sip10_trait",
      },
    ],
    requiredAddresses: [
      {
        ref: "BITFLOW_FEE",
        key: "stxcity_token_deployment_fee_address",
      },
    ],
  },
  {
    name: "aibtc-faktory-dex",
    type: "TOKEN",
    subtype: "DEX",
    deploymentOrder: 3,
    templatePath: `token/aibtc-token-dex.clar`,
    requiredTraits: [
      {
        ref: "STANDARD_SIP010",
        key: "sip10_trait",
      },
    ],
    requiredAddresses: [
      {
        ref: "BITFLOW_CORE",
        key: "bitflow_core_contract",
      },
      {
        ref: "BITFLOW_STX_TOKEN",
        key: "bitflow_stx_token_address",
      },
      {
        ref: "BITFLOW_FEE",
        key: "bitflow_fee_address",
      },
      {
        ref: "BURN",
        key: "burn",
      },
    ],
    requiredContractAddresses: [
      {
        key: "token_owner_contract",
        category: "EXTENSIONS",
        subcategory: "TOKEN_OWNER",
      },
      {
        key: "dex_contract",
        category: "TOKEN",
        subcategory: "DEX",
      },
      {
        key: "treasury_contract",
        category: "EXTENSIONS",
        subcategory: "TREASURY",
      },
    ],
    requiredRuntimeValues: [
      { key: "hash" },
      { key: "target_stx" },
      { key: "token_max_supply" },
      { key: "token_name" },
      { key: "token_symbol" },
      { key: "token_decimals" },
      { key: "token_uri" },
      { key: "token_deployment_fee_address" },
    ],
  },
  {
    name: "xyk-pool-sbtc-aibtc-v-1-1",
    type: "TOKEN",
    subtype: "POOL",
    deploymentOrder: 2,
    templatePath: `token/aibtc-bitflow-pool.clar`,
    requiredTraits: [
      {
        ref: "BITFLOW_POOL",
        key: "bitflow_pool_trait",
      },
      {
        ref: "STANDARD_SIP010",
        key: "sip10_trait",
      },
      {
        ref: "DAO_TOKEN_POOL",
        key: "dao_bitflow_pool_trait",
      },
    ],
    requiredAddresses: [
      {
        ref: "BITFLOW_CORE",
        key: "bitflow_xyk_core_address",
      },
    ],
    requiredContractAddresses: [
      { key: "dex_contract", category: "TOKEN", subcategory: "DEX" },
    ],
  },
  {
    name: "xyk-pool-stx-aibtc-v-1-1",
    type: "TOKEN",
    subtype: "POOL_STX",
    deploymentOrder: 2,
    templatePath: `token/aibtc-bitflow-pool.clar`,
    requiredTraits: [
      {
        ref: "BITFLOW_POOL",
        key: "bitflow_pool_trait",
      },
      {
        ref: "STANDARD_SIP010",
        key: "sip10_trait",
      },
      {
        ref: "DAO_TOKEN_POOL",
        key: "dao_bitflow_pool_trait",
      },
    ],
    requiredAddresses: [
      {
        ref: "BITFLOW_CORE",
        key: "bitflow_xyk_core_address",
      },
    ],
    requiredContractAddresses: [
      { key: "dex_contract", category: "TOKEN", subcategory: "DEX" },
    ],
  },
];
