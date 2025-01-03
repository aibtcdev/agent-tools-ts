import {
  PostCondition,
  PostConditionMode,
  AnchorMode,
} from "@stacks/transactions";

// Base SDK options & configuration types
export interface SDKOptions {
  stacksApi?: string;
  network?: "mainnet" | "testnet";
  mnemonic?: string;
  accountIndex?: number;
}

export interface BaseConfig
  extends Required<Pick<SDKOptions, "stacksApi" | "network">> {}

// Extended DAO type for UI representation
export interface ExtendedDAO {
  id: string; // Contract ID
  name: string;
  created_at: string;
  is_public: boolean;
  status: "active" | "paused" | "configuring";
  type: "trading" | "arbitrage" | "yield" | "monitoring";
  treasury: number;
  agents: number;
  last_active: string;
  description: string;
}

// Partial types for async loading
export interface DAOBasicInfo {
  id: string;
  name: string;
  // status: ExtendedDAO["status"];
  // type: ExtendedDAO["type"];
  // is_public: boolean;
  // created_at: string;
}

export interface DAOTreasuryInfo {
  stx: number;
  tokens: Array<{
    ticker: string;
    amount: number;
  }>;
}

export interface DAOActivityInfo {
  last_active: string;
  agents: number;
}

export interface ContractDeployOptions {
  contractName: string;
  codeBody: string;
  senderKey?: string;
  anchorMode?: AnchorMode;
  postConditionMode?: PostConditionMode;
  postConditions?: PostCondition[];
  fee?: number;
  nonce?: number;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export interface TransactionOptions {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: any[];
  senderKey?: string;
  anchorMode?: AnchorMode;
  postConditionMode?: PostConditionMode;
  postConditions?: PostCondition[];
  fee?: number;
  nonce?: number;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export interface ReadOnlyOptions {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: any[];
  senderAddress?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
}

// DAO specific types
export interface DeployOptions {
  codeBody?: string;
}

export interface ContractResponse {
  contract: string;
  metadata: Record<string, any>;
}

// Common options
export interface SearchOptions {
  limit?: number;
  offset?: number;
}

// Trait interfaces
export interface TraitAbiFunction {
  args: {
    name: string;
    type: string | { optional?: { buffer?: { length: number } } };
  }[];
  name: string;
  access: "public" | "read_only";
  outputs?: {
    type: any;
  };
}

export interface TraitAbi {
  maps: any[];
  epoch: string;
  functions: TraitAbiFunction[];
  variables: any[];
  clarity_version: string;
  fungible_tokens: any[];
  non_fungible_tokens: any[];
}

// Component-specific interfaces
export interface ExecutorDeployOptions extends DeployOptions {
  extensions?: string[];
  includeDeployer?: boolean;
}

export interface TreasuryDeployOptions extends DeployOptions {
  daoContractId: string;
  extensionTraitContractId: string;
  sip009TraitContractId: string;
  sip010TraitContractId: string;
}

export interface BankAccountDeployOptions extends DeployOptions {
  daoContractId: string;
  extensionTraitContractId: string;
  defaultWithdrawalPeriod?: number;
  defaultWithdrawalAmount?: number;
  initialAccountHolder?: string;
}

export interface MessagingDeployOptions extends DeployOptions {
  extensionTraitContractId: string;
}

export interface PaymentsDeployOptions extends DeployOptions {
  daoContractId: string;
  extensionTraitContractId: string;
  paymentTraitsContractId: string;
}

// Response types
export interface AccountTerms {
  accountHolder: string;
  lastWithdrawalBlock: number;
  withdrawalAmount: number;
  withdrawalPeriod: number;
}

export interface ResourceData {
  name: string;
  description: string;
  price: number;
  enabled: boolean;
  createdAt: number;
  totalSpent: number;
  totalUsed: number;
}

export interface ContractInfo {
  contractId: string;
  sourcecode: string;
  abi: any;
}
