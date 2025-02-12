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
  DeploymentResponse,
  TraitType,
} from "../types/dao-types";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  ToolResponse,
} from "../../utilities";
import { NetworkType } from "../../types";

export class ContractDeployer {
  private network: NetworkType;
  private networkObj: any;

  constructor(network: NetworkType) {
    this.network = network;
    this.networkObj = getNetwork(network);
  }

  async deployContractV2(
    sourceCode: string,
    contractName: string,
    nonce?: number
  ): Promise<ToolResponse<DeploymentResponse>> {
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
          fee: BigInt(500_000), // 0.5 STX
        };

        const transaction = await makeContractDeploy(deployOptions);

        const broadcastResponse = await broadcastTransaction(
          transaction,
          this.network
        );
        // check that error property is not present
        // (since we can't instanceof the union type)
        if (!("error" in broadcastResponse)) {
          const response: ToolResponse<DeploymentResponse> = {
            success: true,
            message: `Transaction broadcasted successfully: 0x${broadcastResponse.txid}`,
            data: {
              contractPrincipal: `${address}.${contractName}`,
              txId: `0x${broadcastResponse.txid}`,
              sender: address,
            },
          };
          resolve(response);
        } else {
          // create error message from broadcast response
          let errorMessage = `Failed to broadcast transaction: ${broadcastResponse.error}`;
          if (broadcastResponse.reason_data) {
            if ("message" in broadcastResponse.reason_data) {
              errorMessage += ` - Reason: ${broadcastResponse.reason_data.message}`;
            }
            if ("expected" in broadcastResponse.reason_data) {
              errorMessage += ` - Expected: ${broadcastResponse.reason_data.expected}, Actual: ${broadcastResponse.reason_data.actual}`;
            }
          }
          // create response object
          const response: ToolResponse<DeploymentResponse> = {
            success: false,
            message: errorMessage,
            data: {
              contractPrincipal: `${address}.${contractName}`,
              txId: undefined,
              sender: address,
            },
          };
          resolve(response);
        }
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
