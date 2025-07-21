import { StacksNetworkName } from "@stacks/network";

//////////////////////////////
// GENERAL HELPERS
//////////////////////////////

export type ExpectedContractGeneratorArgs = {
  tokenSymbol: string;
  tokenName: string;
  tokenMaxSupply: number;
  tokenUri: string;
  logoUrl: string;
  originAddress: string;
  daoManifest: string;
  tweetOrigin: string;
  daoManifestInscriptionId?: string;
  generateFiles?: boolean;
};

//////////////////////////////
// KNOWN ADDRESSES
//////////////////////////////

// define all known addresses by key

export interface KnownAddresses {
  DEPLOYER: string;
  POX: string;
  BURN: string;
  SBTC: string;
  BITFLOW_CORE: string;
  BITFLOW_STX_TOKEN: string;
  BITFLOW_FEE: string;
}

/**
 * Configuration for creating multiple copies of a contract
 */
export interface ContractCopyConfig {
  type: ContractCategory;
  subtype: ContractSubCategory<ContractCategory>;
  count: number;  // Number of copies to create
  nameFormat?: string; // Optional format string (default: "{name}-{index}")
}

// define known addresses for each network

const mainnetAddresses: KnownAddresses = {
  DEPLOYER: "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46",
  POX: "SP000000000000000000002Q6VF78.pox-4",
  BURN: "SP000000000000000000002Q6VF78",
  SBTC: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
  BITFLOW_CORE: "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-core-v-1-2",
  BITFLOW_STX_TOKEN:
    "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-2",
  BITFLOW_FEE: "SP31C60QVZKZ9CMMZX73TQ3F3ZZNS89YX2DCCFT8P",
};

const testnetAddresses: KnownAddresses = {
  DEPLOYER: "ST1994Y3P6ZDJX476QFSABEFE5T6YMTJT0T7RSQDW",
  POX: "ST000000000000000000002AMW42H.pox-4",
  BURN: "ST000000000000000000002AMW42H",
  SBTC: "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token",
  BITFLOW_CORE: "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.xyk-core-v-1-2",
  BITFLOW_STX_TOKEN:
    "ST295MNE41DC74QYCPRS8N37YYMC06N6Q3VQDZ6G1.token-stx-v-1-2",
  BITFLOW_FEE: "ST295MNE41DC74QYCPRS8N37YYMC06N6Q3VQDZ6G1",
};

const devnetAddresses: KnownAddresses = {
  DEPLOYER: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  POX: "ST000000000000000000002AMW42H.pox-4",
  BURN: "ST000000000000000000002AMW42H",
  SBTC: "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token",
  BITFLOW_CORE: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.xyk-core-v-1-2",
  BITFLOW_STX_TOKEN:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.token-stx-v-1-2",
  BITFLOW_FEE: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
};

// combine the addresses for each network

const ADDRESSES: Record<StacksNetworkName, KnownAddresses> = {
  mainnet: mainnetAddresses,
  testnet: testnetAddresses,
  devnet: devnetAddresses,
  mocknet: devnetAddresses,
} as const;

// helper to get known addresses for a network
// TODO: replaces ADDRESSES in constants.ts
export function getKnownAddresses(network: StacksNetworkName): KnownAddresses {
  return ADDRESSES[network];
}

// helper to get a specific address
export function getKnownAddress(
  network: StacksNetworkName,
  address: keyof KnownAddresses
): string {
  return ADDRESSES[network][address];
}

//////////////////////////////
// CONTRACT TRAITS
//////////////////////////////

// define known traits by key and category

type ExternalTraits = {
  STANDARD_SIP009: string;
  STANDARD_SIP010: string;
  FAKTORY_SIP010: string;
  BITFLOW_POOL: string;
  BITFLOW_SIP010: string;
};

type DaoTraits = {
  DAO_BASE: string;
  DAO_PROPOSAL: string;
  DAO_EXTENSION: string;
  DAO_ACTION: string;
  DAO_ACTION_PROPOSALS: string;
  DAO_CHARTER: string;
  DAO_CORE_PROPOSALS: string;
  DAO_INVOICES: string;
  DAO_MESSAGING: string;
  DAO_RESOURCES: string;
  DAO_SMART_WALLET_BASE: string;
  DAO_SMART_WALLET_PROPOSALS: string;
  DAO_SMART_WALLET_FAKTORY: string;
  DAO_TIMED_VAULT: string;
  DAO_TOKEN: string;
  DAO_TOKEN_DEX: string;
  DAO_TOKEN_OWNER: string;
  DAO_TOKEN_POOL: string;
  DAO_TREASURY: string;
};

