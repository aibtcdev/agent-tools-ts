import { StacksNetworkName } from "@stacks/network";

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

export function getReadOnlyFunction(
  contractPrincipal: string,
  functionName: string,
  functionArgs: string
) {
  // TODO
}
