export enum ContractType {
  // deployed before dao
  DAO_TOKEN = "aibtc-token",
  DAO_TOKEN_FAKTORY = "aibtc-token-faktory",
  DAO_BITFLOW_POOL = "aibtc-bitflow-pool",
  DAO_TOKEN_DEX = "aibtc-token-dex",
  DAO_TOKEN_DEX_FAKTORY = "aibtc-token-faktory-dex",
  // base dao
  DAO_BASE = "aibtcdev-base-dao",
  // dao extensions
  DAO_ACTION_PROPOSALS = "aibtc-action-proposals",
  DAO_BANK_ACCOUNT = "aibtc-bank-account",
  DAO_CORE_PROPOSALS = "aibtc-core-proposals",
  DAO_MESSAGING = "aibtc-onchain-messaging",
  DAO_PAYMENTS = "aibtc-payments-invoices",
  DAO_TOKEN_OWNER = "aibtc-token-owner",
  DAO_TREASURY = "aibtc-treasury",
  // dao proposals
  DAO_PROPOSAL_BOOTSTRAP = "aibtc-base-bootstrap-initialization",
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

type ContractExtensionNames = {
  [key in ContractType]: string;
};

type ContractActionNames = {
  [key in ContractActionType]: string;
};

export type ContractNames = ContractExtensionNames & ContractActionNames;

export enum TraitType {
  POOL = "xyk-pool-trait-v-1-2",
  DAO_BASE = "aibtcdev-dao-v1",
  DAO_TRAITS = "aibtcdev-dao-traits-v1",
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

export type DaoContractInfo = {
  source: string;
  name: string;
  address: string;
  type: ContractType | ContractActionType;
};

export type GeneratedDaoContracts = GeneratedDaoBaseContract &
  GeneratedDaoExtensionContracts &
  GeneratedDaoActionExtensionContracts &
  GeneratedDaoProposalContracts;

type GeneratedDaoBaseContract = {
  "base-dao": DaoContractInfo;
};

type GeneratedDaoExtensionContracts = {
  "action-proposals": DaoContractInfo;
  "bank-account": DaoContractInfo;
  "core-proposals": DaoContractInfo;
  "onchain-messaging": DaoContractInfo;
  "payments-invoices": DaoContractInfo;
  "token-owner": DaoContractInfo;
  treasury: DaoContractInfo;
};

type GeneratedDaoActionExtensionContracts = {
  "action-add-resource": DaoContractInfo;
  "action-allow-asset": DaoContractInfo;
  "action-send-message": DaoContractInfo;
  "action-set-account-holder": DaoContractInfo;
  "action-set-withdrawal-amount": DaoContractInfo;
  "action-set-withdrawal-period": DaoContractInfo;
  "action-toggle-resource": DaoContractInfo;
};

type GeneratedDaoProposalContracts = {
  "base-bootstrap-initialization": DaoContractInfo;
};