// combine to define known traits
export type KnownTraits = ExternalTraits & DaoTraits;

// define known traits for each network

const mainnetTraits: KnownTraits = {
  STANDARD_SIP009:
    "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait",
  STANDARD_SIP010:
    "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait",
  FAKTORY_SIP010:
    "SP3XXMS38VTAWTVPE5682XSBFXPTH7XCPEBTX8AN2.faktory-trait-v1.sip-010-trait",
  BITFLOW_POOL:
    "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-trait-v-1-2.xyk-pool-trait",
  BITFLOW_SIP010:
    "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.sip-010-trait-ft-standard-v-1-1.sip-010-trait",
  DAO_BASE:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-v3.aibtc-base-dao",
  DAO_PROPOSAL:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.proposal",
  DAO_EXTENSION:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.extension",
  DAO_ACTION:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.action",
  DAO_ACTION_PROPOSALS:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.action-proposals",
  DAO_TIMED_VAULT:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.timed-vault",
  DAO_CHARTER:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.charter",
  DAO_CORE_PROPOSALS:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.core-proposals",
  DAO_INVOICES:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.invoices",
  DAO_MESSAGING:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.messaging",
  DAO_RESOURCES:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.resources",
  DAO_SMART_WALLET_BASE:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-user-agent-traits.aibtc-smart-wallet",
  DAO_SMART_WALLET_PROPOSALS:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-user-agent-traits.aibtc-proposals-v2",
  DAO_SMART_WALLET_FAKTORY:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-user-agent-traits.faktory-buy-sell",
  DAO_TOKEN:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.token",
  DAO_TOKEN_DEX:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.faktory-dex",
  DAO_TOKEN_OWNER:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.token-owner",
  DAO_TOKEN_POOL:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.bitflow-pool",
  DAO_TREASURY:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.treasury",
};

const testnetTraits: KnownTraits = {
  STANDARD_SIP009:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.nft-trait.nft-trait",
  STANDARD_SIP010:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.sip-010-trait-ft-standard.sip-010-trait",
  FAKTORY_SIP010:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait",
  BITFLOW_POOL:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.xyk-pool-trait-v-1-2.xyk-pool-trait",
  BITFLOW_SIP010:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.sip-010-trait-ft-standard.sip-010-trait",
  DAO_BASE:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-v3.aibtc-base-dao",
  DAO_PROPOSAL:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.proposal",
  DAO_EXTENSION:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.extension",
  DAO_ACTION:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.action",
  DAO_ACTION_PROPOSALS:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.action-proposals",
  DAO_TIMED_VAULT:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.timed-vault",
  DAO_CHARTER:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.charter",
  DAO_CORE_PROPOSALS:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.core-proposals",
  DAO_INVOICES:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.invoices",
  DAO_MESSAGING:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.messaging",
  DAO_RESOURCES:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.resources",
  DAO_SMART_WALLET_BASE:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-smart-wallet-traits.aibtc-smart-wallet",
  DAO_SMART_WALLET_PROPOSALS:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-smart-wallet-traits.aibtc-proposals-v2",
  DAO_SMART_WALLET_FAKTORY:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-smart-wallet-traits.faktory-buy-sell",
  DAO_TOKEN:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.token",
  DAO_TOKEN_DEX:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.faktory-dex",
  DAO_TOKEN_OWNER:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.token-owner",
  DAO_TOKEN_POOL:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.bitflow-pool",
  DAO_TREASURY:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.treasury",
};

const devnetTraits: KnownTraits = {
  STANDARD_SIP009:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.nft-trait.nft-trait",
  STANDARD_SIP010:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait",
  FAKTORY_SIP010:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.faktory-trait-v1.sip-010-trait",
  BITFLOW_POOL:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.xyk-pool-trait-v-1-2.xyk-pool-trait",
  BITFLOW_SIP010:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait",
  DAO_BASE:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-v3.aibtc-base-dao",
  DAO_PROPOSAL:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.proposal",
  DAO_EXTENSION:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.extension",
  DAO_ACTION:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.action",
  DAO_ACTION_PROPOSALS:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.action-proposals",
  DAO_TIMED_VAULT:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.timed-vault",
  DAO_CHARTER:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.charter",
  DAO_CORE_PROPOSALS:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.core-proposals",
  DAO_INVOICES:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.invoices",
  DAO_MESSAGING:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.messaging",
  DAO_RESOURCES:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.resources",
  DAO_SMART_WALLET_BASE:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-smart-wallet-traits.aibtc-smart-wallet",
  DAO_SMART_WALLET_PROPOSALS:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-smart-wallet-traits.aibtc-proposals-v2",
  DAO_SMART_WALLET_FAKTORY:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-smart-wallet-traits.faktory-buy-sell",
  DAO_TOKEN:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.token",
  DAO_TOKEN_DEX:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.faktory-dex",
  DAO_TOKEN_OWNER:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.token-owner",
  DAO_TOKEN_POOL:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.bitflow-pool",
  DAO_TREASURY:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.treasury",
};

