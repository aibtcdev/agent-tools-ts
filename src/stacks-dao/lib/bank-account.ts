import { BaseComponent } from "./base";
import { DAO_TRAITS } from "./traits";
import type {
  BaseConfig,
  DeployOptions,
  ContractResponse,
  SearchOptions,
  TransactionOptions,
  ContractDeployOptions,
} from "../types";
import {
  principalCV,
  uintCV,
  noneCV,
  someCV,
  bufferCV,
} from "@stacks/transactions";
import { generateContract } from "../templates/bank-account";

export interface BankAccountDeployOptions extends DeployOptions {
  daoContractId: string;
  defaultWithdrawalPeriod?: number;
  defaultWithdrawalAmount?: number;
}

export class BankAccount extends BaseComponent {
  constructor(config: BaseConfig) {
    super(config);
  }

  async findAll(options: SearchOptions = {}): Promise<string[]> {
    return this.findContractsByTrait(DAO_TRAITS.BANK_ACCOUNT, options);
  }

  /**
   * Generate using API-generated contract
   */
  async generate(options: BankAccountDeployOptions) {
    // Generate contract using template
    const contract = generateContract({
      ...options,
      network: this.config.network,
    });
    return { contract };
  }

  /**
   * Deploy directly using Stacks transactions
   */
  async deploy(
    options: BankAccountDeployOptions &
      Pick<ContractDeployOptions, "senderKey" | "fee" | "nonce">
  ): Promise<any> {
    const { contract: codeBody } = await this.generate(options);

    return this.makeContractDeploy({
      contractName: `${options.name}-bank-account`,
      codeBody,
      ...options,
      onFinish: (data) => {
        console.log("Contract deployment completed:", data);
      },
      onCancel: () => {
        console.log("Contract deployment cancelled");
      },
    });
  }

  async updateTerms(
    accountId: string,
    options: {
      accountHolder?: string;
      withdrawalPeriod?: number;
      withdrawalAmount?: number;
      lastWithdrawalBlock?: number;
      opcode?: Buffer;
    },
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = accountId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "update-terms",
      functionArgs: [
        options.accountHolder
          ? someCV(principalCV(options.accountHolder))
          : noneCV(),
        options.withdrawalPeriod
          ? someCV(uintCV(options.withdrawalPeriod))
          : noneCV(),
        options.withdrawalAmount
          ? someCV(uintCV(options.withdrawalAmount))
          : noneCV(),
        options.lastWithdrawalBlock
          ? someCV(uintCV(options.lastWithdrawalBlock))
          : noneCV(),
        options.opcode ? someCV(bufferCV(options.opcode)) : noneCV(),
      ],
    } as TransactionOptions);
  }

  async depositStx(
    accountId: string,
    amount: number,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = accountId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "deposit-stx",
      functionArgs: [uintCV(amount)],
    } as TransactionOptions);
  }

  async withdrawStx(
    accountId: string,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = accountId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "withdraw-stx",
      functionArgs: [],
    } as TransactionOptions);
  }

  async getBalance(accountId: string, senderAddress?: string): Promise<number> {
    const [contractAddress, contractName] = accountId.split(".");

    const result: any = await this.callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-account-balance",
      functionArgs: [],
      senderAddress,
    });

    return Number(result.value);
  }

  async getTerms(accountId: string, senderAddress?: string): Promise<any> {
    const [contractAddress, contractName] = accountId.split(".");

    const result: any = await this.callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-terms",
      functionArgs: [],
      senderAddress,
    });

    return result.value;
  }
}
