import { StacksNetworkName } from "@stacks/network";

// make uppercase version of StacksNetworkName
export type NetworkName = Uppercase<StacksNetworkName>;

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

// Define trait categories and their associated traits
export const TRAIT_CONTRACTS = {
  STANDARDS: {
    SIP009: {
      contractName: "nft-trait",
      traitName: "nft-trait",
    },
    SIP010: {
      contractName: "sip-010-trait-ft-standard",
      traitName: "sip-010-trait",
    },
  },
  BASE: {
    DAO: {
      contractName: "aibtc-dao-v2",
      traitName: "aibtc-base-dao",
    },
  },
  EXTENSIONS: {
    EXTENSION: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "extension",
    },
    BITFLOW_POOL: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "bitflow-pool",
    },
    FAKTORY_DEX: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "faktory-dex",
    },
    TOKEN: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "token",
    },
    ACTION: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "action",
    },
    ACTION_PROPOSALS: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "action-proposals",
    },
    BANK_ACCOUNT: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "bank-account",
    },
    CHARTER: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "charter",
    },
    CORE_PROPOSALS: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "core-proposals",
    },
    MESSAGING: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "messaging",
    },
    INVOICES: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "invoices",
    },
    RESOURCES: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "resources",
    },
    TOKEN_OWNER: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "token-owner",
    },
    TREASURY: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "treasury",
    },
  },
  PROPOSALS: {
    PROPOSAL: {
      contractName: "aibtc-dao-traits-v2",
      traitName: "proposal",
    },
  },
  BITFLOW: {
    POOL: {
      contractName: "xyk-pool-trait-v-1-2",
      traitName: "xyk-pool-trait",
    },
    SIP010: {
      contractName: "sip-010-trait-ft-standard",
      traitName: "sip-010-trait",
    },
  },
  FAKTORY: {
    SIP010: {
      contractName: "faktory-trait-v1",
      traitName: "sip-010-trait",
    },
  },
} as const;

// Helper types
export type TraitContractCategory = keyof typeof TRAIT_CONTRACTS;
export type TraitContractType<T extends TraitContractCategory> =
  keyof (typeof TRAIT_CONTRACTS)[T];

interface TraitReference {
  contractAddress: string;
  contractName: string;
  traitName: string;
}

export type TraitReferenceMap = {
  [Category in TraitContractCategory]: {
    [Contract in TraitContractType<Category>]: TraitReference;
  };
};

// Helper to generate trait references for a given network
export function getTraitReferences(network: NetworkName): TraitReferenceMap {
  const addresses = ADDRESSES[network];

  return Object.entries(TRAIT_CONTRACTS).reduce(
    (categoryAcc, [category, contracts]) => {
      categoryAcc[category] = Object.entries(contracts).reduce(
        (contractAcc, [contractKey, { contractName, trait }]) => {
          contractAcc[contractKey] = {
            contractAddress: addresses.DEPLOYER,
            contractName,
            traitName: trait,
          };
          return contractAcc;
        },
        {} as Record<string, TraitReference>
      );
      return categoryAcc;
    },
    {} as TraitReferenceMap
  );
}

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
export type ContractCategory = keyof typeof DAO_CONTRACTS;
export type ContractSubCategory<T extends ContractCategory> =
  keyof (typeof DAO_CONTRACTS)[T];

// type to scope a contract request
export type ContractRequest<T extends ContractCategory = ContractCategory> = {
  category: T;
  name: ContractSubCategory<T>;
};

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
