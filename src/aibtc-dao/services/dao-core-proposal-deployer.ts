import { StacksNetworkName } from "@stacks/network";
import {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
} from "@stacks/transactions";
import {
  GeneratedCoreProposalRegistryEntry,
  DeployedCoreProposalRegistryEntry,
} from "./dao-core-proposal-registry";
import { getNextNonce } from "../../utilities";

/**
 * Contract deployment service for DAO core proposals
 */
export class DaoCoreProposalDeployer {
  private network: StacksNetworkName;
  private senderAddress: string;
  private senderKey: string;

  /**
   * Create a new DaoCoreProposalDeployer instance
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
   * Deploy a generated core proposal to the blockchain
   *
   * @param proposal The generated core proposal to deploy
   * @returns A deployed core proposal registry entry
   */
  async deployProposal(
    proposalName: string,
    proposal: GeneratedCoreProposalRegistryEntry,
    nonce?: number
  ): Promise<DeployedCoreProposalRegistryEntry> {
    try {
      console.log(`Deploy proposal called for: ${proposalName}`);

      // Create the contract deployment transaction
      const transaction = await makeContractDeploy({
        contractName: proposalName,
        codeBody: proposal.source,
        senderKey: this.senderKey,
        nonce: 2, // nonce === 0 ? 0 : nonce ? nonce : undefined,
        network: this.network,
        anchorMode: AnchorMode.Any,
        //postConditions: [], // empty, no transfers expected
        postConditionMode: PostConditionMode.Allow,
      }).catch((error) => {
        console.error(`Error creating contract deploy transaction: ${error}`);
        throw error;
      });

      console.log(`full transaction`);
      console.log(transaction);

      // Broadcast the transaction
      const broadcastResponse = await broadcastTransaction(
        transaction,
        this.network
      ).catch((error) => {
        console.error(`Error broadcasting transaction: ${error}`);
        throw error;
      });

      console.log(`full broadcast response`);
      console.log(JSON.stringify(broadcastResponse));

      if (!broadcastResponse.error) {
        // If successful, return the deployed proposal info
        return {
          ...proposal,
          contractAddress: `${this.senderAddress}.${proposal.name}`,
          sender: this.senderAddress,
          success: true,
          txId: broadcastResponse.txid,
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
        return {
          ...proposal,
          contractAddress: `${this.senderAddress}.${proposal.name}`,
          sender: this.senderAddress,
          success: false,
        };
      }
    } catch (error) {
      // Return failure status
      return {
        ...proposal,
        contractAddress: `${this.senderAddress}.${proposal.name}`,
        sender: this.senderAddress,
        success: false,
      };
    }
  }

  /**
   * Deploy multiple core proposals in sequence
   *
   * @param proposals Array of generated core proposals to deploy
   * @returns Array of deployed core proposal registry entries
   */
  async deployProposals(
    proposals: GeneratedCoreProposalRegistryEntry[]
  ): Promise<DeployedCoreProposalRegistryEntry[]> {
    const deployedProposals: DeployedCoreProposalRegistryEntry[] = [];
    let nonce = await getNextNonce(this.network, this.senderAddress);

    for (const proposal of proposals) {
      const deployedProposal = await this.deployProposal(
        proposal.name,
        proposal,
        nonce
      );
      deployedProposals.push(deployedProposal);

      // If deployment failed, throw an error
      if (!deployedProposal.success) {
        throw new Error(`Failed to deploy proposal ${proposal.name}`);
      } else {
        nonce++;
        // wait 0.5 seconds before deploying the next proposal
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return deployedProposals;
  }
}
