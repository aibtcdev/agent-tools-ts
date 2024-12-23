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
  stringAsciiCV,
  trueCV,
  falseCV,
  principalCV,
} from "@stacks/transactions";
import { generateContract } from "../templates/executor";

export interface ExecutorDeployOptions extends DeployOptions {
  extensions?: string[];
  includeDeployer?: boolean;
}

export class Executor extends BaseComponent {
  constructor(config: BaseConfig) {
    super(config);
  }

  async findAll(options: SearchOptions = {}): Promise<string[]> {
    return this.findContractsByTrait(DAO_TRAITS.EXECUTOR, options);
  }

  /**
   * Generate contract using template
   */
  async generate(options: ExecutorDeployOptions) {
    // Validate extensions format
    const name = options.name;
    const extensions = options.extensions || [];
    const invalidExtensions = extensions.filter(
      (ext) => ext && ext.trim() && !ext.trim().startsWith("S")
    );
    if (invalidExtensions.length > 0) {
      throw new Error(
        "Invalid extension format. All extension contracts must start with S"
      );
    }

    // Generate contract using template
    const contract = generateContract({
      name,
      extensions,
      includeDeployer: options.includeDeployer !== false,
      network: this.config.network,
    });

    return { contract };
  }

  /**
   * Deploy directly using Stacks transactions
   */
  async deploy(
    options: ExecutorDeployOptions &
      Pick<ContractDeployOptions, "senderKey" | "fee" | "nonce">
  ): Promise<any> {
    // First get the contract code from the API
    const { contract: codeBody } = await this.generate(options);

    // Then deploy it directly using makeContractDeploy
    return this.makeContractDeploy({
      contractName: `${options.name}-executor`,
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
