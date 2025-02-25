import {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  SignedContractDeployOptions,
  PostConditionMode,
} from "@stacks/transactions";
import {
  ContractActionType,
  ContractProposalType,
  ContractType,
  DeploymentDetails,
  TraitType,
} from "../types/dao-types";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
} from "../../utilities";
import { NetworkType } from "../../types";
import { CONTRACT_DEPLOY_FEE } from "../utils/contract-utils";

export class ContractDeployer {
  private network: NetworkType;
  private networkObj: any;

  constructor(network: NetworkType) {
    this.network = network;
    this.networkObj = getNetwork(network);
  }

  // TODO: migrate all over to this format
  // after using this function return with ToolResponse
  async deployContractV2(
    sourceCode: string,
    contractName: string,
    nonce?: number,
    contractType?: ContractType | ContractActionType | ContractProposalType
  ): Promise<DeploymentDetails> {
    return new Promise(async (resolve, reject) => {
      try {
        const { address, key } = await deriveChildAccount(
          this.network,
          CONFIG.MNEMONIC,
          CONFIG.ACCOUNT_INDEX
        );

        const deployOptions: SignedContractDeployOptions = {
          senderKey: key,
          contractName,
          codeBody: sourceCode,
          clarityVersion: 2,
          network: this.networkObj,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow,
          nonce: nonce,
          fee: BigInt(CONTRACT_DEPLOY_FEE),
        };

        const transaction = await makeContractDeploy(deployOptions);
        const broadcastResponse = await broadcastTransaction(
          transaction,
          this.network
        );

        // throw error if broadcast response has error property
        if ("error" in broadcastResponse) {
          let errorMessage = `Failed to broadcast transaction: ${broadcastResponse.error}`;
          if (broadcastResponse.reason_data) {
            if ("message" in broadcastResponse.reason_data) {
              errorMessage += ` - Reason: ${broadcastResponse.reason_data.message}`;
            }
            if ("expected" in broadcastResponse.reason_data) {
              errorMessage += ` - Expected: ${broadcastResponse.reason_data.expected}, Actual: ${broadcastResponse.reason_data.actual}`;
            }
          }
          throw new Error(errorMessage);
        }

        const deploymentDetails: DeploymentDetails = {
          sender: address,
          name: contractName,
          address: address,
          type: contractType,
          success: true,
          txId: broadcastResponse.txid,
        };
        resolve(deploymentDetails);
      } catch (error) {
        reject(createErrorResponse(error));
      }
    });
  }

  async deployContract(
    sourceCode: string,
    contractType:
      | ContractType
      | ContractActionType
      | ContractProposalType
      | TraitType,
    contractName: string,
    nonce?: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const { address, key } = await deriveChildAccount(
        this.network,
        CONFIG.MNEMONIC,
        CONFIG.ACCOUNT_INDEX
      );

      const deployOptions: SignedContractDeployOptions = {
        senderKey: key,
        contractName,
        codeBody: sourceCode,
        clarityVersion: 2,
        network: this.networkObj,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        nonce: nonce !== undefined ? nonce : undefined,
        fee: BigInt(500_000), // 0.5 STX
      };

      const transaction = await makeContractDeploy(deployOptions);
      const broadcastResponse = await broadcastTransaction(
        transaction,
        this.networkObj
      );

      return {
        success: true,
        data: {
          contractPrincipal: `${address}.${contractName}`,
          transactionId: `0x${broadcastResponse.txid}`,
          sender: address,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          reason: error.reason,
          details: error,
        },
      };
    }
  }
}
