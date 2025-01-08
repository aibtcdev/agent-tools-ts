export enum ContractType {
  DAO_TOKEN = "aibtc-token",
  DAO_BITFLOW_POOL = "aibtc-bitflow-pool",
  DAO_TOKEN_DEX = "aibtc-token-dex",
  DAO_BASE = "aibtcdev-base-dao",
  DAO_ACTION_PROPOSALS = "aibtc-action-proposals",
  DAO_BANK_ACCOUNT = "aibtc-bank-account",
  DAO_CORE_PROPOSALS = "aibtc-core-proposals",
  DAO_MESSAGING = "aibtc-onchain-messaging",
  DAO_PAYMENTS = "aibtc-payments-invoices",
  DAO_TREASURY = "aibtc-treasury",
  DAO_PROPOSAL_BOOTSTRAP = "aibtc-base-bootstrap-initialization",
}

export type ContractNames = {
  [key in ContractType]: string;
};

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
  type: ContractType;
};

export type GeneratedDaoContracts = {
  base: DaoContractInfo;
  treasury: DaoContractInfo;
  payments: DaoContractInfo;
  messaging: DaoContractInfo;
  directExecute: DaoContractInfo;
  bankAccount: DaoContractInfo;
  actions: DaoContractInfo;
  bootstrap: DaoContractInfo;
};
