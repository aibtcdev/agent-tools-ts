export enum ContractType {
  // deployed before dao
  DAO_TOKEN = "aibtc-token",
  DAO_BITFLOW_POOL = "aibtc-bitflow-pool",
  DAO_TOKEN_DEX = "aibtc-token-dex",
  // base dao
  DAO_BASE = "aibtcdev-base-dao",
  // dao extensions
  DAO_ACTION_PROPOSALS = "aibtc-action-proposals",
  DAO_ACTION_PROPOSALS_V2 = "aibtc-action-proposals-v2",
  DAO_BANK_ACCOUNT = "aibtc-bank-account",
  DAO_CORE_PROPOSALS = "aibtc-core-proposals",
  DAO_CORE_PROPOSALS_V2 = "aibtc-core-proposals-v2",
  DAO_CHARTER = "aibtc-dao-charter",
  DAO_MESSAGING = "aibtc-onchain-messaging",
  DAO_PAYMENTS = "aibtc-payments-invoices",
  DAO_TOKEN_OWNER = "aibtc-token-owner",
  DAO_TREASURY = "aibtc-treasury",
}

export enum ContractActionType {
  // dao extension actions
  DAO_ACTION_ADD_RESOURCE = "aibtc-action-add-resource",
  DAO_ACTION_ALLOW_ASSET = "aibtc-action-allow-asset",
  DAO_ACTION_SEND_MESSAGE = "aibtc-action-send-message",
  DAO_ACTION_SET_ACCOUNT_HOLDER = "aibtc-action-set-account-holder",
  DAO_ACTION_SET_WITHDRAWAL_AMOUNT = "aibtc-action-set-withdrawal-amount",
  DAO_ACTION_SET_WITHDRAWAL_PERIOD = "aibtc-action-set-withdrawal-period",
  DAO_ACTION_TOGGLE_RESOURCE = "aibtc-action-toggle-resource",
}

export enum ContractProposalType {
  // dao proposal templates
  DAO_BASE_BOOTSTRAP_INITIALIZATION = "aibtc-base-bootstrap-initialization",
  DAO_BASE_BOOTSTRAP_INITIALIZATION_V2 = "aibtc-base-bootstrap-initialization-v2",
}

type ContractExtensionNames = {
  [key in ContractType]: string;
};

type ContractActionNames = {
  [key in ContractActionType]: string;
};

type ContractProposalNames = {
  [key in ContractProposalType]: string;
};

export type ContractNames = ContractExtensionNames &
  ContractActionNames &
  ContractProposalNames;

// Create a mapping of contract types to their record keys
export const CONTRACT_KEYS = {
  [ContractType.DAO_BASE]: "base-dao",
  [ContractType.DAO_ACTION_PROPOSALS]: "action-proposals",
  [ContractType.DAO_BANK_ACCOUNT]: "bank-account",
  [ContractType.DAO_CORE_PROPOSALS]: "core-proposals",
  [ContractType.DAO_CHARTER]: "dao-charter",
  [ContractType.DAO_MESSAGING]: "onchain-messaging",
  [ContractType.DAO_PAYMENTS]: "payments-invoices",
  [ContractType.DAO_TOKEN_OWNER]: "token-owner",
  [ContractType.DAO_TREASURY]: "treasury",
  // action types
  [ContractActionType.DAO_ACTION_ADD_RESOURCE]: "action-add-resource",
  [ContractActionType.DAO_ACTION_ALLOW_ASSET]: "action-allow-asset",
  [ContractActionType.DAO_ACTION_SEND_MESSAGE]: "action-send-message",
  [ContractActionType.DAO_ACTION_SET_ACCOUNT_HOLDER]:
    "action-set-account-holder",
  [ContractActionType.DAO_ACTION_SET_WITHDRAWAL_AMOUNT]:
    "action-set-withdrawal-amount",
  [ContractActionType.DAO_ACTION_SET_WITHDRAWAL_PERIOD]:
    "action-set-withdrawal-period",
  [ContractActionType.DAO_ACTION_TOGGLE_RESOURCE]: "action-toggle-resource",
  // proposal types
  [ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION]:
    "base-bootstrap-initialization",
} as const;

// Create a type from the values
type ContractKey = (typeof CONTRACT_KEYS)[keyof typeof CONTRACT_KEYS];

export enum TraitType {
  POOL = "xyk-pool-trait-v-1-2",
  DAO_BASE = "aibtcdev-dao-v1",
  DAO_TRAITS = "aibtcdev-dao-traits-v1",
  // TODO: DAO_TRAITS_V1_1 = "aibtcdev-dao-traits-v1-1",
  // TODO: FAKTORY_TRAIT_V1 = "faktory-dex-trait-v1-1",
  SIP09 = "nft-trait",
  SIP10 = "sip-010-trait-ft-standard",
}

export type TraitNames = {
  [key in TraitType]: string;
};

export type DeploymentResult = {
  success: boolean;
  contracts: {
    [key: string]: any;
  };
  error?: {
    stage?: string;
    message?: string;
    reason?: string | null;
    details?: any;
  };
};

// created per contract at generate step
export type DaoContractInfo = {
  source: string;
  name: string;
  address: string;
  type: ContractType | ContractActionType | ContractProposalType;
};

// tracks all generated contracts
export type GeneratedDaoContracts = {
  [K in ContractKey]: DaoContractInfo;
};

// created per contract at deployment step
export type DeploymentDetails = {
  sender: string;
  name: string;
  address: string;
  success: boolean;
  type?: ContractType | ContractActionType | ContractProposalType;
  txId?: string;
};

// tracks all deployed contracts
export type DeployedDaoContracts = {
  [K in ContractKey]: DeploymentDetails;
};

// maps contract types to their respective contract keys
export function mapToGeneratedDaoContracts(
  contracts: Record<string, DaoContractInfo>
): GeneratedDaoContracts {
  return Object.entries(CONTRACT_KEYS).reduce((acc, [type, key]) => {
    acc[key as ContractKey] = contracts[type];
    return acc;
  }, {} as GeneratedDaoContracts);
}

export function mapToDeployedDaoContracts(
  records: Record<string, DeploymentDetails>
): DeployedDaoContracts {
  return Object.entries(CONTRACT_KEYS).reduce((acc, [type, key]) => {
    acc[key as ContractKey] = records[type];
    return acc;
  }, {} as DeployedDaoContracts);
}
