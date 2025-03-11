import { StacksNetworkName } from "@stacks/network";
import {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  ClarityVersion,
} from "@stacks/transactions";
import { getNextNonce } from "../../utilities";
import { GeneratedSmartWallet } from "./smart-wallet-generator";

/**
 * Deployed smart wallet contract information
 */
export interface DeployedSmartWallet extends GeneratedSmartWallet {
  /** The address that deployed the contract */
  sender: string;
  /** Whether the deployment was successful */
  success: boolean;
  /** The transaction ID if the deployment was successful */
  txId?: string;
  /** The fully qualified contract address (sender.contractName) */
  address: string;
  /** Error message if the deployment failed */
  error?: string;
}

/**
 * Smart wallet deployment service
 */
export class SmartWalletDeployer {
  private network: StacksNetworkName;
  private senderAddress: string;
  private senderKey: string;

  /**
   * Create a new SmartWalletDeployer instance
   *
   * @param network Network to deploy contracts to
   * @param senderAddress Address that will deploy the contracts
   * @param senderKey Private key for the sender address
   */
  constructor(
    network: StacksNetworkName,
    senderAddress: string,
    senderKey: string
  ) {
    this.network = network;
    this.senderAddress = senderAddress;
    this.senderKey = senderKey;
  }

  /**
   * Deploy a generated smart wallet contract
   *
   * @param smartWallet The generated smart wallet to deploy
   * @param nonce Optional nonce to use for the transaction (will be auto-fetched if not provided)
   * @returns Deployed smart wallet information including transaction ID and success status
   */
  async deploySmartWallet(
    smartWallet: GeneratedSmartWallet,
    nonce?: number
  ): Promise<DeployedSmartWallet> {
    try {
      // Create the contract deployment transaction
      const transaction = await makeContractDeploy({
        contractName: smartWallet.name,
        codeBody: smartWallet.source,
        senderKey: this.senderKey,
        nonce: nonce === 0 ? 0 : nonce ? nonce : undefined,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        clarityVersion: ClarityVersion.Clarity3,
      });

      // Broadcast the transaction
      const broadcastResponse = await broadcastTransaction(
        transaction,
        this.network
      );

      if (!broadcastResponse.error) {
        // If successful, return the deployed contract info
        return {
          ...smartWallet,
          sender: this.senderAddress,
          success: true,
          txId: broadcastResponse.txid,
          address: `${this.senderAddress}.${smartWallet.name}`,
        };
      } else {
        // If failed, return error info
        let errorMessage = `Failed to broadcast transaction: ${broadcastResponse.error}`;
        if (broadcastResponse.reason_data) {
          if ("message" in broadcastResponse.reason_data) {
            errorMessage += ` - Reason: ${broadcastResponse.reason_data.message}`;
          }
          if ("expected" in broadcastResponse.reason_data) {
            errorMessage += ` - Expected: ${broadcastResponse.reason_data.expected}, Actual: ${broadcastResponse.reason_data.actual}`;
          }
        }
        console.error(errorMessage);
        return {
          ...smartWallet,
          sender: this.senderAddress,
          success: false,
          address: `${this.senderAddress}.${smartWallet.name}`,
        };
      }
    } catch (error) {
      // Provide more detailed error information
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Failed to deploy smart wallet ${smartWallet.name}:`,
        errorMessage
      );

      // Return failure status with error information
      return {
        ...smartWallet,
        sender: this.senderAddress,
        success: false,
        address: `${this.senderAddress}.${smartWallet.name}`,
        error: errorMessage,
      };
    }
  }

  /**
   * Deploy a smart wallet with automatic nonce management
   *
   * @param smartWallet The generated smart wallet to deploy
   * @returns Deployed smart wallet information
   */
  async deploySmartWalletWithNonce(
    smartWallet: GeneratedSmartWallet
  ): Promise<DeployedSmartWallet> {
    const nonce = await getNextNonce(this.network, this.senderAddress);
    return this.deploySmartWallet(smartWallet, nonce);
  }
}
