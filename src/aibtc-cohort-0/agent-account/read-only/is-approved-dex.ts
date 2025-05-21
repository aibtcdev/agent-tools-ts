import { fetchCallReadOnlyFunction, Cl, cvToValue } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";

const usage =
  "Usage: bun run is-approved-dex.ts <agentAccountContract> <dexContract>";
const usageExample =
  "Example: bun run is-approved-dex.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test ST3DD7MASYJADCFXN3745R11RVM4PCXCPVRS3V27K.facey-faktory-dex";

interface ExpectedArgs {
  agentAccountContract: string;
  dexContract: string;
}

function validateArgs(): ExpectedArgs {
  const [agentAccountContract, dexContract] = process.argv.slice(2);
  if (!agentAccountContract || !dexContract) {
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
  if (!isValidContractPrincipal(dexContract)) {
    const errorMessage = [
      `Invalid DEX contract address: ${dexContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    agentAccountContract,
    dexContract,
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
    functionName: "is-approved-dex",
    functionArgs: [Cl.principal(args.dexContract)],
    senderAddress: address,
    network: networkObj,
  });

  const isApproved = cvToValue(result, true) as boolean;
  return {
    success: true,
    message: "DEX approval status retrieved successfully",
    data: isApproved,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
