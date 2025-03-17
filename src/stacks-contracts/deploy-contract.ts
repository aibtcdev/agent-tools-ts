import { ClarityVersion } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNextNonce,
  sendToLLM,
  ToolResponse,
} from "../utilities";
import {
  ContractDeployer,
  DeployedSingleContract,
  SingleContract,
} from "./services/contract-deployer";

const usage =
  "Usage: bun run deploy-contract.ts <contractName> <sourceCode> [clarityVersion]";
const usageExample =
  'Example: bun run deploy-contract.ts aibtcdao-charter "(define-public (hello-world) (ok u1))" 3';

interface ExpectedArgs {
  contractName: string;
  sourceCode: string;
  clarityVersion?: ClarityVersion;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [contractName, sourceCode, clarityVersion] = process.argv.slice(2);
  // check for req params
  if (!contractName || !sourceCode) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // if clarity version provided, convert to valid
  let clarityVer = ClarityVersion.Clarity3;
  if (clarityVersion) {
    const parsedVersion = parseInt(clarityVersion);
    if (isNaN(parsedVersion) || parsedVersion < 1 || parsedVersion > 3) {
      const errorMessage = [
        `Invalid clarity version: ${clarityVersion}`,
        usage,
        usageExample,
      ].join("\n");
      throw new Error(errorMessage);
    }
    // set clarity version based on the parsed value
    if (parsedVersion === 1) {
      clarityVer = ClarityVersion.Clarity1;
    } else if (parsedVersion === 2) {
      clarityVer = ClarityVersion.Clarity2;
    } else if (parsedVersion === 3) {
      clarityVer = ClarityVersion.Clarity3;
    }
  }
  // return validated arguments
  return {
    contractName,
    sourceCode,
    clarityVersion: clarityVer,
  };
}

async function main(): Promise<ToolResponse<DeployedSingleContract>> {
  // validate and store provided args
  const args = validateArgs();
  // setup network and wallet info
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // setup deployment details
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  const contractDeployer = new ContractDeployer(CONFIG.NETWORK, address, key);
  const contract: SingleContract = {
    name: args.contractName,
    source: args.sourceCode,
  };
  const deploymentDetails = await contractDeployer.deployContract(
    contract,
    nextPossibleNonce
  );
  // return deployment details
  return {
    success: true,
    message: `Contract deployed successfully: ${address}.${args.contractName}`,
    data: {
      ...deploymentDetails,
      source: deploymentDetails.source.substring(0, 250),
    },
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
