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
} from "../registries/dao-contract-registry";
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
        nonce: nonce === 0 ? 0 : nonce ? nonce : undefined,
        network: this.network,
        postConditions: [], // empty, no transfers expected
        postConditionMode: PostConditionMode.Deny,
        clarityVersion: contract.clarityVersion,
      });

      // Broadcast the transaction
      const broadcastResponse = await broadcastTransaction({
        transaction,
        network: this.network,
      });

      if (broadcastResponse.txid) {
        // If successful, return the deployed contract info
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
        let errorMessage = `Failed to broadcast transaction`;
        if ("error" in broadcastResponse) {
          errorMessage += `: ${(broadcastResponse as any).error}`;

          if ((broadcastResponse as any).reason_data) {
            if ("message" in (broadcastResponse as any).reason_data) {
              errorMessage += ` - Reason: ${
                (broadcastResponse as any).reason_data.message
              }`;
            }
            if ("expected" in (broadcastResponse as any).reason_data) {
              errorMessage += ` - Expected: ${
                (broadcastResponse as any).reason_data.expected
              }, Actual: ${(broadcastResponse as any).reason_data.actual}`;
            }
          }
        }

        return {
          ...contract,
          sender: this.senderAddress,
          success: false,
          address: `${this.senderAddress}.${contract.name}`,
          error: errorMessage,
        };
      }
    } catch (error) {
      // Return failure status
      return {
        ...contract,
        sender: this.senderAddress,
        success: false,
        address: `${this.senderAddress}.${contract.name}`,
        error: error instanceof Error ? error.message : String(error),
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

    const alreadyDeployedContractNames: string[] = [
      // e.g.
      //"fac35-pre-faktory",
      //"fac35-faktory",
      //"fac35-base-dao",
    ];

    for (const contract of contracts) {
      // Check if contract is already deployed
      if (alreadyDeployedContractNames.includes(contract.name)) {
        console.log(`Skipping ${contract.name}, already deployed`);
        continue;
      }

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
        nonce++;
        // wait 2 second before deploying the next contract
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return deployedContracts;
  }
}
