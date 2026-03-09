import { ContractResponse } from "@aibtc/types";
import fs from "node:fs";
import path from "node:path";

/** Regex allowing only alphanumeric characters, underscores, and hyphens */
const SAFE_PATH_COMPONENT = /^[a-zA-Z0-9_-]+$/;

/**
 * Validate that a value is safe to use as a path component.
 * Rejects directory traversal patterns like `../` or empty strings.
 */
function validatePathComponent(value: string, label: string): void {
  if (!SAFE_PATH_COMPONENT.test(value)) {
    throw new Error(
      `Invalid ${label}: "${value}". Only alphanumeric characters, underscores, and hyphens are allowed.`
    );
  }
}

/**
 * Verify that a resolved file path is within the expected output directory.
 */
function assertWithinDirectory(filePath: string, outputDir: string): void {
  const resolvedFile = path.resolve(filePath);
  const resolvedDir = path.resolve(outputDir);
  if (!resolvedFile.startsWith(resolvedDir + path.sep) && resolvedFile !== resolvedDir) {
    throw new Error("Path traversal detected: resolved path escapes the output directory.");
  }
}

/**
 * Save generated agent account contract to a file in the contract-tools/generated directory
 */
export async function saveAgentAccountToFile(
  contract: ContractResponse,
  network: string
) {
  // Validate path components
  validatePathComponent(network, "network");

  // Use the contract's name property
  const contractName = contract.displayName ?? contract.name;
  validatePathComponent(contractName, "contractName");

  // Create the directory if it doesn't exist
  const outputDir = path.join(
    __dirname,
    "generated",
    "agent-accounts",
    network
  );
  fs.mkdirSync(outputDir, { recursive: true });

  const filePath = path.join(outputDir, `${contractName}.clar`);

  // Verify resolved paths stay within the output directory
  assertWithinDirectory(filePath, outputDir);

  if (!contract.source) {
    throw new Error(
      `Contract ${contractName} does not have source code available`
    );
  }

  const sourceCode = contract.source;
  fs.writeFileSync(filePath, sourceCode);

  // Save the full response as JSON for reference
  const jsonPath = path.join(outputDir, `${contractName}.json`);
  assertWithinDirectory(jsonPath, outputDir);
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
  // Validate path components
  validatePathComponent(tokenSymbol, "tokenSymbol");
  validatePathComponent(network, "network");

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

    validatePathComponent(contractName, "contractName");
    const filePath = path.join(outputDir, `${contractName}.clar`);
    assertWithinDirectory(filePath, outputDir);

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
