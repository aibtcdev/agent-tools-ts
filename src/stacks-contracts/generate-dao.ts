import * as fs from "fs";
import * as path from "path";
import { validateStacksAddress } from "@stacks/transactions";
import { ContractGenerator } from "./services/contract-generator";
import { ContractProposalType, GeneratedDaoContracts } from "./types/dao-types";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  FaktoryGeneratedContracts,
  sendToLLM,
  ToolResponse,
} from "../utilities";

const usage = `Usage: bun run generate-dao.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenUri> <logoUrl> <originAddress> <daoManifest> <tweetOrigin> <generateFiles>`;
const usageExample = `Example: bun run generate-dao.ts BTC Bitcoin 21000000 https://bitcoin.org/ https://bitcoin.org/logo.png SP352...SGEV4 "DAO Manifest" "Tweet Origin" "true"`;

interface ExpectedArgs {
  tokenSymbol: string;
  tokenName: string;
  tokenMaxSupply: string;
  tokenUri: string;
  logoUrl: string;
  originAddress: string;
  daoManifest: string;
  tweetOrigin: string;
  generateFiles: boolean;
}

function validateArgs(): ExpectedArgs {
  // capture all arguments
  const [
    tokenSymbol,
    tokenName,
    tokenMaxSupply,
    tokenUri,
    logoUrl,
    originAddress,
    daoManifest,
    tweetOrigin,
    generateFiles,
  ] = process.argv.slice(2);
  // verify all required arguments are provided
  if (
    !tokenSymbol ||
    !tokenName ||
    !tokenMaxSupply ||
    !tokenUri ||
    !logoUrl ||
    !originAddress ||
    !daoManifest ||
    !tweetOrigin
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify origin address is valid
  if (!validateStacksAddress(originAddress)) {
    const errorMessage = [
      `Invalid origin address: ${originAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // convert generateFiles to boolean
  const shouldGenerateFiles = convertStringToBoolean(generateFiles);
  // return validated arguments
  return {
    tokenSymbol,
    tokenName,
    tokenMaxSupply,
    tokenUri,
    logoUrl,
    originAddress,
    daoManifest,
    tweetOrigin,
    generateFiles: shouldGenerateFiles,
  };
}

async function main(): Promise<
  ToolResponse<FaktoryGeneratedContracts & GeneratedDaoContracts>
> {
  // validate and store provided args
  const args = validateArgs();
  // helper function to save contract to file or log to console
  const saveContract = (name: string, source: string) => {
    if (args.generateFiles) {
      const fileName = `${name}.clar`;
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, source);
      console.log(`Generated: ${filePath}`);
    } else {
      console.log(`===== ${name}`);
      console.log(source);
    }
  };
  // setup network and wallet info
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // prepare output directory if generating files
  let outputDir = "";
  if (args.generateFiles) {
    // Create output directory
    outputDir = path.join("generated", args.tokenSymbol.toLowerCase());
    fs.mkdirSync(outputDir, { recursive: true });
  }
  // create contract generator instance
  const contractGenerator = new ContractGenerator(CONFIG.NETWORK, address);

  // set dao manifest, passed to proposal for dao construction
  // or default to dao name + token name
  const manifest = args.daoManifest
    ? args.daoManifest
    : `Bitcoin DeFAI ${args.tokenSymbol} ${args.tokenName}`;
  console.log(`- manifest: ${manifest}`);

  // Step 1 - generate token-related contracts

  // query the faktory contracts

  const { token, dex, pool } = await contractGenerator.generateFaktoryContracts(
    args.tokenSymbol,
    args.tokenName,
    args.tokenMaxSupply,
    args.tokenUri,
    address, // creatorAddress
    args.originAddress,
    args.logoUrl,
    manifest, // description
    args.tweetOrigin
  );

  // save token-related contracts (if generating files)

  saveContract(token.name, token.code);
  saveContract(dex.name, dex.code);
  saveContract(pool.name, pool.code);

  // Step 2 - generate remaining dao contracts

  const contracts = contractGenerator.generateDaoContracts(
    address,
    args.tokenSymbol,
    manifest
  );

  // Sort contracts to ensure DAO_PROPOSAL_BOOTSTRAP is last
  const sortedContracts = Object.entries(contracts).sort(([, a], [, b]) => {
    if (a.type === ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2)
      return 1;
    if (b.type === ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2)
      return -1;
    return 0;
  });

  // Save all contracts
  for (const [_, contract] of sortedContracts) {
    saveContract(contract.name, contract.source);
  }

  // return generated contracts
  return {
    success: true,
    message: "Contracts generated successfully",
    data: {
      token,
      dex,
      pool,
      ...contracts,
    },
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