// combine the traits for each network
const TRAITS: Record<StacksNetworkName, KnownTraits> = {
  mainnet: mainnetTraits,
  testnet: testnetTraits,
  devnet: devnetTraits,
  mocknet: devnetTraits,
} as const;

// helper to get known traits for a network
export function getKnownTraits(network: StacksNetworkName): KnownTraits {
  return TRAITS[network];
}

// helper to get a specific trait reference
export function getTraitReference(
  network: StacksNetworkName,
  trait: keyof KnownTraits
): string {
  return TRAITS[network][trait];
}

//////////////////////////////
// CONTRACT DEFINITIONS
//////////////////////////////

// define an array of categories
export const CONTRACT_CATEGORIES = [
  "BASE", // base-dao
  "ACTIONS", // action proposal extensions
  "EXTENSIONS", // extensions
  "PROPOSALS", // core proposals
  "EXTERNAL", // sips, bitflow, faktory
  "TOKEN", // token, dex, pool
] as const;

// derive a type from the categories
export type ContractCategory = (typeof CONTRACT_CATEGORIES)[number];

// define the subcategories for each category
const CONTRACT_SUBCATEGORIES = {
  BASE: ["DAO"] as const,
  ACTIONS: [
    "CONFIGURE_TIMED_VAULT_DAO",
    "CONFIGURE_TIMED_VAULT_SBTC",
    "CONFIGURE_TIMED_VAULT_STX",
    "PMT_DAO_ADD_RESOURCE",
    "PMT_DAO_TOGGLE_RESOURCE",
    "PMT_SBTC_ADD_RESOURCE",
    "PMT_SBTC_TOGGLE_RESOURCE",
    "PMT_STX_ADD_RESOURCE",
    "PMT_STX_TOGGLE_RESOURCE",
    "MESSAGING_SEND_MESSAGE",
    "TREASURY_ALLOW_ASSET",
  ] as const,
  EXTENSIONS: [
    "ACTION_PROPOSALS",
    "CORE_PROPOSALS",
    "CHARTER",
    "MESSAGING",
    "PAYMENTS_DAO",
    "PAYMENTS_SBTC",
    "PAYMENTS_STX",
    "TIMED_VAULT_DAO",
    "TIMED_VAULT_SBTC",
    "TIMED_VAULT_STX",
    "TOKEN_OWNER",
    "TREASURY",
  ] as const,
  PROPOSALS: ["BOOTSTRAP_INIT"] as const,
  EXTERNAL: [
    "STANDARD_SIP009",
    "STANDARD_SIP010",
    "FAKTORY_SIP010",
    "BITFLOW_POOL",
    "BITFOW_SIP010",
  ] as const,
  TOKEN: ["DAO", "DEX", "POOL", "POOL_STX", "PRELAUNCH"] as const,
} as const;

// helper type that infers subcategory keys per category
export type ContractSubCategory<C extends ContractCategory> =
  (typeof CONTRACT_SUBCATEGORIES)[C][number];

//////////////////////////////
// CONTRACT DATA STRUCTURES
//////////////////////////////

// Match the payment-invoices ResourceData map structure
export interface ResourceData {
  createdAt: number;
  enabled: boolean;
  name: string;
  description: string;
  price: number;
  totalSpent: number;
  totalUsed: number;
  url?: string;
}

//////////////////////////////
// AGENT ACCOUNT TYPES
//////////////////////////////

export const AGENT_ACCOUNT_APPROVAL_TYPES = {
  VOTING: 1,
  SWAP: 2,
  TOKEN: 3,
} as const;

export type AgentAccountApprovalType =
  keyof typeof AGENT_ACCOUNT_APPROVAL_TYPES;
