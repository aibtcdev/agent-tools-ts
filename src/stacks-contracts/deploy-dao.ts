import { validateStacksAddress } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNextNonce,
  sendToLLM,
  ToolResponse,
} from "../utilities";
import {
  ContractProposalType,
  ContractType,
  DeployedDaoContracts,
  DeploymentDetails,
  GeneratedDaoContracts,
  mapToDeployedDaoContracts,
} from "./types/dao-types";
import { ContractGenerator } from "./services/contract-generator";
import { ContractDeployer } from "./services/contract-deployer";
import { generateContractNames } from "./utils/contract-utils";

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

async function main(): Promise<
  ToolResponse<{
    generatedContracts: GeneratedDaoContracts;
    deployedContracts: DeployedDaoContracts;
  }>
> {
  // validate and store provided args
  const args = validateArgs();
  // setup network and wallet info
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const contractNames = generateContractNames(args.tokenSymbol);
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  let currentNonce = nextPossibleNonce;

  const contractGenerator = new ContractGenerator(CONFIG.NETWORK, address);
  const contractDeployer = new ContractDeployer(CONFIG.NETWORK);

  // set dao manifest, passed to proposal for dao construction
  // or default to dao name + token name
  const manifest = args.daoManifest
    ? args.daoManifest
    : `Bitcoin DeFAI ${args.tokenSymbol} ${args.tokenName}`;
  //console.log(`- manifest: ${manifest}`);

  // Step 1 - generate token-related contracts

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

  // Step 2 - generate dao-related contracts

  const daoContracts = contractGenerator.generateDaoContracts(
    address,
    args.tokenSymbol,
    manifest
  );

  // Sort contracts to ensure DAO_PROPOSAL_BOOTSTRAP is last
  // TODO: better way to sort here? script out preferred order from deployment plan?
  const sortedContracts = Object.entries(daoContracts).sort(([, a], [, b]) => {
    if (a.type === ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2)
      return 1;
    if (b.type === ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2)
      return -1;
    return 0;
  });

  // Step 3 - deploy deploy deploy

  const deploymentRecords: { [key: string]: DeploymentDetails } = {};

  // deploy aibtc-token
  const tokenDeployment = await contractDeployer.deployContractV2(
    token.code,
    contractNames[ContractType.DAO_TOKEN],
    currentNonce,
    ContractType.DAO_TOKEN
  );
  deploymentRecords[ContractType.DAO_TOKEN] = tokenDeployment;
  currentNonce++;

  // deploy aibtc-bitflow-pool
  const poolDeployment = await contractDeployer.deployContractV2(
    pool.code,
    contractNames[ContractType.DAO_BITFLOW_POOL],
    currentNonce,
    ContractType.DAO_BITFLOW_POOL
  );
  deploymentRecords[ContractType.DAO_BITFLOW_POOL] = poolDeployment;
  currentNonce++;

  // deploy aibtc-token-dex
  const dexDeployment = await contractDeployer.deployContractV2(
    dex.code,
    contractNames[ContractType.DAO_TOKEN_DEX],
    currentNonce,
    ContractType.DAO_TOKEN_DEX
  );
  deploymentRecords[ContractType.DAO_TOKEN_DEX] = dexDeployment;
  currentNonce++;

  // deploy remaining dao contracts
  for (const [_, contract] of sortedContracts) {
    const deployment = await contractDeployer.deployContractV2(
      contract.source,
      contract.name,
      currentNonce,
      contract.type
    );
    deploymentRecords[contract.type] = deployment;
    currentNonce++;
  }

  // return generated contracts and deployment results
  return {
    success: true,
    message: "Contracts generated and deployed successfully",
    data: {
      generatedContracts: daoContracts,
      deployedContracts: mapToDeployedDaoContracts(deploymentRecords),
    },
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
