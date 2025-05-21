import { fetchCallReadOnlyFunction, Cl, cvToValue } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage =
  "Usage: bun run is-approved-asset.ts <agentAccountContract> <assetContract>";
const usageExample =
  "Example: bun run is-approved-asset.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token";

interface ExpectedArgs {
  agentAccountContract: string;
  assetContract: string;
}

function validateArgs(): ExpectedArgs {
  const [agentAccountContract, assetContract] = process.argv.slice(2);
  if (!agentAccountContract || !assetContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(agentAccountContract)) {
    const errorMessage = [
      `Invalid agent account contract address: ${agentAccountContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(assetContract)) {
    const errorMessage = [
      `Invalid asset contract address: ${assetContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    agentAccountContract,
    assetContract,
  };
}

async function main(): Promise<ToolResponse<boolean>> {
  const args = validateArgs();
  const [contractAddress, contractName] = args.agentAccountContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "is-approved-asset",
    functionArgs: [Cl.principal(args.assetContract)],
    senderAddress: address,
    network: networkObj,
  });

  const isApproved = cvToValue(result, true) as boolean;
  return {
    success: true,
    message: "Asset approval status retrieved successfully",
    data: isApproved,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
