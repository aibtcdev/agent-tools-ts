import {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  ClarityVersion,
  Pc,
} from "@stacks/transactions";
import { StacksNetworkName } from "@stacks/network";
import { getNextNonce } from "../../utilities";
import { 
  GeneratedContractRegistryEntry,
  BaseContractRegistryEntry
} from "./dao-contract-registry";
import { ContractCategory, ContractSubCategory } from "../types/dao-types";

/**
 * Deployed contract information with error handling
 */
export type DeployedContract = {
  name: string;
  type: ContractCategory;
  subtype: ContractSubCategory<ContractCategory>;
  deploymentOrder: number;
  clarityVersion?: ClarityVersion;
  source: string;
  hash?: string;
  sender: string;
  success: boolean;
  txId?: string;
  address: string;
  error?: string;
};

/**
 * Contract deployment service
 */
export class DaoContractDeployer {
  private network: StacksNetworkName;
  private senderAddress: string;
  private senderKey: string;

  /**
   * Create a new DaoContractDeployer instance
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
   * Deploy a contract
   *
   * @param contract The contract to deploy
   * @param nonce Optional nonce to use for the transaction (will be auto-fetched if not provided)
   * @returns Deployed contract information including transaction ID and success status
   */
  async deployContract(
    contract: GeneratedContractRegistryEntry,
    nonce?: number
  ): Promise<DeployedContract> {
    try {
      // Create post-condition to ensure no STX transfer
      const postConditions = [
        Pc.principal(this.senderAddress)
          .willSendEq(0)
          .ustx()
      ];

      // Create the contract deployment transaction
      const transaction = await makeContractDeploy({
        contractName: contract.name,
        codeBody: contract.source,
        senderKey: this.senderKey,
        nonce: nonce === 0 ? 0 : nonce ? nonce : undefined,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        postConditions,
        clarityVersion: contract.clarityVersion,
      });

      // Broadcast the transaction
      const broadcastResponse = await broadcastTransaction(
        transaction,
        this.network
      );

      if (!broadcastResponse.error) {
        return {
          ...contract,
          sender: this.senderAddress,
          success: true,
          txId: broadcastResponse.txid,
          address: `${this.senderAddress}.${contract.name}`,
        } as DeployedContract;
      } else {
        let errorMessage = `Failed to broadcast transaction: ${broadcastResponse.error}`;
        if (broadcastResponse.reason_data) {
          if ("message" in broadcastResponse.reason_data) {
            errorMessage += ` - Reason: ${broadcastResponse.reason_data.message}`;
          }
          if ("expected" in broadcastResponse.reason_data) {
            errorMessage += ` - Expected: ${broadcastResponse.reason_data.expected}, Actual: ${broadcastResponse.reason_data.actual}`;
          }
        }
        return {
          ...contract,
          sender: this.senderAddress,
          success: false,
          address: `${this.senderAddress}.${contract.name}`,
          error: errorMessage,
        } as DeployedContract;
      }
    } catch (error) {
      return {
        ...contract,
        sender: this.senderAddress,
        success: false,
        address: `${this.senderAddress}.${contract.name}`,
        error: error instanceof Error ? error.message : String(error),
      } as DeployedContract;
    }
  }

  /**
   * Deploy multiple contracts in sequence
   *
   * @param contracts Array of contracts to deploy
   * @returns Array of deployed contract information
   */
  async deployContracts(
    contracts: GeneratedContractRegistryEntry[]
  ): Promise<DeployedContract[]> {
    const deployedContracts: DeployedContract[] = [];
    let nonce = await getNextNonce(this.network, this.senderAddress);

    for (const contract of contracts) {
      const deployedContract = await this.deployContract(contract, nonce++);
      deployedContracts.push(deployedContract);
      if (!deployedContract.success) {
        break;
      }
    }

    return deployedContracts;
  }
}
