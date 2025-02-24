import { validateStacksAddress } from "@stacks/transactions";
import { CONFIG, deriveChildAccount, ToolResponse } from "../utilities";
import { DeployedContractRegistryEntry } from "./services/dao-contract-registry";
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
  // Step 1 - validate arguments
  const args = validateArgs();

  // setup network and wallet info
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  // convert old network to new format
  const network = getNetworkNameFromType(CONFIG.NETWORK);

  // Step 2 - generate contracts

  // create contract generator instance
  const contractGenerator = new DaoContractGenerator(network);

  // generate dao contracts
  const daoContracts = contractGenerator.generateContracts(args.tokenSymbol);

  // get sorted contracts for deployment order
  const sortedContracts = contractGenerator.sortContracts(daoContracts);

  // Step 3 - deploy contracts

  // create contract deployer instance
  const contractDeployer = new DaoContractDeployer(network, address, key);

  // deploy contracts in order
  const deployedContracts: DeployedContractRegistryEntry[] = [];
  for (const [, contract] of sortedContracts) {
    console.log(`Deploying ${contract.name}...`);
    const deployedContract = await contractDeployer.deployContract(contract);
    deployedContracts.push(deployedContract);

    if (!deployedContract.success) {
      console.error(`Failed to deploy ${contract.name}`);
      // Continue deployment even if one fails
    } else {
      console.log(
        `Successfully deployed ${contract.name}: ${deployedContract.address}`
      );
    }
  }

  // Step 4 - return results
  return {
    success: true,
    message: "Contracts deployed successfully",
    data: deployedContracts,
  };
}
