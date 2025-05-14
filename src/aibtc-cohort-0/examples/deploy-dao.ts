#!/usr/bin/env bun

import { deployDaoContracts } from "../contracts/dao";

async function main() {
  console.log("Deploying a DAO...");
  
  const deployParams = {
    tokenSymbol: "COHORT",
    tokenName: "Cohort Token",
    tokenMaxSupply: 21000000,
    tokenUri: "https://example.com/token",
    logoUrl: "https://example.com/logo.png",
    originAddress: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS",
    daoManifest: "Example DAO Manifest for Cohort 0",
    tweetOrigin: "https://twitter.com/example/status/123456789"
  };
  
  const result = await deployDaoContracts(deployParams);
  
  console.log(`Generated ${result.contracts.length} contracts for deployment`);
  console.log("Contract names:", result.contracts.map(c => c.name));
}

main().catch(error => {
  console.error("Error:", error);
});
