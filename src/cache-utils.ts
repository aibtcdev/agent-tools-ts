import { StacksNetworkName } from "@stacks/network";
import { ClarityValue, validateStacksAddress } from "@stacks/transactions";
import { getNetworkByPrincipal } from "./utilities";

type CacheResponseSuccess = {
  success: true;
  data: unknown;
};

type CacheResponseError = {
  success: false;
  data: CacheResponseErrorObject;
};

type CacheResponseErrorObject = {
  message: string;
  details?: {
    [key: string]: any;
  };
};

type CacheResponse = CacheResponseSuccess | CacheResponseError;

export const AIBTC_CACHE_BASE_URL = (network: StacksNetworkName) => {
  switch (network) {
    case "mainnet":
      return "https://cache.aibtc.dev";
    case "testnet":
      return "https://cache-staging.aibtc.dev";
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
};

export async function getReadOnlyFunction(
  contractPrincipal: string,
  functionName: string,
  functionArgs: ClarityValue[],
  network: StacksNetworkName = "testnet",
  bustCache: boolean = false
): Promise<CacheResponse> {
  try {
    // Validate inputs
    const [contractAddress, contractName] = contractPrincipal.split(".");
    if (
      !contractAddress ||
      !contractName ||
      !validateStacksAddress(contractAddress)
    ) {
      throw new Error(
        `Invalid contract principal: ${contractPrincipal}. Expected format: address.name`
      );
    }
    // build request info
    const requestUrl = new URL(
      `/contract-calls/read-only/${contractAddress}/${contractName}/${functionName}`,
      AIBTC_CACHE_BASE_URL(network)
    );
    const requestHeaders = {
      "Content-Type": "application/json",
    };
    const requestBody = {
      functionArgs,
      network,
      cacheControl: {
        bustCache,
      },
    };
    const requestOptions: RequestInit = {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    };
    // make the request
    console.log(`Fetching URL: ${requestUrl.toString()}`);
    const response = await fetch(requestUrl.toString(), requestOptions);
    // if response is not ok, throw error
    if (!response.ok) {
      const errorText = await response.text();
      console.log("Error response:", errorText);
      if (errorText) {
        throw new Error(errorText);
      } else {
        throw new Error(`Unknown error: ${response.status}`);
      }
    }
    const responseJson = await response.json();
    const successResponse: CacheResponseSuccess = {
      success: true,
      data: responseJson,
    };
    return successResponse;
  } catch (error) {
    return {
      success: false,
      data: {
        message: `Error fetching read-only function: ${
          error instanceof Error ? error.message : String(error)
        }`,
        details: {
          error,
        },
      },
    };
  }
}

type SIP010Info = {
  name?: string;
  symbol?: string;
  decimals?: string;
  totalSupply?: string;
  tokenUri?: string;
};

export async function getSIP010Info(tokenContract: string) {
  const tokenContractAddress = tokenContract.split(".")[0];
  const network = getNetworkByPrincipal(tokenContractAddress);
  // SIP-010 functions
  const functionNames = [
    "get-name",
    "get-symbol",
    "get-decimals",
    // "get-balance", // requires principal
    "get-total-supply",
    "get-token-uri",
  ];
  // SIP-010 function args are empty (excluding get-balance)
  const functionArgs: ClarityValue[] = [];
  // create an array of promises
  const promises = functionNames.map((functionName) => {
    console.log("==============");
    console.log("Calling getReadOnlyFunction with args:");
    console.log({
      functionName,
      tokenContract,
      functionArgs,
      network,
    });
    return getReadOnlyFunction(
      tokenContract,
      functionName,
      functionArgs,
      network,
      functionName === "get-total-supply"
    );
  });
  // wait for all promises to resolve
  const results = await Promise.all(promises);
  // create an object to store results
  const resultsObject: SIP010Info = {};
  // iterate over results and assign to object
  results.forEach((result, index) => {
    if (result.success) {
      const functionName = functionNames[index];
      const responseData = result.data;
      // assign to object based on function name
      switch (functionName) {
        case "get-name":
          resultsObject.name = responseData as string;
          break;
        case "get-symbol":
          resultsObject.symbol = responseData as string;
          break;
        case "get-decimals":
          resultsObject.decimals = responseData as string;
          break;
        case "get-total-supply":
          resultsObject.totalSupply = responseData as string;
          break;
        case "get-token-uri":
          resultsObject.tokenUri = responseData as string;
          break;
        default:
          break;
      }
    }
  });
  return resultsObject;
}
