import { StacksNetworkName } from "@stacks/network";
import {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
} from "@stacks/transactions";
import {
  GeneratedContractRegistryEntry,
  DeployedContractRegistryEntry,
} from "./dao-contract-registry";
import { getNetworkTypeFromName, NetworkName } from "../types/dao-types";
import { getNextNonce } from "../../utilities";

/**
 * Contract deployment service for DAO contracts
 */
export class DaoContractDeployer {
  private network: StacksNetworkName;
  private senderAddress: string;
  private senderKey: string;

  /**
   * Create a new DaoContractDeployer instance
   *
   * @param network Network instance to use for deployments
   * @param senderAddress Address that will deploy the contracts
   * @param senderKey Private key for the sender address
   */
  constructor(network: NetworkName, senderAddress: string, senderKey: string) {
    this.network = getNetworkTypeFromName(network);
    this.senderAddress = senderAddress;
    this.senderKey = senderKey;
  }

  /**
   * Deploy a generated contract to the blockchain
   *
   * @param contract The generated contract to deploy
   * @returns A deployed contract registry entry
   */
  async deployContract(
    contract: GeneratedContractRegistryEntry,
    nonce?: number
  ): Promise<DeployedContractRegistryEntry> {
    try {
      // Create the contract deployment transaction
      const transaction = await makeContractDeploy({
        contractName: contract.name,
        codeBody: contract.source,
        senderKey: this.senderKey,
        nonce: nonce ? nonce : undefined,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        clarityVersion: contract.clarityVersion,
      });

      // Broadcast the transaction
      const broadcastResponse = await broadcastTransaction(
        transaction,
        this.network
      );

      if (!broadcastResponse.error) {
        // If successful, return the deployed contract info
        console.log(
          `https://explorer.hiro.so/txid/0x${broadcastResponse.txid}?chain=testnet`
        );
        return {
          ...contract,
          sender: this.senderAddress,
          success: true,
          txId: broadcastResponse.txid,
          address: `${this.senderAddress}.${contract.name}`,
        };
      } else {
        // If failed, return error info
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
        console.error(errorMessage);
        return {
          ...contract,
          sender: this.senderAddress,
          success: false,
          address: `${this.senderAddress}.${contract.name}`,
        };
      }
    } catch (error) {
      console.error(`Failed to deploy contract ${contract.name}:`, error);

      // Return failure status
      return {
        ...contract,
        sender: this.senderAddress,
        success: false,
        address: `${this.senderAddress}.${contract.name}`,
      };
    }
  }

  /**
   * Deploy multiple contracts in sequence
   *
   * @param contracts Array of generated contracts to deploy
   * @returns Array of deployed contract registry entries
   */
  async deployContracts(
    contracts: GeneratedContractRegistryEntry[]
  ): Promise<DeployedContractRegistryEntry[]> {
    const deployedContracts: DeployedContractRegistryEntry[] = [];
    let nonce = await getNextNonce(this.network, this.senderAddress);

    for (const contract of contracts) {
      console.log(`Deploying ${contract.name}...`);
      const deployedContract = await this.deployContract(contract, nonce);
      deployedContracts.push(deployedContract);

      // If deployment failed, throw an error
      if (!deployedContract.success) {
        throw new Error(
          `Failed to deploy ${contract.name}, ${JSON.stringify(
            deployedContract
          )}`
        );
      } else {
        console.log(
          `Successfully deployed ${contract.name}: ${deployedContract.address}`
        );
        nonce++;
      }
    }

    return deployedContracts;
  }
}
