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
  contractPrincipalCV,
  PostConditionMode,
  Pc,
} from "@stacks/transactions";
import { generateContract } from "../templates/treasury";

export interface TreasuryDeployOptions extends DeployOptions {
  daoContractId: string;
}

export class Treasury extends BaseComponent {
  constructor(config: BaseConfig) {
    super(config);
  }

  async findAll(options: SearchOptions = {}): Promise<string[]> {
    return this.findContractsByTrait(DAO_TRAITS.TREASURY, options);
  }

  /**
   * Generate using API-generated contract
   */
  async generate(options: TreasuryDeployOptions) {
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
    options: TreasuryDeployOptions &
      Pick<ContractDeployOptions, "senderKey" | "fee" | "nonce">
  ): Promise<any> {
    const { contract: codeBody } = await this.generate(options);

    return this.makeContractDeploy({
      contractName: `${options.name}-treasury`,
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

  async depositStx(
    treasuryId: string,
    amount: number,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = treasuryId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "deposit-stx",
      functionArgs: [uintCV(amount)],
      postConditionMode: PostConditionMode.Allow,
    } as TransactionOptions);
  }

  async withdrawStx(
    treasuryId: string,
    amount: number,
    recipient: string,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = treasuryId.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "withdraw-stx",
      functionArgs: [uintCV(amount), principalCV(recipient)],
      postConditionMode: PostConditionMode.Allow,
    } as TransactionOptions);
  }

  async depositFt(
    treasuryId: string,
    ftContract: string,
    amount: number,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = treasuryId.split(".");
    const [ftAddress, ftName] = ftContract.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "deposit-ft",
      functionArgs: [contractPrincipalCV(ftAddress, ftName), uintCV(amount)],
    } as TransactionOptions);
  }

  async withdrawFt(
    treasuryId: string,
    ftContract: string,
    amount: number,
    recipient: string,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = treasuryId.split(".");
    const [ftAddress, ftName] = ftContract.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "withdraw-ft",
      functionArgs: [
        contractPrincipalCV(ftAddress, ftName),
        uintCV(amount),
        principalCV(recipient),
      ],
    } as TransactionOptions);
  }

  async depositNft(
    treasuryId: string,
    nftContract: string,
    tokenId: number,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = treasuryId.split(".");
    const [nftAddress, nftName] = nftContract.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "deposit-nft",
      functionArgs: [contractPrincipalCV(nftAddress, nftName), uintCV(tokenId)],
    } as TransactionOptions);
  }

  async withdrawNft(
    treasuryId: string,
    nftContract: string,
    tokenId: number,
    recipient: string,
    txOptions: Partial<TransactionOptions> = {}
  ): Promise<any> {
    const [contractAddress, contractName] = treasuryId.split(".");
    const [nftAddress, nftName] = nftContract.split(".");

    return this.makeContractCall({
      ...txOptions,
      contractAddress,
      contractName,
      functionName: "withdraw-nft",
      functionArgs: [
        contractPrincipalCV(nftAddress, nftName),
        uintCV(tokenId),
        principalCV(recipient),
      ],
    } as TransactionOptions);
  }
}
