import { getAddressFromPrivateKey } from "@stacks/transactions";
import { CONFIG, deriveChildAccount, getNetwork } from "../utilities";
import { ContractType, DeploymentResult } from "./types/dao-types";
import { ContractGenerator } from "./services/contract-generator";

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
        "Usage: bun run generate-dao.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenDecimals> <tokenUri>"
      );
      process.exit(1);
    }

    const result: DeploymentResult = {
      success: false,
      contracts: {},
    };

    const networkObj = getNetwork(CONFIG.NETWORK);
    const { key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const senderAddress = getAddressFromPrivateKey(key, networkObj.version);

    const contractGenerator = new ContractGenerator(
      CONFIG.NETWORK,
      senderAddress
    );

    // Step 1 - generate token-related contracts

    console.log("===== aibtc-token");
    const tokenSource = await contractGenerator.generateTokenContract(
      tokenSymbol,
      tokenName,
      tokenMaxSupply,
      tokenDecimals,
      tokenUri
    );
    console.log(tokenSource);

    console.log("===== aibtc-bitflow-pool");
    const poolSource =
      contractGenerator.generateBitflowPoolContract(tokenSymbol);
    console.log(poolSource);

    console.log("===== aibtc-token-dex");
    const dexSource = contractGenerator.generateTokenDexContract(
      tokenMaxSupply,
      tokenDecimals,
      tokenSymbol
    );
    console.log(dexSource);

    // Step 2 - generate remaining dao contracts

    const contracts = contractGenerator.generateDaoContracts(
      senderAddress,
      tokenSymbol
    );

    // Sort contracts to ensure DAO_PROPOSAL_BOOTSTRAP is last
    const sortedContracts = Object.entries(contracts).sort(([, a], [, b]) => {
      if (a.type === ContractType.DAO_PROPOSAL_BOOTSTRAP) return 1;
      if (b.type === ContractType.DAO_PROPOSAL_BOOTSTRAP) return -1;
      return 0;
    });

    // Display all contracts
    for (const [key, contract] of sortedContracts) {
      console.log(`===== ${key}`);
      console.log(contract.source);
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
