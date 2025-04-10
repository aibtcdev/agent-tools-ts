import * as fs from "fs";
import * as path from "path";
import { validateStacksAddress } from "@stacks/transactions";
import {
  DeployedContractRegistryEntry,
  GeneratedContractRegistryEntry,
  validateContractDeploymentOrder,
} from "./registries/dao-contract-registry";
import { DaoContractGenerator } from "./services/dao-contract-generator";
import { DaoContractDeployer } from "./services/dao-contract-deployer";
import {
  ContractCopyConfig,
  ExpectedContractGeneratorArgs,
} from "./types/dao-types";
import {
  aibtcCoreRequestBody,
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  FaktoryRequestBody,
  getFaktoryContracts,
  postToAibtcCore,
  sendToLLM,
  ToolResponse,
} from "../utilities";

const usage = `Usage: bun run deploy-dao.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenUri> <logoUrl> <originAddress> <daoManifest> <tweetOrigin> [daoManifestInscriptionId] [generateFiles]`;
const usageExample = `Example: bun run deploy-dao.ts BTC Bitcoin 21000000 https://bitcoin.org/ https://bitcoin.org/logo.png SP352...SGEV4 "DAO Manifest" "Tweet Origin" "DAO manifest inscription ID" "true"`;

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
  // create contract generator instance
  const contractGenerator = new DaoContractGenerator(CONFIG.NETWORK, address);
  // set dao manifest, passed to proposal for dao construction
  // or default to dao name + token name
  const manifest = args.daoManifest
    ? args.daoManifest
    : `Bitcoin DeFAI ${args.tokenSymbol} ${args.tokenName}`;

  // Step 1 - generate dao-related contracts

  // Define which contracts need multiple copies
  /* removing temporarily while we troubleshoot action config
  const contractCopies: ContractCopyConfig[] = [
    {
      type: "EXTENSIONS",
      subtype: "TIMED_VAULT_DAO",
      count: 5,
    },
    {
      type: "EXTENSIONS",
      subtype: "TIMED_VAULT_SBTC",
      count: 5,
    },
    {
      type: "EXTENSIONS",
      subtype: "TIMED_VAULT_STX",
      count: 5,
    },
  ];
  */

  // generate dao contracts with multiple copies
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

  // Step 4 - validate and deploy contracts

  // Validate deployment order
  const isValidDeploymentOrder = validateContractDeploymentOrder();
  if (!isValidDeploymentOrder) {
    throw new Error("Invalid contract deployment order detected");
  }

  // Sort contracts by deployment order for logging
  const sortedContracts = [...generatedContracts].sort(
    (a, b) => a.deploymentOrder - b.deploymentOrder
  );

  // Log deployment order for debugging
  console.log("Deployment order:");
  sortedContracts.forEach((contract, index) => {
    console.log(
      `${index + 1}. ${contract.name} (${contract.type}/${contract.subtype})`
    );
  });

  //console.log(`Deploying ${generatedContracts.length} contracts...`);
  //console.log(`- address: ${address}`);
  //console.log(JSON.stringify(generatedContracts, null, 2));

  // create contract deployer instance
  const contractDeployer = new DaoContractDeployer(
    CONFIG.NETWORK,
    address,
    key
  );
  // deploy each contract
  const deployedContracts = await contractDeployer.deployContracts(
    generatedContracts
  );

  // Step 5 - report dao details to aibtc backend

  // find the token contract entry
  const tokenContract = deployedContracts.find(
    (contract) => contract.name === token.name
  );
  const tokenTxid = tokenContract ? tokenContract.txId : undefined;

  // ensure token contract info is available
  if (!tokenContract || !tokenTxid) {
    throw new Error(`Token contract / txid not found: ${token.name}`);
  }

  // setup request body for aibtc core
  const aibtcCoreRequest: aibtcCoreRequestBody = {
    name: args.tokenSymbol,
    mission: args.daoManifest,
    descripton:
      "TBD - need to pass to deploy-dao script, could be the same for NAME",
    extensions: deployedContracts,
    token: {
      name: args.tokenName,
      symbol: args.tokenSymbol,
      decimals: 6,
      description: args.tokenName,
      max_supply: args.tokenMaxSupply.toString(),
      uri: args.tokenUri,
      tx_id: tokenTxid,
      contract_principal: `${address}.${token.name}`,
      image_url: args.logoUrl,
    },
  };

  console.log(JSON.stringify(aibtcCoreRequest, null, 2));

  await postToAibtcCore(CONFIG.NETWORK, aibtcCoreRequest);

  // Step 6 - return results

  // for each deployed contract, collect name where success = false
  const failedContracts = deployedContracts
    .filter((contract) => !contract.success)
    .map((contract) => contract.name);
  // for each deployed contract, collect name where success = true
  const successfulContracts = deployedContracts
    .filter((contract) => contract.success)
    .map((contract) => contract.name);

  /*
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
  */

  return {
    success: true,
    message: "Contracts generated and deployed successfully",
    data: deployedContracts.map((contract) => ({
      ...contract,
      source: contract.source.substring(0, 250),
    })),
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
