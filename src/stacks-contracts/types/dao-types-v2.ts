import { StacksNetworkName } from "@stacks/network";
import { NetworkType } from "../../types";

//////////////////////////////
// GENERAL HELPERS
//////////////////////////////

// make uppercase version of StacksNetworkName
export type NetworkName = Uppercase<StacksNetworkName>;
// (alias) type StacksNetworkName = "mainnet" | "testnet" | "devnet" | "mocknet"

// helper to get the network name from the network type
export function getNetworkNameFromType(network: NetworkType): NetworkName {
  // create an array of valid network names (lowercase)
  const validNetworks: StacksNetworkName[] = [
    "mainnet",
    "testnet",
    "devnet",
    "mocknet",
  ];
  // check if the input is valid
  if (!validNetworks.includes(network as StacksNetworkName)) {
    throw new Error(
      `Invalid network type: ${network}. Expected one of: ${validNetworks.join(
        ", "
      )}`
    );
  }
  // convert to uppercase and new type
  return network.toUpperCase() as NetworkName;
}

// helper to convert back to StacksNetworkName type
export function getNetworkTypeFromName(network: NetworkName): NetworkType {
  return network.toLowerCase() as NetworkType;
}

//////////////////////////////
// KNOWN ADDRESSES
//////////////////////////////

// define all known addresses by key

export interface KnownAddresses {
  DEPLOYER: string;
  POX: string;
  BURN: string;
  BITFLOW_CORE: string;
  BITFLOW_STX_TOKEN: string;
  BITFLOW_FEE: string;
}

// define known addresses for each network

const mainnetAddresses: KnownAddresses = {
  DEPLOYER: "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46",
  POX: "SP000000000000000000002Q6VF78.pox-4",
  BURN: "SP000000000000000000002Q6VF78",
  BITFLOW_CORE: "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-core-v-1-2",
  BITFLOW_STX_TOKEN:
    "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-2",
  BITFLOW_FEE: "SP31C60QVZKZ9CMMZX73TQ3F3ZZNS89YX2DCCFT8P",
};

const testnetAddresses: KnownAddresses = {
  DEPLOYER: "ST1994Y3P6ZDJX476QFSABEFE5T6YMTJT0T7RSQDW",
  POX: "ST000000000000000000002AMW42H.pox-4",
  BURN: "ST000000000000000000002AMW42H",
  BITFLOW_CORE: "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.xyk-core-v-1-2",
  BITFLOW_STX_TOKEN:
    "ST295MNE41DC74QYCPRS8N37YYMC06N6Q3VQDZ6G1.token-stx-v-1-2",
  BITFLOW_FEE: "ST295MNE41DC74QYCPRS8N37YYMC06N6Q3VQDZ6G1",
};

const devnetAddresses: KnownAddresses = {
  DEPLOYER: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  POX: "ST000000000000000000002AMW42H.pox-4",
  BURN: "ST000000000000000000002AMW42H",
  BITFLOW_CORE: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.xyk-core-v-1-2",
  BITFLOW_STX_TOKEN:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.token-stx-v-1-2",
  BITFLOW_FEE: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
};

// combine the addresses for each network

const ADDRESSES: Record<NetworkName, KnownAddresses> = {
  MAINNET: mainnetAddresses,
  TESTNET: testnetAddresses,
  DEVNET: devnetAddresses,
  MOCKNET: devnetAddresses,
} as const;

// helper to get known addresses for a network
// TODO: replaces ADDRESSES in constants.ts
export function getKnownAddresses(network: NetworkName): KnownAddresses {
  return ADDRESSES[network];
}

