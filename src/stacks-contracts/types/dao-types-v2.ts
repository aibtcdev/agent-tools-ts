import { StacksNetworkName } from "@stacks/network";

// make uppercase version of StacksNetworkName
type NetworkName = Uppercase<StacksNetworkName>;

//////////////////////////////
// UTILITY TYPES
//////////////////////////////

type ValuesOf<T> = T[keyof T];

//////////////////////////////
// KNOWN ADDRESSES
//////////////////////////////

export interface KnownAddresses {
  DEPLOYER: string;
  POX: string;
  BURN: string;
  BITFLOW_CORE: string;
  BITFLOW_STX_TOKEN: string;
  BITFLOW_FEE: string;
}

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

// TODO: replaces ADDRESSES in constants.ts
export const ADDRESSES: Record<NetworkName, KnownAddresses> = {
  MAINNET: mainnetAddresses,
  TESTNET: testnetAddresses,
  DEVNET: devnetAddresses,
  MOCKNET: devnetAddresses,
} as const;

//////////////////////////////
// CONTRACT TRAITS
//////////////////////////////

// define trait locations within contracts
export const TRAIT_CONTRACTS = {
  SIP009: {
    contractName: "nft-trait",
    traits: ["nft-trait"],
  },
  SIP010: {
    contractName: "sip-010-trait-ft-standard",
    traits: ["sip-010-trait"],
  },
  SIP010_FAKTORY: {
    contractName: "faktory-trait-v1",
    traits: ["sip-010-trait"],
  },
  DAO_BASE: {
    contractName: "aibtcdev-dao-v1",
    traits: ["aibtcdev-base-dao"],
  },
  DAO_BASE_V2: {
    contractName: "aibtc-dao-v2",
    traits: ["aibtc-base-dao"],
  },
  DAO_TRAITS: {
    contractName: "aibtcdev-dao-traits-v1",
    traits: [
      "proposal",
      "extension",
      "action",
      "action-proposals",
      "bank-account",
      "bitflow-pool",
      "core-proposals",
      "messaging",
      "invoices",
      "resources",
      "token-dex",
      "token-owner",
      "token",
      "treasury",
    ],
  },
  DAO_TRAITS_V1_1: {
    contractName: "aibtcdev-dao-traits-v1-1",
    traits: ["faktory-dex"],
  },
  DAO_TRAITS_V2: {
    contractName: "aibtc-dao-traits-v2",
    traits: [
      "proposal",
      "extension",
      "bitflow-pool",
      "faktory-dex",
      "token",
      "action",
      "action-proposals",
      "bank-account",
      "charter",
      "core-proposals",
      "messaging",
      "invoices",
      "resources",
      "token-owner",
      "treasury",
    ],
  },
  BITFLOW_POOL: {
    contractName: "xyk-pool-trait-v-1-2",
    traits: ["xyk-pool-trait"],
  },
  BITFLOW_SIP010: {
    contractName: "sip-010-trait-ft-standard",
    traits: ["sip-010-trait"],
  },
} as const;

// type for a complete trait reference
export interface TraitReference {
  contractAddress: string;
  contractName: string;
  traitName: string;
}

// keys of TRAIT_CONTRACTS
type TraitContractKey = keyof typeof TRAIT_CONTRACTS;
// values in TRAIT_CONTRACTS
type TraitContractValue = (typeof TRAIT_CONTRACTS)[TraitContractKey];
// entry tuple type for Object.entries
type TraitContractEntry = [TraitContractKey, TraitContractValue];
// the final return type
type TraitReferenceMap = Record<TraitContractKey, TraitReference[]>;

// helper to generate trait references for a given network
export function getTraitReferences(network: NetworkName): TraitReferenceMap {
  const addresses = ADDRESSES[network];
  const entries = Object.entries(TRAIT_CONTRACTS) as TraitContractEntry[];

  return entries.reduce((acc, [contractKey, { contractName, traits }]) => {
    acc[contractKey] = traits.map((traitName) => ({
      contractAddress: addresses.DEPLOYER,
      contractName,
      traitName,
    }));
    return acc;
  }, {} as TraitReferenceMap);
}

