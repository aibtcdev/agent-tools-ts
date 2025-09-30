import { existsSync, readFileSync } from "node:fs";
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
  "Usage: bun run deploy-contract-from-file.ts <contractName> <sourceFile> [clarityVersion] [fee]";
const usageExample =
  'Example: bun run deploy-contract-from-file.ts "wow-dao-charter" "./generated/wow/wow-dao-charter.clar" 3 1000000';

interface ExpectedArgs {
  contractName: string;
  sourceFile: string;
  clarityVersion?: ClarityVersion;
  fee?: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [contractName, sourceFile, clarityVersion, fee] = process.argv.slice(2);
  // check for req params
  if (!contractName || !sourceFile) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify sourceFile exists on disk
  if (!existsSync(sourceFile)) {
    const errorMessage = [
      `Source file not found: ${sourceFile}`,
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
    sourceFile,
    clarityVersion: clarityVer,
    fee: fee ? parseInt(fee) : undefined,
  };
}

async function main(): Promise<ToolResponse<DeployedSingleContract>> {
  // validate and store provided args
  const args = validateArgs();
  console.log(JSON.stringify(args, null, 2));
  // setup network and wallet info
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // read source code from source file
  const sourceCode = readFileSync(args.sourceFile, "utf-8");
  // verify source code is not empty
  if (!sourceCode) {
    throw new Error(`Source file is empty: ${args.sourceFile}`);
  }
  // setup deployment details
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  const contractDeployer = new ContractDeployer(CONFIG.NETWORK, address, key);
  const contract: SingleContract = {
    name: args.contractName,
    source: sourceCode,
  };
  const deploymentDetails = await contractDeployer.deployContract(
    contract,
    nextPossibleNonce,
    args.fee
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
