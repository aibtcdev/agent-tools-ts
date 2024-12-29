export enum ContractType {
  TOKEN = 'token',
  POOL = 'pool',
  DEX = 'dex',
  DAO_BASE = 'aibtcdev-base-dao',
  DAO_ACTIONS = 'aibtc-ext001-actions',
  DAO_BANK_ACCOUNT = 'aibtc-ext002-bank-account',
  DAO_DIRECT_EXECUTE = 'aibtc-ext003-direct-execute',
  DAO_MESSAGING = 'aibtc-ext004-messaging',
  DAO_PAYMENTS = 'aibtc-ext005-payments',
  DAO_TREASURY = 'aibtc-ext006-treasury',
  DAO_PROPOSAL_BOOTSTRAP = 'aibtc-prop001-bootstrap',
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
}

export type GeneratedDaoContracts = {
  base: DaoContractInfo;
  treasury: DaoContractInfo;
  payments: DaoContractInfo;
  messaging: DaoContractInfo;
  directExecute: DaoContractInfo;
  bankAccount: DaoContractInfo;
  actions: DaoContractInfo;
  bootstrap: DaoContractInfo;
}
