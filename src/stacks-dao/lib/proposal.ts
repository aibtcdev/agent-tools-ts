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
import { principalCV } from "@stacks/transactions";
import { generateAddExtension } from "../templates/proposals/add-extension";

export type ProposalType = "add-extension" | "set-deployer";

export interface ProposalConfig {
  type: ProposalType;
  executorId: string;
  extensionId?: string;
}

export interface ProposalDeployOptions extends DeployOptions {
  proposalConfig: ProposalConfig;
}

export class Proposal extends BaseComponent {
  constructor(config: BaseConfig) {
    super(config);
  }

  async findAll(options: SearchOptions = {}): Promise<string[]> {
    return this.findContractsByTrait(DAO_TRAITS.PROPOSAL, options);
  }

  /**
   * Generate contract using appropriate template
   */
  async generate(options: ProposalConfig) {
    const { type, executorId, extensionId } = options;

    switch (type) {
      case "add-extension":
        if (!extensionId) throw new Error("extensionId required");
        return generateAddExtension({
          executorId,
          network: this.config.network,
          extensionId: extensionId,
        });

      default:
        throw new Error(`Unknown proposal type: ${type}`);
    }
  }

  /**
   * Deploy proposal contract
   */
  async deploy(
    options: ProposalDeployOptions &
      Pick<ContractDeployOptions, "senderKey" | "fee" | "nonce">
  ): Promise<ContractResponse> {
    // Generate the contract
    const codeBody = await this.generate(options.proposalConfig);

    // Deploy it
    return this.makeContractDeploy({
      contractName: `${options.proposalConfig.type}-proposal-${Date.now()}`,
      codeBody,
      ...options,
      onFinish: (data) => {
        console.log("Proposal deployment completed:", data);
      },
      onCancel: () => {
        console.log("Proposal deployment cancelled");
      },
    });
  }
}
