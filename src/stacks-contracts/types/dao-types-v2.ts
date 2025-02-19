/////////////////////////
// BASE TYPES
/////////////////////////

// extract all trait values into a union type
type ValuesOf<T> = T[keyof T];

// helper for nested trait extraction
type ExtractNestedValues<T> = ValuesOf<{
  [K in keyof T]: ValuesOf<T[K]>;
}>;

/////////////////////////
// TRAITS
/////////////////////////

// object for all trait references
export const DaoTraits = {
  STANDARDS: {
    SIP09: "nft-trait" as const,
    SIP10: "sip-010-trait-ft-standard" as const,
    SIP10_FAKTORY: "faktory-dex-trait-v1-1" as const,
  },
  CORE: {
    DAO_BASE: "aibtcdev-dao-v1" as const,
    DAO_BASE_V2: "aibtc-dao-v2" as const,
    DAO_TRAITS: "aibtcdev-dao-traits-v1" as const,
    DAO_TRAITS_V1_1: "aibtcdev-dao-traits-v1-1" as const,
    DAO_TRAITS_V2: "aibtc-dao-traits-v2" as const,
  },
  EXTENSIONS: {
    PROPOSAL: "proposal" as const,
    EXTENSION: "extension" as const,
    ACTION: "action" as const,
    ACTION_PROPOSALS: "action-proposals" as const,
    CORE_PROPOSALS: "core-proposals" as const,
    TREASURY: "treasury" as const,
    MESSAGING: "messaging" as const,
    BANK_ACCOUNT: "bank-account" as const,
    RESOURCES: "resources" as const,
    INVOICES: "invoices" as const,
  },
  TOKEN: {
    TOKEN: "token" as const,
    TOKEN_DEX: "token-dex" as const,
    TOKEN_OWNER: "token-owner" as const,
    TOKEN_FAKTORY_DEX: "faktory-dex" as const,
    BITFLOW_POOL: "bitflow-pool" as const,
  },
  POOLS: {
    POOL: "xyk-pool-trait-v-1-2" as const,
    BITFLOW_POOL: "xyk-pool-trait" as const,
    BITFLOW_SIP010: "sip-010-trait" as const,
  },
} as const;

// export trait values type
export type DaoTraitValue = ExtractNestedValues<typeof DaoTraits>;

/////////////////////////
// ADDRESSES
/////////////////////////

/////////////////////////
// DAO CONTRACTS
/////////////////////////

// Base contract name type to ensure consistency
export type ContractName = `${string}-${string}`;

// Template literal type for contract name patterns
type ContractTemplate = `NAME-${string}` | `xyk-pool-stx-NAME-${string}`;

// Helper to create a contract name generator for a specific DAO
export const createDaoNameGenerator = (daoName: string) => {
  const replaceName = (template: ContractTemplate): ContractName =>
    template.replace(/NAME/g, daoName) as ContractName;

  return {
    generate: replaceName,
    generateAll: () => ({
      base: {
        dao: replaceName(DaoContracts.BASE.DAO),
      },
      token: {
        main: replaceName(DaoContracts.TOKEN.MAIN),
        dex: replaceName(DaoContracts.TOKEN.DEX),
        pool: replaceName(DaoContracts.TOKEN.POOL),
      },
      extensions: Object.entries(DaoContracts.EXTENSIONS).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key.toLowerCase()]: replaceName(value),
        }),
        {} as Record<string, ContractName>
      ),
      actions: Object.entries(DaoContracts.ACTIONS).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key.toLowerCase()]: replaceName(value),
        }),
        {} as Record<string, ContractName>
      ),
      proposals: Object.entries(DaoContracts.PROPOSALS).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key.toLowerCase()]: replaceName(value),
        }),
        {} as Record<string, ContractName>
      ),
    }),
  };
};

// Type helpers
type DaoTraitCategory = keyof typeof DaoTraits;
type DaoTraitType =
  (typeof DaoTraits)[keyof typeof DaoTraits][keyof (typeof DaoTraits)[keyof typeof DaoTraits]];

// Network-specific trait references
export interface TraitReference {
  contractAddress: string;
  contractName: string;
  traitName: string;
}

export type NetworkTraitMap = {
  [K in DaoTraitType]: TraitReference;
};

export function getTraitDefinition(
  network: NetworkType,
  traitType: DaoTraitType
): string {
  if (!DaoTraits) {
    throw new Error("Trait definitions are not available");
  }
}

