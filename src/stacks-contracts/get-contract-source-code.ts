import {
  createErrorResponse,
  getApiUrl,
  getNetworkByPrincipal,
  sendToLLM,
  ToolResponse,
} from "../utilities";

const usage = "Usage: bun run get-contract-source-code.ts <contractAddress>";
const usageExample =
  "Example: bun run get-contract-source-code.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdao-charter";

interface ExpectedArgs {
  contractAddress: string;
}

interface ContractSourceResponse {
  source: string;
  publish_height: number;
  proof: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [contractAddress] = process.argv.slice(2);
  if (!contractAddress) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [address, name] = contractAddress.split(".");
  if (!address || !name) {
    const errorMessage = [
      `Invalid contract address: ${contractAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    contractAddress,
  };
}

export async function main(): Promise<ToolResponse<ContractSourceResponse>> {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.contractAddress.split(".");
  const networkFromAddress = getNetworkByPrincipal(contractAddress);
  const apiUrl = getApiUrl(networkFromAddress);
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
  return {
    success: true,
    message: `Contract source retrieved successfully for ${contractAddress}.${contractName}`,
    data,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
