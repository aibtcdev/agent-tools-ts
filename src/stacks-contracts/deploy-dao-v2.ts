import { validateStacksAddress } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  FaktoryGeneratedContracts,
  getFaktoryContracts,
  sendToLLM,
  ToolResponse,
} from "../utilities";
import {
  DeployedContractRegistryEntry,
  GeneratedContractRegistryEntry,
} from "./services/dao-contract-registry";
import { DaoContractGenerator } from "./services/dao-contract-generator";
import { getNetworkNameFromType } from "./types/dao-types-v2";
import { DaoContractDeployer } from "./services/dao-contract-deployer";

const usage = `Usage: bun run deploy-dao.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenUri> <logoUrl> <originAddress> <daoManifest> <tweetOrigin>`;
const usageExample = `Example: bun run deploy-dao.ts BTC Bitcoin 21000000 https://bitcoin.org/ https://bitcoin.org/logo.png SP352...SGEV4 "DAO Manifest" "Tweet Origin"`;

interface ExpectedArgs {
  tokenSymbol: string;
  tokenName: string;
  tokenMaxSupply: string;
  tokenUri: string;
  logoUrl: string;
  originAddress: string;
  daoManifest: string;
  tweetOrigin: string;
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
  };
}

async function main(): Promise<ToolResponse<DeployedContractRegistryEntry[]>> {
  // Step 0 - prep work

  // array to hold deployed contract info
  const generatedContracts: GeneratedContractRegistryEntry[] = [];

  // validate and store provided args
  const args = validateArgs();
  // setup network and wallet info
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // convert old network to new format
  const network = getNetworkNameFromType(CONFIG.NETWORK);
  // create contract generator instance
  const contractGenerator = new DaoContractGenerator(network);
  // set dao manifest, passed to proposal for dao construction
  // or default to dao name + token name
  const manifest = args.daoManifest
    ? args.daoManifest
    : `Bitcoin DeFAI ${args.tokenSymbol} ${args.tokenName}`;

  // Step 1 - generate dao-related contracts

  // generate dao contracts
  const daoContracts = contractGenerator.generateContracts(args.tokenSymbol);

  // add to generated contracts
  generatedContracts.push(...Object.values(daoContracts));

  // Step 2 - generate token-related contracts

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

  // update contracts already in generatedContracts with source and hash
  generatedContracts.forEach((contract) => {
    switch (contract.name) {
      case token.name:
        contract.source = token.code;
        contract.hash = token.hash;
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

  // Step 3 - deploy contracts

  console.log(`Deploying ${generatedContracts.length} contracts...`);
  console.log(`- network: ${network}`);
  console.log(`- address: ${address}`);
  console.log(`generatedContracts: (${generatedContracts.length})`);
  console.log(JSON.stringify(generatedContracts, null, 2));

  // create contract deployer instance
  const contractDeployer = new DaoContractDeployer(network, address, key);
  // deploy each contract
  const deployedContracts = await contractDeployer.deployContracts(
    generatedContracts
  );

  // Step 4 - return results

  // for each deployed contract, collect name where success = false
  const failedContracts = deployedContracts
    .filter((contract) => !contract.success)
    .map((contract) => contract.name);
  // for each deployed contract, collect name where success = true
  const successfulContracts = deployedContracts
    .filter((contract) => contract.success)
    .map((contract) => contract.name);

  console.log(
    `Successfully deployed ${
      successfulContracts.length
    } contracts: ${successfulContracts.join(", ")}`
  );

  if (failedContracts.length) {
    console.error(
      `Failed to deploy ${
        failedContracts.length
      } contracts: ${failedContracts.join(", ")}`
    );
  }

  return {
    success: true,
    message: "Contracts generated and deployed successfully",
    data: deployedContracts,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
