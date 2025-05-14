#!/usr/bin/env bun

import { ContractApiClient } from "../api/client";

async function main() {
  const apiClient = new ContractApiClient();
  
  // 1. Get all DAO contracts
  console.log("Fetching all DAO contracts...");
  const daoContracts = await apiClient.getDaoNames();
  
  console.log(`Found ${daoContracts.names.length} DAO contracts`);
  console.log(daoContracts.names);
  
  // 2. Get contracts by type
  console.log("\nFetching contracts by type...");
  const extensions = await apiClient.getContractsByType("EXTENSIONS");
  
  console.log(`Found ${extensions.contracts.length} extension contracts`);
  console.log(extensions.contracts.map(c => c.name));
  
  // 3. Get contract by name
  console.log("\nFetching a specific contract...");
  const contractName = "aibtc-base-dao";
  const contract = await apiClient.getContract(contractName);
  
  console.log(`Contract details for ${contractName}:`);
  console.log(`- Type: ${contract.contract.type}`);
  console.log(`- Subtype: ${contract.contract.subtype}`);
  console.log(`- Deployment Order: ${contract.contract.deploymentOrder}`);
}

main().catch(error => {
  console.error("Error:", error);
});
