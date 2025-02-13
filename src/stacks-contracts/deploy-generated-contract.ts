import { join } from "path";
import { readFileSync } from "fs";
import { ContractDeployer } from "./services/contract-deployer";
import { DeploymentDetails } from "./types/dao-types";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNextNonce,
  sendToLLM,
  ToolResponse,
} from "../utilities";

const usage = "Usage: npm run deploy <contractPath>";
const usageExample =
  "Example: npm run deploy generated/bite/bite-core-proposals-v2.clar";

interface ExpectedArgs {
  contractPath: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [contractPath] = process.argv.slice(2);
  if (!contractPath) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    contractPath,
  };
}

async function main(): Promise<ToolResponse<DeploymentDetails>> {
  // validate and store provided args
  const args = validateArgs();
  const contractName = args.contractPath.split("/").pop()?.replace(".clar", "");
  if (!contractName) {
    throw new Error("Could not extract contract name from file path");
  }
  const sourceCode = readFileSync(
    join(process.cwd(), args.contractPath),
    "utf-8"
  );
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
    contractName,
    sourceCode,
    nextPossibleNonce
  );
  // return deployment details
  return {
    success: true,
    message: `Contract deployed successfully: ${address}.${contractName}`,
    data: deploymentDetails,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
