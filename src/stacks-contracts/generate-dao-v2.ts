import * as fs from "fs";
import * as path from "path";
import { validateStacksAddress } from "@stacks/transactions";
import { DaoContractGenerator } from "./services/dao-contract-generator";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  getFaktoryContracts,
  sendToLLM,
  ToolResponse,
} from "../utilities";
import {
  ContractCategory,
  ContractSubCategory,
  getNetworkNameFromType,
} from "./types/dao-types-v2";
import { GeneratedContractRegistryEntry } from "./services/dao-contract-registry";

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

async function main(): Promise<ToolResponse<GeneratedContractRegistryEntry[]>> {
  // Step 0 - prep work

  // array to build the contract info
  const generatedContracts: GeneratedContractRegistryEntry[] = [];
  // helper function to save contract to object, opt to file
  const saveContract = <C extends ContractCategory>(
    name: string,
    type: C,
    subtype: ContractSubCategory<C>,
    source: string,
    hash?: string
  ) => {
    // add to contract output
    generatedContracts.push({
      name,
      type,
      subtype,
      source,
      hash,
    } as GeneratedContractRegistryEntry); // make TS happy
    // save to file if generating files
    if (args.generateFiles) {
      const fileName = `${name}.clar`;
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, source);
      console.log(`Generated: ${filePath}`);
    }
  };
  // validate and store provided args
  const args = validateArgs();
  // setup network and wallet info
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // convert old network to new format
  const network = getNetworkNameFromType(CONFIG.NETWORK);
  // prepare output directory if generating files
  let outputDir = "";
  if (args.generateFiles) {
    outputDir = path.join("generated", args.tokenSymbol.toLowerCase());
    fs.mkdirSync(outputDir, { recursive: true });
  }
  // create contract generator instance
  const contractGenerator = new DaoContractGenerator(network);
  // set dao manifest, passed to proposal for dao construction
  // or default to dao name + token name
  const manifest = args.daoManifest
    ? args.daoManifest
    : `Bitcoin DeFAI ${args.tokenSymbol} ${args.tokenName}`;
  console.log(`- manifest: ${manifest}`);

  // Step 1 - generate token-related contracts

  // query the faktory contracts
  const { token, dex, pool } = await getFaktoryContracts(
    args.tokenSymbol,
    args.tokenName,
    parseInt(args.tokenMaxSupply),
    args.tokenUri,
    address, // creatorAddress
    args.originAddress,
    args.logoUrl,
    manifest, // description
    args.tweetOrigin
  );

  // save token-related contract data
  saveContract(token.name, "TOKEN", "DAO", token.code, token.hash);
  saveContract(dex.name, "TOKEN", "DEX", dex.code, dex.hash);
  saveContract(pool.name, "TOKEN", "POOL", pool.code, pool.hash);

  // Step 2 - generate remaining dao contracts

  const daoContracts = contractGenerator.generateContracts(args.tokenSymbol);
  for (const contract of Object.values(daoContracts)) {
    saveContract(
      contract.name,
      contract.type,
      contract.subtype,
      contract.source,
      contract.hash
    );
  }

  // Step 3 - return generated contracts
  return {
    success: true,
    message: "Contracts generated successfully",
    data: generatedContracts,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