// Core contract categories
export const DaoContracts = {
  BASE: {
    DAO: "NAME-base-dao" as const,
  },
  TOKEN: {
    MAIN: "NAME-faktory" as const,
    DEX: "NAME-faktory-dex" as const,
    POOL: "xyk-pool-stx-NAME-v-1-1" as const,
  },
  EXTENSIONS: {
    ACTION_PROPOSALS: "NAME-action-proposals" as const,
    ACTION_PROPOSALS_V2: "NAME-action-proposals-v2" as const,
    BANK_ACCOUNT: "NAME-bank-account" as const,
    CORE_PROPOSALS: "NAME-core-proposals" as const,
    CORE_PROPOSALS_V2: "NAME-core-proposals-v2" as const,
    CHARTER: "NAME-dao-charter" as const,
    MESSAGING: "NAME-onchain-messaging" as const,
    PAYMENTS: "NAME-payments-invoices" as const,
    TOKEN_OWNER: "NAME-token-owner" as const,
    TREASURY: "NAME-treasury" as const,
  },
  ACTIONS: {
    ADD_RESOURCE: "NAME-action-add-resource" as const,
    ALLOW_ASSET: "NAME-action-allow-asset" as const,
    SEND_MESSAGE: "NAME-action-send-message" as const,
    SET_ACCOUNT_HOLDER: "NAME-action-set-account-holder" as const,
    SET_WITHDRAWAL_AMOUNT: "NAME-action-set-withdrawal-amount" as const,
    SET_WITHDRAWAL_PERIOD: "NAME-action-set-withdrawal-period" as const,
    TOGGLE_RESOURCE: "NAME-action-toggle-resource" as const,
  },
  PROPOSALS: {
    BOOTSTRAP_INIT: "NAME-base-bootstrap-initialization" as const,
    BOOTSTRAP_INIT_V2: "NAME-base-bootstrap-initialization-v2" as const,
  },
} as const;

// Derive types from the constant structure
export type DaoContractBase =
  (typeof DaoContracts.BASE)[keyof typeof DaoContracts.BASE];
export type DaoContractToken =
  (typeof DaoContracts.TOKEN)[keyof typeof DaoContracts.TOKEN];
export type DaoContractExtension =
  (typeof DaoContracts.EXTENSIONS)[keyof typeof DaoContracts.EXTENSIONS];
export type DaoContractAction =
  (typeof DaoContracts.ACTIONS)[keyof typeof DaoContracts.ACTIONS];
export type DaoContractProposal =
  (typeof DaoContracts.PROPOSALS)[keyof typeof DaoContracts.PROPOSALS];

// Union type for all contract types
export type DaoContractType =
  | DaoContractBase
  | DaoContractToken
  | DaoContractExtension
  | DaoContractAction
  | DaoContractProposal;

// Contract category type
export type DaoContractCategory = keyof typeof DaoContracts;

// Contract information type
export interface DaoContractInfo {
  source: string;
  name: ContractName;
  address: string;
  category: DaoContractCategory;
  type: DaoContractType;
}

// Deployment result types
export interface DeploymentError {
  stage?: string;
  message?: string;
  reason?: string | null;
  details?: unknown;
}

export interface DeploymentResult {
  success: boolean;
  contracts: Record<ContractName, unknown>;
  error?: DeploymentError;
}

// Helper functions
export const isContractType = (value: string): value is DaoContractType => {
  return Object.values(DaoContracts).some((category) =>
    Object.values(category).includes(value as DaoContractType)
  );
};

export const getContractCategory = (
  contractType: DaoContractType
): DaoContractCategory | undefined => {
  return Object.entries(DaoContracts).find(([_, values]) =>
    Object.values(values).includes(contractType)
  )?.[0] as DaoContractCategory | undefined;
};

export const createContractKey = (contractType: DaoContractType): string => {
  return contractType.split("-").slice(1).join("-");
};

// Type guard for deployment details
export const isDeploymentDetails = (
  value: unknown
): value is DeploymentDetails => {
  if (typeof value !== "object" || value === null) return false;
  const details = value as Record<string, unknown>;
  return (
    typeof details.sender === "string" &&
    typeof details.name === "string" &&
    typeof details.address === "string" &&
    typeof details.success === "boolean"
  );
};

// Contract deployment types
export interface DeploymentDetails {
  sender: string;
  name: ContractName;
  address: string;
  success: boolean;
  type?: DaoContractType;
  txId?: string;
}

// Create a type-safe mapping function
export function createContractMapping<T>(
  contracts: Record<string, T>,
  validator: (value: unknown) => value is T
): Record<string, T> {
  const result: Record<string, T> = {};

  for (const [type, value] of Object.entries(contracts)) {
    if (isContractType(type) && validator(value)) {
      const key = createContractKey(type);
      result[key] = value;
    }
  }

  return result;
}

// Specialized mapping functions
export const mapToGeneratedContracts = (
  contracts: Record<string, DaoContractInfo>
): Record<string, DaoContractInfo> => {
  return createContractMapping(contracts, (value): value is DaoContractInfo => {
    return (
      typeof value === "object" &&
      value !== null &&
      "source" in value &&
      "name" in value &&
      "address" in value &&
      "type" in value
    );
  });
};

export const mapToDeployedContracts = (
  contracts: Record<string, DeploymentDetails>
): Record<string, DeploymentDetails> => {
  return createContractMapping(contracts, isDeploymentDetails);
};
