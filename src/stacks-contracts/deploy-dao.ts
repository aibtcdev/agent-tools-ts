import { getAddressFromPrivateKey } from "@stacks/transactions";
import { CONFIG, deriveChildAccount, getNetwork, getNextNonce } from "../utilities";
import { ContractType, ContractNames, DeploymentResult } from "./types/dao-types";
import { ContractGenerator } from "./services/contract-generator";
import { ContractDeployer } from "./services/contract-deployer";
import { generateContractNames } from "./utils/contract-utils";

async function main() {
  try {
    const [tokenSymbol, tokenName, tokenMaxSupply, tokenDecimals, tokenUri] =
    process.argv.slice(2);

    if (
      !tokenSymbol ||
      !tokenName ||
      !tokenMaxSupply ||
      !tokenDecimals ||
      !tokenUri
    ) {
      console.log(
        "Usage: bun run deploy-dao.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenDecimals> <tokenUri>"
      );
      process.exit(1);
    }

    const result: DeploymentResult = {
      success: false,
      contracts: {}
    };

    const networkObj = getNetwork(CONFIG.NETWORK);
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const senderAddress = getAddressFromPrivateKey(key, networkObj.version);
    const contractNames = generateContractNames(tokenSymbol);
    const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, senderAddress);

    const contractGenerator = new ContractGenerator(CONFIG.NETWORK, senderAddress);
    const contractDeployer = new ContractDeployer(CONFIG.NETWORK);

    // Deploy Token Contract
    const tokenSource = await contractGenerator.generateBondingTokenContract(
      tokenSymbol,
      tokenName,
      tokenMaxSupply,
      tokenDecimals,
      tokenUri
    );
    const tokenDeployment = await contractDeployer.deployContract(
      tokenSource,
      ContractType.TOKEN,
      contractNames[ContractType.TOKEN],
      nextPossibleNonce
    );
    if (!tokenDeployment.success) {
      result.error = { stage: "token", ...tokenDeployment.error };
      return result;
    }
    result.contracts.token = tokenDeployment.data;

    // Deploy Pool Contract
    const poolSource = await contractGenerator.generatePoolContract(tokenSymbol);
    const poolDeployment = await contractDeployer.deployContract(
      poolSource,
      ContractType.POOL,
      contractNames[ContractType.POOL],
      nextPossibleNonce + 1
    );
    if (!poolDeployment.success) {
      result.error = { stage: "pool", ...poolDeployment.error };
      return result;
    }
    result.contracts.pool = poolDeployment.data;

    // Deploy DEX Contract
    const dexSource = await contractGenerator.generateBondingDexContract(
      tokenMaxSupply,
      tokenDecimals,
      tokenSymbol
    );
    const dexDeployment = await contractDeployer.deployContract(
      dexSource,
      ContractType.DEX,
      contractNames[ContractType.DEX],
      nextPossibleNonce + 2
    );
    if (!dexDeployment.success) {
      result.error = { stage: "dex", ...dexDeployment.error };
      return result;
    }
    result.contracts.dex = dexDeployment.data;

    // Generate all DAO contracts
    const contracts = await contractGenerator.generateDaoContracts(senderAddress, tokenSymbol);

    let daoNonce = 3;
    // Deploy all contracts
    for (const [key, contract] of Object.entries(contracts)) {

      const deployment = await contractDeployer.deployContract(
        contract.source,
        contract.type,
        contract.name,
        nextPossibleNonce + daoNonce
      );

      if (!deployment.success) {
        result.error = {
          stage: `Deploying ${contract.type}`,
          message: deployment.error?.message,
          reason: deployment.error?.reason,
          details: deployment.error?.details,
        };
        return result;
      }

      daoNonce += 1;
      result.contracts[contract.type] = deployment.data;
    }

    // Deploy Bootstrap Proposal
    const bootstrapSource = await contractGenerator.generateBootstrapProposalContract(
      tokenSymbol,
      senderAddress
    );
    const bootstrapDeployment = await contractDeployer.deployContract(
      bootstrapSource,
      ContractType.DAO_PROPOSAL_BOOTSTRAP,
      contractNames[ContractType.DAO_PROPOSAL_BOOTSTRAP],
      nextPossibleNonce + Object.keys(contracts).length + 3
    );
    if (!bootstrapDeployment.success) {
      result.error = { stage: "bootstrap", ...bootstrapDeployment.error };
      return result;
    }
    result.contracts.dao_proposal_bootstrap = bootstrapDeployment.data;

    result.success = true;
    console.log("Deployment successful:", JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error("Error in main:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});