import { CONFIG, getApiUrl } from "../utilities";

interface ContractSourceResponse {
  source: string;
  publish_height: number;
  proof: string;
}

export async function getContractSource(
  network: string,
  contractAddress: string,
  contractName: string
) {
  const apiUrl = getApiUrl(network);
  const response = await fetch(
    `${apiUrl}/v2/contracts/source/${contractAddress}/${contractName}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to get contract source: ${response.statusText}`);
  }
  const data = (await response.json()) as ContractSourceResponse;
  return data.source;
}

// CONFIGURATION

const network = CONFIG.NETWORK;

const contractAddr = process.argv[2];

if (contractAddr) {
  if (contractAddr.includes(".")) {
    const [contractAddress, contractName] = contractAddr.split(".");

    try {
      const source = await getContractSource(
        network,
        contractAddress,
        contractName
      );
      console.log(source);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error fetching contract source: ${error.message}`);
      } else {
        console.error(
          `Error fetching contract source: ${JSON.stringify(error)}`
        );
      }
    }
  } else {
    console.error("The contract address must be separated by a period.");
  }
} else {
  console.error("Please provide a contract address and name as arguments.");
}
