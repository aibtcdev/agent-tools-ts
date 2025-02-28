import { StacksNetworkName } from "@stacks/network";
import {
  AnchorMode,
  broadcastTransaction,
  ClarityVersion,
  makeContractDeploy,
  PostConditionMode,
} from "@stacks/transactions";

// used for one-off contract deployments
export type SingleContract = {
  name: string;
  source: string;
  hash?: string;
  clarityVersion?: ClarityVersion;
};

export type DeployedSingleContract = SingleContract & {
  txId: string;
  contractAddress: string;
  sender: string;
};

/**
 * Contract deployment service for single contracts
 */
export class ContractDeployer {
  private network: StacksNetworkName;
  private senderAddress: string;
  private senderKey: string;

  /**
   * Create a new ContractDeployer instance
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
   * Deploy a contract to the blockchain
   *
   * @param contract The generated contract to deploy
   * @param nonce Optional nonce for the transaction
   */
  async deployContract(
    contract: SingleContract,
    nonce?: number
  ): Promise<DeployedSingleContract> {
    // Create the contract deployment transaction
    const transaction = await makeContractDeploy({
      contractName: contract.name,
      codeBody: contract.source,
      senderKey: this.senderKey,
      nonce: nonce ? nonce : undefined,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    });

    // Broadcast the transaction
    const broadcastResponse = await broadcastTransaction(
      transaction,
      this.network
    );

    if (broadcastResponse.error) {
      throw new Error(`Failed to deploy contract: ${broadcastResponse.reason}`);
    }
    // Return the deployed contract details
    return {
      ...contract,
      txId: broadcastResponse.txid,
      contractAddress: `${this.senderAddress}.${contract.name}`,
      sender: this.senderAddress,
    };
  }
}
