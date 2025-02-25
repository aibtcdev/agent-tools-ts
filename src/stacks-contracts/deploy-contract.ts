import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNextNonce,
  sendToLLM,
  ToolResponse,
} from "../utilities";
import { DeploymentDetails } from "./types/dao-types";
import { ContractDeployer } from "./services/contract-deployer";

const usage = "Usage: bun run deploy-contract.ts <contractName> <sourceCode>";
const usageExample =
  'Example: bun run deploy-contract.ts aibtcdao-charter "(define-public (hello-world) (ok u1))"';

interface ExpectedArgs {
  contractName: string;
  sourceCode: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [contractName, sourceCode] = process.argv.slice(2);
  if (!contractName || !sourceCode) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    contractName,
    sourceCode,
  };
}

async function main(): Promise<ToolResponse<DeploymentDetails>> {
  // validate and store provided args
  const args = validateArgs();
  // setup network and wallet info
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // setup deployment details
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  const contractDeployer = new ContractDeployer(CONFIG.NETWORK);
  const deploymentDetails = await contractDeployer.deployContractV2(
    args.contractName,
    args.sourceCode,
    nextPossibleNonce
  );
  // return deployment details
  return {
    success: true,
    message: `Contract deployed successfully: ${address}.${args.contractName}`,
    data: deploymentDetails,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