// helper to get a specific address
export function getKnownAddress(
  network: NetworkName,
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
  DAO_BANK_ACCOUNT: string;
  DAO_CHARTER: string;
  DAO_CORE_PROPOSALS: string;
  DAO_INVOICES: string;
  DAO_MESSAGING: string;
  DAO_RESOURCES: string;
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
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-v2.aibtc-base-dao",
  DAO_PROPOSAL:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.proposal",
  DAO_EXTENSION:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.extension",
  DAO_ACTION:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.action",
  DAO_ACTION_PROPOSALS:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.action-proposals",
  DAO_BANK_ACCOUNT:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.bank-account",
  DAO_CHARTER:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.charter",
  DAO_CORE_PROPOSALS:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.core-proposals",
  DAO_INVOICES:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.invoices",
  DAO_MESSAGING:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.messaging",
  DAO_RESOURCES:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.resources",
  DAO_TOKEN:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.token",
  DAO_TOKEN_DEX:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.faktory-dex",
  DAO_TOKEN_OWNER:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.token-owner",
  DAO_TOKEN_POOL:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.bitflow-pool",
  DAO_TREASURY:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v2.treasury",
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
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-v2.aibtc-base-dao",
  DAO_PROPOSAL:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.proposal",
  DAO_EXTENSION:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.extension",
  DAO_ACTION:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.action",
  DAO_ACTION_PROPOSALS:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.action-proposals",
  DAO_BANK_ACCOUNT:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.bank-account",
  DAO_CHARTER:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.charter",
  DAO_CORE_PROPOSALS:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.core-proposals",
  DAO_INVOICES:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.invoices",
  DAO_MESSAGING:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.messaging",
  DAO_RESOURCES:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.resources",
  DAO_TOKEN:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.token",
  DAO_TOKEN_DEX:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.faktory-dex",
  DAO_TOKEN_OWNER:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.token-owner",
  DAO_TOKEN_POOL:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.bitflow-pool",
  DAO_TREASURY:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.aibtcdev-dao-traits-v2.treasury",
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
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-v2.aibtc-base-dao",
  DAO_PROPOSAL:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.proposal",
  DAO_EXTENSION:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.extension",
  DAO_ACTION:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.action",
  DAO_ACTION_PROPOSALS:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.action-proposals",
  DAO_BANK_ACCOUNT:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.bank-account",
  DAO_CHARTER:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.charter",
  DAO_CORE_PROPOSALS:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.core-proposals",
  DAO_INVOICES:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.invoices",
  DAO_MESSAGING:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.messaging",
  DAO_RESOURCES:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.resources",
  DAO_TOKEN:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.token",
  DAO_TOKEN_DEX:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.faktory-dex",
  DAO_TOKEN_OWNER:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.token-owner",
  DAO_TOKEN_POOL:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.bitflow-pool",
  DAO_TREASURY:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v2.treasury",
};

// combine the traits for each network
const TRAITS: Record<NetworkName, KnownTraits> = {
  MAINNET: mainnetTraits,
  TESTNET: testnetTraits,
  DEVNET: devnetTraits,
  MOCKNET: devnetTraits,
} as const;

// helper to get known traits for a network
export function getKnownTraits(network: NetworkName): KnownTraits {
  return TRAITS[network];
}

// helper to get a specific trait reference
export function getTraitReference(
  network: NetworkName,
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
    "BANK_ACCOUNT_SET_ACCOUNT_HOLDER",
    "BANK_ACCOUNT_SET_WITHDRAWAL_AMOUNT",
    "BANK_ACCOUNT_SET_WITHDRAWAL_PERIOD",
    "MESSAGING_SEND_MESSAGE",
    "PAYMENTS_INVOICES_ADD_RESOURCE",
    "PAYMENTS_INVOICES_TOGGLE_RESOURCE",
    "TREASURY_ALLOW_ASSET",
  ] as const,
  EXTENSIONS: [
    "ACTION_PROPOSALS",
    "BANK_ACCOUNT",
    "CORE_PROPOSALS",
    "CHARTER",
    "MESSAGING",
    "PAYMENTS",
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
  TOKEN: ["DAO", "DEX", "POOL"] as const,
} as const;

// helper type that infers subcategory keys per category
export type ContractSubCategory<C extends ContractCategory> =
  (typeof CONTRACT_SUBCATEGORIES)[C][number];
