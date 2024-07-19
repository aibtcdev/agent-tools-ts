import { CONFIG, getApiUrl } from "../utilities";

interface ContractSource {
  source: string;
  publish_height: number;
  proof: string;
}

async function getContractSource(contractAddress: string, contractName: string): Promise<string> {
  const apiUrl = getApiUrl(CONFIG.NETWORK);
  const url = `${apiUrl}/v2/contracts/source/${contractAddress}/${contractName}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Contract not found: ${contractAddress}.${contractName}`);
      }
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json() as ContractSource;
    return data.source;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to get contract source: ${error.message}`);
    } else {
      console.error(`An unexpected error occurred: ${error}`);
    }
    throw error;
  }
}

async function main() {
  const fullContractId = process.argv[2];
  if (!fullContractId) {
    console.error("No contract ID provided. Usage: bun run get-contract-code.ts <contract_address.contract_name>");
    process.exit(1);
  }

  const [contractAddress, contractName] = fullContractId.split('.');
  if (!contractAddress || !contractName) {
    console.error("Invalid contract ID format. Use: <contract_address.contract_name>");
    process.exit(1);
  }

  try {
    const sourceCode = await getContractSource(contractAddress, contractName);
    console.log(sourceCode);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();