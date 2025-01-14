import {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  SignedContractDeployOptions,
  PostConditionMode,
  getAddressFromPrivateKey,
} from "@stacks/transactions";
import { ContractType, TraitType } from "../types/dao-types";
import { CONFIG, deriveChildAccount, getNetwork } from "../../utilities";
import { NetworkType } from "../../types";

export class ContractDeployer {
  private network: NetworkType;
  private networkObj: any;

  constructor(network: NetworkType) {
    this.network = network;
    this.networkObj = getNetwork(network);
  }

  async deployContract(
    sourceCode: string,
    contractType: ContractType | TraitType,
    contractName: string,
    nonce?: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const { address, key } = await deriveChildAccount(
        this.network,
        CONFIG.MNEMONIC,
        CONFIG.ACCOUNT_INDEX
      );

      const senderAddress = getAddressFromPrivateKey(
        key,
        this.networkObj.version
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
        fee: BigInt(100_000), // 0.1 STX
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
