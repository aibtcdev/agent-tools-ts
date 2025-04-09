import { StacksNetworkName } from "@stacks/network";
import { DaoContractGenerator } from "../services/dao-contract-generator";
import { ContractCopyConfig } from "../types/dao-types";

/**
 * Example of how to generate multiple copies of timed vault contracts
 */
async function generateMultipleTimedVaults() {
  // Initialize the contract generator
  const network: StacksNetworkName = "testnet";
  const senderAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
  const generator = new DaoContractGenerator(network, senderAddress);
  
  // Define which contracts need multiple copies
  const contractCopies: ContractCopyConfig[] = [
    { 
      type: "EXTENSIONS", 
      subtype: "TIMED_VAULT_DAO", 
      count: 5 
    },
    { 
      type: "EXTENSIONS", 
      subtype: "TIMED_VAULT_SBTC", 
      count: 5 
    },
    { 
      type: "EXTENSIONS", 
      subtype: "TIMED_VAULT_STX", 
      count: 5 
    }
  ];
  
  // Generate the contracts
  const contracts = generator.generateContracts(
    {
      tokenSymbol: "MYTOKEN",
      tokenName: "My Token",
      tokenMaxSupply: 1000000,
      tokenUri: "https://example.com/token",
      logoUrl: "https://example.com/logo.png",
      originAddress: senderAddress,
      daoManifest: "My DAO Manifest",
      daoManifestInscriptionId: "123456",
    },
    contractCopies
  );
  
  // Log the generated contracts
  console.log(`Generated ${Object.keys(contracts).length} contracts:`);
  Object.keys(contracts).forEach(contractName => {
    console.log(`- ${contractName}`);
  });
  
  // Generate bootstrap code for timed vaults
  console.log("\nBootstrap code for timed vaults:");
  console.log(generator.generateTimedVaultBootstrapCode(
    "aibtc-timed-vault-dao",
    5,
    "MYTOKEN"
  ));
}

// Run the example
generateMultipleTimedVaults().catch(console.error);
