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
  DAO_TOKEN_FAKTORY_DEX: string;
  DAO_TOKEN_OWNER: string;
  DAO_TOKEN_POOL: string;
  DAO_TREASURY: string;
};

// combine to define known traits
export type KnownTraits = ExternalTraits & DaoTraits;

// define known traits for each network

const mainnetTraits: KnownTraits = {
  STANDARD_SIP009: "",
  STANDARD_SIP010: "",
  FAKTORY_SIP010: "",
  BITFLOW_POOL: "",
  BITFLOW_SIP010: "",
  DAO_BASE: "",
  DAO_PROPOSAL: "",
  DAO_EXTENSION: "",
  DAO_ACTION: "",
  DAO_ACTION_PROPOSALS: "",
  DAO_BANK_ACCOUNT: "",
  DAO_CHARTER: "",
  DAO_CORE_PROPOSALS: "",
  DAO_INVOICES: "",
  DAO_MESSAGING: "",
  DAO_RESOURCES: "",
  DAO_TOKEN: "",
  DAO_TOKEN_DEX: "",
  DAO_TOKEN_FAKTORY_DEX: "",
  DAO_TOKEN_OWNER: "",
  DAO_TOKEN_POOL: "",
  DAO_TREASURY: "",
};

const testnetTraits: KnownTraits = {
  STANDARD_SIP009: "",
  STANDARD_SIP010: "",
  FAKTORY_SIP010: "",
  BITFLOW_POOL: "",
  BITFLOW_SIP010: "",
  DAO_BASE: "",
  DAO_PROPOSAL: "",
  DAO_EXTENSION: "",
  DAO_ACTION: "",
  DAO_ACTION_PROPOSALS: "",
  DAO_BANK_ACCOUNT: "",
  DAO_CHARTER: "",
  DAO_CORE_PROPOSALS: "",
  DAO_INVOICES: "",
  DAO_MESSAGING: "",
  DAO_RESOURCES: "",
  DAO_TOKEN: "",
  DAO_TOKEN_DEX: "",
  DAO_TOKEN_FAKTORY_DEX: "",
  DAO_TOKEN_OWNER: "",
  DAO_TOKEN_POOL: "",
  DAO_TREASURY: "",
};

const devnetTraits: KnownTraits = {
  STANDARD_SIP009: "",
  STANDARD_SIP010: "",
  FAKTORY_SIP010: "",
  BITFLOW_POOL: "",
  BITFLOW_SIP010: "",
  DAO_BASE: "",
  DAO_PROPOSAL: "",
  DAO_EXTENSION: "",
  DAO_ACTION: "",
  DAO_ACTION_PROPOSALS: "",
  DAO_BANK_ACCOUNT: "",
  DAO_CHARTER: "",
  DAO_CORE_PROPOSALS: "",
  DAO_INVOICES: "",
  DAO_MESSAGING: "",
  DAO_RESOURCES: "",
  DAO_TOKEN: "",
  DAO_TOKEN_DEX: "",
  DAO_TOKEN_FAKTORY_DEX: "",
  DAO_TOKEN_OWNER: "",
  DAO_TOKEN_POOL: "",
  DAO_TREASURY: "",
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
