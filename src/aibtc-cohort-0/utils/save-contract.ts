import { ContractResponse } from "@aibtc/types";
import fs from "node:fs";
import path from "node:path";

/**
 * Save generated agent account contract to a file in the contract-tools/generated directory
 */
export async function saveAgentAccountToFile(
  contract: ContractResponse,
  network: string
) {
  // Create the directory if it doesn't exist
  const outputDir = path.join(
    __dirname,
    "generated",
    "agent-accounts",
    network
  );
  fs.mkdirSync(outputDir, { recursive: true });

  // Use the contract's name property
  const contractName = contract.displayName ?? contract.name;
  const filePath = path.join(outputDir, `${contractName}.clar`);

  if (!contract.source) {
    throw new Error(
      `Contract ${contractName} does not have source code available`
    );
  }

  const sourceCode = contract.source;
  fs.writeFileSync(filePath, sourceCode);

  // Save the full response as JSON for reference
  const jsonPath = path.join(outputDir, `${contractName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(contract, null, 2));

  return {
    contractPath: filePath,
    jsonPath: jsonPath,
  };
}

/**
 * Helper function to generate a display name for the contract
 * @param symbol
 * @param name
 * @returns replaced name
 */
export function getContractDisplayName(symbol: string, name: string): string {
  return name.replace("aibtc", symbol).toLowerCase();
}

/**
 * Save generated contracts to files in the contract-tools/generated directory
 */
export async function saveDaoContractsToFiles(
  contracts: ContractResponse[],
  tokenSymbol: string,
  network: string
) {
  // Create the directory if it doesn't exist
  const outputDir = path.join(__dirname, "generated", tokenSymbol, network);
  //console.log(`Saving contracts to ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });

  // Save each contract to a file
  for (const contractData of contracts) {
    // Use the contract's name property if available
    const contractName =
      contractData.displayName ??
      getContractDisplayName(tokenSymbol, contractData.name);

    const filePath = path.join(outputDir, `${contractName}.clar`);
    if (!contractData.source) {
      throw new Error(
        `Contract ${contractName} does not have source code available`
      );
    }
    const sourceCode = contractData.source!;
    fs.writeFileSync(filePath, sourceCode);
    //console.log(`Saved contract ${contractName} to ${filePath}`);
  }
  // Save the full response as JSON for reference
  const jsonPath = path.join(outputDir, `_full_response.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(contracts, null, 2));
  //console.log(`Saved full response to ${jsonPath}`);
}
