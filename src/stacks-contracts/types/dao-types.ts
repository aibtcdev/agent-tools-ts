export enum ContractType {
  TOKEN,
  POOL,
  DEX,
  DAO_BASE,
  DAO_ACTIONS,
  DAO_BANK_ACCOUNT,
  DAO_DIRECT_EXECUTE,
  DAO_MESSAGING,
  DAO_PAYMENTS,
  DAO_TREASURY,
  DAO_PROPOSAL_BOOTSTRAP,
}

export type ContractNames = {
  [key in ContractType]: string;
};

export enum TraitType {
  DAO_TRAITS = "aibtcdev-dao-traits-v1",
  DAO_BASE = "aibtcdev-dao-v1",
  POOL = "xyk-pool-trait-v-1-2",
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
