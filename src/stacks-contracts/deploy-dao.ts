import {
  getAddressFromPrivateKey,
  validateStacksAddress,
} from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  FaktoryGeneratedContracts,
  getNetwork,
  getNextNonce,
  sendToLLM,
  ToolResponse,
} from "../utilities";
import {
  ContractProposalType,
  ContractType,
  DeploymentResult,
  GeneratedDaoContracts,
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

async function main(): Promise<ToolResponse<any>> {
  // validate and store provided args
  const args = validateArgs();
  // setup network and wallet info
  const { address, key } = await deriveChildAccount(
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

  ////////////////////////////////////////////////////////////////////////

  // TODO: Step 2 generate dao contracts, combine into one object to return later

  // TODO: Step 3 deploy deploy deploy with errors at stages if needed
  // each deployment can be added to the result object, keyed to contract?

  // TODO: look at final return type vs promise at main()

  ////////////////////////////////////////////////////////////////////////

  // Step 2 - deploy token-related contracts

  //console.log("- deploying aibtc-token-faktory...");
  const tokenDeployment = await contractDeployer.deployContract(
    token.code,
    ContractType.DAO_TOKEN,
    contractNames[ContractType.DAO_TOKEN],
    currentNonce
  );
  if (!tokenDeployment.success) {
    throw new Error(
      `Deployment failed for ${contractNames[ContractType.DAO_TOKEN]}, ${
        tokenDeployment.error
      }`
    );
  }
  result.contracts.token = tokenDeployment.data;
  currentNonce++;

  //console.log("- deploying aibtc-bitflow-pool...");
  const poolDeployment = await contractDeployer.deployContract(
    pool.code,
    ContractType.DAO_BITFLOW_POOL,
    contractNames[ContractType.DAO_BITFLOW_POOL],
    currentNonce
  );
  if (!poolDeployment.success) {
    result.error = { stage: "pool", ...poolDeployment.error };
    return result;
  }
  result.contracts.pool = poolDeployment.data;
  currentNonce++;

  //console.log("- deploying aibtc-token-dex...");
  const dexDeployment = await contractDeployer.deployContract(
    dex.code,
    ContractType.DAO_TOKEN_DEX,
    contractNames[ContractType.DAO_TOKEN_DEX],
    currentNonce
  );
  if (!dexDeployment.success) {
    result.error = { stage: "dex", ...dexDeployment.error };
    return result;
  }
  result.contracts.dex = dexDeployment.data;
  currentNonce++;

  // Step 3 - generate remaining dao contracts

  const contracts = contractGenerator.generateDaoContracts(
    senderAddress,
    tokenSymbol,
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

  // Deploy all contracts
  for (const [key, contract] of sortedContracts) {
    //console.log(`- deploying ${key}...`);
    const deployment = await contractDeployer.deployContract(
      contract.source,
      contract.type,
      contract.name,
      currentNonce
    );

    if (!deployment.success) {
      console.log(`Deployment failed for ${contract.type}`);
      console.log(JSON.stringify(deployment.error, null, 2));
      result.error = {
        stage: `Deploying ${contract.type}`,
        message: deployment.error?.message,
        reason: deployment.error?.reason,
        details: deployment.error?.details,
      };
      return result;
    }

    currentNonce++;
    result.contracts[contract.type] = deployment.data;
  }

  result.success = true;
  //console.log("Deployment successful!");
  console.log(JSON.stringify(result, null, 2));
  return result;
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
