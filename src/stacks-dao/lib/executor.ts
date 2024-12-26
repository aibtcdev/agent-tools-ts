import { BaseComponent } from "./base";
import { DAO_TRAITS } from "./traits";
import type {
  BaseConfig,
  DeployOptions,
  SearchOptions,
  TransactionOptions,
  ContractDeployOptions,
} from "../types";
import { trueCV, falseCV, principalCV } from "@stacks/transactions";
import { generateContract } from "../templates/executor";

export class Executor extends BaseComponent {
  constructor(config: BaseConfig) {
    super(config);
  }

  async findAll(options: SearchOptions = {}): Promise<string[]> {
    return this.findContractsByTrait(DAO_TRAITS.EXECUTOR, options);
  }

  async getMission(executorId: string): Promise<string> {
    const [contractAddress, contractName] = executorId.split(".");

    const result: any = await this.callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-mission",
      functionArgs: [],
    });

    return result.value;
  }

  async listExtensions(executorId: string, limit = 20, offset = 0) {
    return this.getContractEvents(executorId, limit, offset);
  }

  /**
   * Generate contract using template
   */
  async generate(options: any) {
    // Validate extensions format
    const mission = options.mission;

    // Generate contract using template
    const contract = generateContract({
      mission,
      network: this.config.network,
    });

    return { contract };
  }

  /**
   * Deploy directly using Stacks transactions
   */
  async deploy(options: any) {
    // First get the contract code from the API
    const { contract: codeBody } = await this.generate(options);

    // Then deploy it directly using makeContractDeploy
    return this.makeContractDeploy({
      contractName: `aibtcdev-executor-${Date.now()}`,
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

  async construct(
    executorId: string,
    proposalId: string,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = executorId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "construct",
      functionArgs: [principalCV(proposalId)],
    } as TransactionOptions);
  }

  async executeProposal(
    executorId: string,
    proposalId: string,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = executorId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "execute",
      functionArgs: [principalCV(proposalId)],
    } as TransactionOptions);
  }

  async setExtension(
    executorId: string,
    extensionId: string,
    enabled: boolean,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = executorId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "set-extension",
      functionArgs: [principalCV(extensionId), enabled ? trueCV() : falseCV()],
    } as TransactionOptions);
  }

  async isExtension(
    executorId: string,
    extensionId: string,
    senderAddress?: string
  ): Promise<boolean> {
    const [contractAddress, contractName] = executorId.split(".");

    const result: any = await this.callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "is-extension",
      functionArgs: [principalCV(extensionId)],
      senderAddress,
    });

    return result.value;
  }
}
