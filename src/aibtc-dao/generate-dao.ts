import * as fs from "fs";
import * as path from "path";
import { validateStacksAddress } from "@stacks/transactions";
import { DaoContractGenerator } from "./services/dao-contract-generator";
import {
  AppConfig,
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  FaktoryRequestBody,
  getFaktoryContracts,
  sendToLLM,
  ToolResponse,
} from "../utilities";
import { ExpectedContractGeneratorArgs } from "./types/dao-types";
import { GeneratedContractRegistryEntry } from "./services/dao-contract-registry";

const usage = `Usage: bun run generate-dao.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenUri> <logoUrl> <originAddress> <daoManifest> <tweetOrigin> <daoManifestInscriptionId> <generateFiles>`;
const usageExample = `Example: bun run generate-dao.ts BTC Bitcoin 21000000 https://bitcoin.org/ https://bitcoin.org/logo.png SP352...SGEV4 "DAO Manifest" "Tweet Origin" "DAO manifest inscription ID" "true"`;

function validateArgs(): ExpectedContractGeneratorArgs {
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
    daoManifestInscriptionId,
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
    tokenMaxSupply: parseInt(tokenMaxSupply),
    tokenUri,
    logoUrl,
    originAddress,
    daoManifest,
    tweetOrigin,
    daoManifestInscriptionId,
    generateFiles: shouldGenerateFiles,
  };
}

async function generateDao(
  customConfig?: Partial<AppConfig>
): Promise<ToolResponse<GeneratedContractRegistryEntry[]>> {
  // Step 0 - prep work

  // allow for custom configuration to be provided
  const appConfig = { ...CONFIG, ...customConfig };

  // array to build the contract info
  const generatedContracts: GeneratedContractRegistryEntry[] = [];

  // validate and store provided args
  const args = validateArgs();
  // setup network and wallet info
  const { address } = await deriveChildAccount(
    appConfig.NETWORK,
    appConfig.MNEMONIC,
    appConfig.ACCOUNT_INDEX
  );
  // create contract generator instance
  const contractGenerator = new DaoContractGenerator(CONFIG.NETWORK, address);
  // set dao manifest, passed to proposal for dao construction
  // or default to dao name + token name
  const manifest = args.daoManifest
    ? args.daoManifest
    : `Bitcoin DeFAI ${args.tokenSymbol} ${args.tokenName}`;

  // Step 1 - generate dao contracts

  const daoContracts = contractGenerator.generateContracts(args);
  generatedContracts.push(...Object.values(daoContracts));

  // Step 2 - generate token-related contracts

  // query the faktory contracts
  const requestBody: FaktoryRequestBody = {
    symbol: args.tokenSymbol,
    name: args.tokenName,
    supply: args.tokenMaxSupply,
    creatorAddress: address,
    originAddress: args.originAddress,
    uri: args.tokenUri,
    logoUrl: args.logoUrl,
    description: manifest,
    tweetOrigin: args.tweetOrigin,
  };
  const { prelaunch, token, dex, pool } = await getFaktoryContracts(
    requestBody
  );

  // update contracts already in generatedContracts with source and hash
  generatedContracts.forEach((contract) => {
    switch (contract.name) {
      case prelaunch.name:
        contract.source = prelaunch.code;
        contract.hash = prelaunch.hash;
        break;
      case token.name:
        contract.hash = token.hash;
        contract.source = token.code;
        break;
      case dex.name:
        contract.source = dex.code;
        contract.hash = dex.hash;
        break;
      case pool.name:
        contract.source = pool.code;
        contract.hash = pool.hash;
        break;
    }
  });

  // Step 3 - save contracts (optional)

  if (args.generateFiles) {
    const outputDir = path.join("generated", args.tokenSymbol.toLowerCase());
    fs.mkdirSync(outputDir, { recursive: true });
    generatedContracts.forEach((contract) => {
      const fileName = `${contract.name}.clar`;
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, contract.source);
      //console.log(`Generated: ${filePath}`);
    });
  }

  // Step 4 - return generated contracts

  return {
    success: true,
    message: "Contracts generated successfully",
    // limit .code per contract to set chars for display / context size
    data: generatedContracts.map((contract) => ({
      ...contract,
      source: contract.source.substring(0, 250),
    })),
  };
}

if (require.main === module) {
  generateDao()
    .then(sendToLLM)
    .catch((error) => {
      sendToLLM(createErrorResponse(error));
      process.exit(1);
    });
}

export { generateDao };
