#!/usr/bin/env bun

import { ContractApiClient } from "../api/client";
import { generateDaoContracts } from "../contracts/dao";
import { generateAgentAccount } from "../contracts/agent-account";
import { generateToken } from "../contracts/token";

async function main() {
  // 1. Generate a specific contract with parameters
  console.log("Generating a specific contract...");
  const apiClient = new ContractApiClient();
  
  const generatedContract = await apiClient.generateContract("aibtc-base-dao", {
    token_symbol: "MYTOKEN",
    token_name: "My Token",
    token_max_supply: "21000000"
  });
  
  console.log("Generated contract:", generatedContract.contract.name);
  
  // 2. Generate all DAO contracts for a network
  console.log("\nGenerating all DAO contracts...");
  const daoContracts = await generateDaoContracts("COHORT", "devnet", {
    dao_name: "Cohort DAO",
    dao_description: "A DAO for the AIBTC Cohort 0"
  });
  
  console.log(`Generated ${daoContracts.contracts.length} DAO contracts`);
  
  // 3. Generate a token contract
  console.log("\nGenerating a token contract...");
  const tokenContract = await generateToken({
    tokenName: "Cohort Token",
    tokenSymbol: "COHORT",
    tokenDecimals: 8,
    tokenUri: "https://example.com/token",
    tokenMaxSupply: 21000000
  });
  
  console.log("Generated token contract:", tokenContract.contract.name);
  
  // 4. Generate an agent account
  console.log("\nGenerating an agent account...");
  const agentAccount = await generateAgentAccount({
    ownerAddress: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS",
    daoTokenContract: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.aibtc-token",
    daoTokenDexContract: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.aibtc-token-dex"
  });
  
  console.log("Generated agent account contract");
}

main().catch(error => {
  console.error("Error:", error);
});
