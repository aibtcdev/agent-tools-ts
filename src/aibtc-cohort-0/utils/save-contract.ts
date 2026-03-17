import { ContractResponse } from "@aibtc/types";
import fs from "node:fs";
import path from "node:path";

const SAFE_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const ALLOWED_NETWORKS = new Set(["mainnet", "testnet", "devnet"]);

/**
 * Sanitize a name used as a path component.
 * Throws if the name contains characters outside [a-zA-Z0-9_-] or is empty.
 */
function sanitizeName(name: string, fieldName: string): string {
  const cleaned = name.trim();
  if (!cleaned || !SAFE_NAME_REGEX.test(cleaned)) {
    throw new Error(
      `Invalid ${fieldName}: must contain only letters, numbers, hyphens, and underscores. Got: ${JSON.stringify(name)}`
    );
  }
  return cleaned;
}

/**
 * Validate that the network string is one of the allowed values.
 * Throws if the value is not in the allowlist.
 */
function validateNetwork(network: string): string {
  if (!ALLOWED_NETWORKS.has(network)) {
    throw new Error(
      `Invalid network: must be one of ${[...ALLOWED_NETWORKS].join(", ")}. Got: ${JSON.stringify(network)}`
    );
  }
  return network;
}

/**
 * Assert that a resolved output path stays within the expected base directory.
 * Throws if the path escapes the base, providing a belt-and-suspenders guard.
 */
function assertPathConfined(outputDir: string): void {
  const resolvedPath = path.resolve(outputDir);
  const expectedBase = path.resolve(path.join(__dirname, "generated"));
  if (!resolvedPath.startsWith(expectedBase + path.sep) && resolvedPath !== expectedBase) {
    throw new Error(
      `Path traversal detected: resolved path ${resolvedPath} is outside expected directory ${expectedBase}`
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
  const safeNetwork = validateNetwork(network);

  // Use the contract's name property
  const contractName = sanitizeName(
    contract.displayName ?? contract.name,
    "contractName"
  );

  // Create the directory if it doesn't exist
  const outputDir = path.join(
    __dirname,
    "generated",
    "agent-accounts",
    safeNetwork
  );
  assertPathConfined(outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

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
  const safeSymbol = sanitizeName(tokenSymbol, "tokenSymbol");
  const safeNetwork = validateNetwork(network);

  // Create the directory if it doesn't exist
  const outputDir = path.join(__dirname, "generated", safeSymbol, safeNetwork);
  assertPathConfined(outputDir);
  //console.log(`Saving contracts to ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });

  // Save each contract to a file
  for (const contractData of contracts) {
    // Use the contract's name property if available
    const contractName = sanitizeName(
      contractData.displayName ??
        getContractDisplayName(safeSymbol, contractData.name),
      "contractName"
    );

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
