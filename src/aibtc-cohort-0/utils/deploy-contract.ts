import { ClarityVersion } from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNextNonce,
  TxBroadcastResultWithLink,
} from "../../utilities";
import {
  ContractDeployer,
  SingleContract,
} from "../../stacks-contracts/services/contract-deployer";

/**
 * Deploys a Clarity contract to the blockchain
 * @param params Contract deployment parameters
 * @returns Promise with the broadcast result
 */
export async function deployContract({
  contractName,
  sourceCode,
  clarityVersion = ClarityVersion.Clarity3,
  network = CONFIG.NETWORK,
}: {
  contractName: string;
  sourceCode: string;
  clarityVersion?: ClarityVersion;
  network?: string;
}): Promise<TxBroadcastResultWithLink> {
  // Get account info for deployment
  const { address, key } = await deriveChildAccount(
    network,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  console.log(`Deploying contract ${contractName} from address: ${address}`);

  // Get the next nonce for the account
  const nextPossibleNonce = await getNextNonce(network, address);

  // Setup the contract deployer
  const contractDeployer = new ContractDeployer(network, address, key);
  
  // Prepare the contract for deployment
  const contract: SingleContract = {
    name: contractName,
    source: sourceCode,
    clarityVersion,
  };

  // Deploy the contract
  const deploymentDetails = await contractDeployer.deployContract(
    contract,
    nextPossibleNonce
  );

  return deploymentDetails;
}