// export all trait names as a union type
export type TraitName = ValuesOf<{
  [K in keyof typeof TRAIT_CONTRACTS]: (typeof TRAIT_CONTRACTS)[K]["traits"][number];
}>;

/////////////////////////
// DAO CONTRACTS
/////////////////////////

// dao contract names by category and type
export const DAO_CONTRACTS = {
  BASE: {
    DAO: "SYMBOL-base-dao" as const,
  },
  TOKEN: {
    DAO: "SYMBOL-faktory" as const,
    DEX: "SYMBOL-faktory-dex" as const,
    POOL: "xyk-pool-stx-SYMBOL-v-1-1" as const,
  },
  EXTENSIONS: {
    ACTION_PROPOSALS: "SYMBOL-action-proposals" as const,
    BANK_ACCOUNT: "SYMBOL-bank-account" as const,
    CORE_PROPOSALS: "SYMBOL-core-proposals" as const,
    CHARTER: "SYMBOL-dao-charter" as const,
    MESSAGING: "SYMBOL-onchain-messaging" as const,
    PAYMENTS: "SYMBOL-payments-invoices" as const,
    TOKEN_OWNER: "SYMBOL-token-owner" as const,
    TREASURY: "SYMBOL-treasury" as const,
  },
  ACTIONS: {
    ADD_RESOURCE: "SYMBOL-action-add-resource" as const,
    ALLOW_ASSET: "SYMBOL-action-allow-asset" as const,
    SEND_MESSAGE: "SYMBOL-action-send-message" as const,
    SET_ACCOUNT_HOLDER: "SYMBOL-action-set-account-holder" as const,
    SET_WITHDRAWAL_AMOUNT: "SYMBOL-action-set-withdrawal-amount" as const,
    SET_WITHDRAWAL_PERIOD: "SYMBOL-action-set-withdrawal-period" as const,
    TOGGLE_RESOURCE: "SYMBOL-action-toggle-resource" as const,
  },
  PROPOSALS: {
    BOOTSTRAP_INIT: "SYMBOL-base-bootstrap-initialization-v2" as const,
  },
} as const;

// type for contract categories
type ContractCategory = keyof typeof DAO_CONTRACTS;
type ContractSubCategory<T extends ContractCategory> =
  keyof (typeof DAO_CONTRACTS)[T];

// type for the generated DAO contract structure
export type GeneratedDao = {
  [K in ContractCategory]: Record<ContractSubCategory<K>, string>;
};

// helper to generate contract names for a category
function generateCategoryContracts<T extends ContractCategory>(
  category: T,
  symbol: string
): Record<ContractSubCategory<T>, string> {
  return Object.entries(DAO_CONTRACTS[category]).reduce(
    (acc, [key, template]) => ({
      ...acc,
      [key]: template.replace(/SYMBOL/g, symbol.toLowerCase()),
    }),
    {} as Record<ContractSubCategory<T>, string>
  );
}

// helper to generate dao contracts
export function generateDaoContracts(symbol: string): GeneratedDao {
  return Object.keys(DAO_CONTRACTS).reduce(
    (acc, category) => ({
      ...acc,
      [category]: generateCategoryContracts(
        category as ContractCategory,
        symbol
      ),
    }),
    {} as GeneratedDao
  );
}

/* USAGE EXAMPLE
const btcDao = generateDaoContracts('BTC');
// access generated contract names
const baseDao = btcDao.BASE.DAO;                // 'btc-dao'
const tokenMain = btcDao.TOKEN.DAO;            // 'btc-faktory'
const charter = btcDao.EXTENSIONS.CHARTER;      // 'btc-dao-charter'
const addResource = btcDao.ACTIONS.ADD_RESOURCE; // 'btc-action-add-resource'
const bootstrap = btcDao.PROPOSALS.BOOTSTRAP;    // 'btc-bootstrap'
*/
