import {
  PostCondition,
  PostConditionMode,
  AnchorMode,
} from "@stacks/transactions";

export interface SDKOptions {
  baseUrl?: string;
  stacksApi?: string;
  network?: "mainnet" | "testnet";
  mnemonic?: string;
  accountIndex?: number;
}

export interface BaseConfig
  extends Required<Pick<SDKOptions, "baseUrl" | "stacksApi" | "network">> {}

export interface ContractDeployOptions {
  contractName: string;
  codeBody: string;
  senderKey: string;
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
  senderKey: string;
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
  name: string;
  codeBody?: string;
  contractName?: string;
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

// Base deployment options
export interface DeployOptions {
  name: string;
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
