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
    console.log(tokenSource);
    // Deploy Pool Contract
    const poolSource = await contractGenerator.generatePoolContract(tokenSymbol);
    console.log(poolSource);

    // Deploy DEX Contract
    const dexSource = await contractGenerator.generateBondingDexContract(
      tokenMaxSupply,
      tokenDecimals,
      tokenSymbol
    );
    console.log(dexSource);

    // Generate all DAO contracts
    const contracts = await contractGenerator.generateDaoContracts(senderAddress, tokenSymbol);

    let daoNonce = 3;
    // Sort contracts to ensure DAO_PROPOSAL_BOOTSTRAP is last
    const sortedContracts = Object.entries(contracts).sort(([, a], [, b]) => {
      if (a.type === ContractType.DAO_PROPOSAL_BOOTSTRAP) return 1;
      if (b.type === ContractType.DAO_PROPOSAL_BOOTSTRAP) return -1;
      return 0;
    });

    // Deploy all contracts
    for (const [key, contract] of sortedContracts) {

      console.log(contract.source)

    }

    result.success = true;
    return result;
  } catch (error: any) {
    console.error(JSON.stringify({ success: false, message: error }));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ success: false, message: error }));
  process.exit(1);
});