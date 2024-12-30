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
  stringUtf8CV,
  noneCV,
  someCV,
  bufferCV,
} from "@stacks/transactions";
import { generateContract } from "../templates/payments";

export interface PaymentsDeployOptions extends DeployOptions {
  daoContractId: string;
}

export class Payments extends BaseComponent {
  constructor(config: BaseConfig) {
    super(config);
  }

  async findAll(options: SearchOptions = {}): Promise<string[]> {
    return this.findContractsByTrait(DAO_TRAITS.RESOURCE_MANAGEMENT, options);
  }

  /**
   * Generate using API-generated contract
   */
  async generate(options: PaymentsDeployOptions) {
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
    options: PaymentsDeployOptions &
      Pick<ContractDeployOptions, "senderKey" | "fee" | "nonce">
  ): Promise<any> {
    const { contract: codeBody } = await this.generate(options);

    return this.makeContractDeploy({
      contractName: `aibtcdev-payments-${Date.now()}`,
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

  async setPaymentAddress(
    paymentsId: string,
    oldAddress: string,
    newAddress: string,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = paymentsId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "set-payment-address",
      functionArgs: [principalCV(oldAddress), principalCV(newAddress)],
    } as TransactionOptions);
  }

  async addResource(
    paymentsId: string,
    name: string,
    description: string,
    price: number,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = paymentsId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "add-resource",
      functionArgs: [
        stringUtf8CV(name),
        stringUtf8CV(description),
        uintCV(price),
      ],
    } as TransactionOptions);
  }

  async toggleResource(
    paymentsId: string,
    resourceIndex: number,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = paymentsId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "toggle-resource",
      functionArgs: [uintCV(resourceIndex)],
    } as TransactionOptions);
  }

  async toggleResourceByName(
    paymentsId: string,
    resourceName: string,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = paymentsId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "toggle-resource-by-name",
      functionArgs: [stringUtf8CV(resourceName)],
    } as TransactionOptions);
  }

  async payInvoice(
    paymentsId: string,
    resourceIndex: number,
    memo?: Buffer,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = paymentsId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "pay-invoice",
      functionArgs: [
        uintCV(resourceIndex),
        memo ? someCV(bufferCV(memo)) : noneCV(),
      ],
    } as TransactionOptions);
  }

  async payInvoiceByResourceName(
    paymentsId: string,
    resourceName: string,
    memo?: Buffer,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = paymentsId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "pay-invoice-by-resource-name",
      functionArgs: [
        stringUtf8CV(resourceName),
        memo ? someCV(bufferCV(memo)) : noneCV(),
      ],
    } as TransactionOptions);
  }

  async getResource(
    paymentsId: string,
    resourceIndex: number,
    senderAddress?: string
  ): Promise<any> {
    const [contractAddress, contractName] = paymentsId.split(".");

    const result: any = await this.callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-resource",
      functionArgs: [uintCV(resourceIndex)],
      senderAddress,
    });

    return result.value;
  }

  async getResourceByName(
    paymentsId: string,
    name: string,
    senderAddress?: string
  ): Promise<any> {
    const [contractAddress, contractName] = paymentsId.split(".");

    const result: any = await this.callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-resource-by-name",
      functionArgs: [stringUtf8CV(name)],
      senderAddress,
    });

    return result.value;
  }

  async getPaymentAddress(
    paymentsId: string,
    senderAddress?: string
  ): Promise<string> {
    const [contractAddress, contractName] = paymentsId.split(".");

    const result: any = await this.callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-payment-address",
      functionArgs: [],
      senderAddress,
    });

    return result.value;
  }

  async getTotalRevenue(
    paymentsId: string,
    senderAddress?: string
  ): Promise<number> {
    const [contractAddress, contractName] = paymentsId.split(".");

    const result: any = await this.callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-total-revenue",
      functionArgs: [],
      senderAddress,
    });

    return Number(result.value);
  }
}
