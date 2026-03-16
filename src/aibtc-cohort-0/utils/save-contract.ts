import { ContractResponse } from "@aibtc/types";
import fs from "node:fs";
import path from "node:path";

/**
 * Validate that a filename segment contains only safe characters.
 * Prevents path traversal via directory separators, null bytes, or shell metacharacters.
 */
function validateFilenameSegment(value: string, fieldName: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new Error(
      `Invalid ${fieldName}: must contain only alphanumeric, underscore, or hyphen characters`
    );
  }
}

/**
 * Assert that a resolved file path stays within the expected base directory.
 * Guards against symlink-based or double-encoded traversal that slips past
 * simple string checks.
 */
function assertWithinDirectory(filePath: string, baseDir: string): void {
  const resolved = path.resolve(filePath);
  const base = path.resolve(baseDir);
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error(
      `Path traversal detected: ${filePath} is outside ${baseDir}`
    );
  }
}

/**
 * Save generated agent account contract to a file in the contract-tools/generated directory
 */
export async function saveAgentAccountToFile(
  contract: ContractResponse,
  network: string
) {
  // Validate user-controlled path segments before using them in filesystem calls
  validateFilenameSegment(network, "network");

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
  validateFilenameSegment(contractName, "contractName");
  const filePath = path.join(outputDir, `${contractName}.clar`);
  assertWithinDirectory(filePath, path.join(__dirname, "generated"));

  if (!contract.source) {
    throw new Error(
      `Contract ${contractName} does not have source code available`
    );
  }

  const sourceCode = contract.source;
  fs.writeFileSync(filePath, sourceCode);

  // Save the full response as JSON for reference
  const jsonPath = path.join(outputDir, `${contractName}.json`);
  assertWithinDirectory(jsonPath, path.join(__dirname, "generated"));
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
  // Validate user-controlled path segments before using them in filesystem calls
  validateFilenameSegment(tokenSymbol, "tokenSymbol");
  validateFilenameSegment(network, "network");

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

    validateFilenameSegment(contractName, "contractName");
    const filePath = path.join(outputDir, `${contractName}.clar`);
    assertWithinDirectory(filePath, path.join(__dirname, "generated"));
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
  assertWithinDirectory(jsonPath, path.join(__dirname, "generated"));
  fs.writeFileSync(jsonPath, JSON.stringify(contracts, null, 2));
  //console.log(`Saved full response to ${jsonPath}`);
}
