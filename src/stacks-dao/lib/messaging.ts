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
import { stringAsciiCV, noneCV, someCV, bufferCV } from "@stacks/transactions";
import { generateContract } from "../templates/messaging";

export interface MessagingDeployOptions extends DeployOptions {}

export class Messaging extends BaseComponent {
  constructor(config: BaseConfig) {
    super(config);
  }

  async findAll(options: SearchOptions = {}): Promise<string[]> {
    return this.findContractsByTrait(DAO_TRAITS.MESSAGING, options);
  }

  /**
   * Generate using API-generated contract
   */
  async generate(options: MessagingDeployOptions) {
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
    options: MessagingDeployOptions &
      Pick<ContractDeployOptions, "senderKey" | "fee" | "nonce">
  ): Promise<any> {
    const { contract: codeBody } = await this.generate(options);

    return this.makeContractDeploy({
      contractName: `${options.name}-messaging`,
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

  async send(
    messagingId: string,
    message: string,
    opcode?: Buffer,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = messagingId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "send",
      functionArgs: [
        stringAsciiCV(message),
        opcode ? someCV(bufferCV(opcode)) : noneCV(),
      ],
    } as TransactionOptions);
  }
}
