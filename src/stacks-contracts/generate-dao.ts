import { getAddressFromPrivateKey } from "@stacks/transactions";
import { CONFIG, deriveChildAccount, getNetwork } from "../utilities";
import { ContractType, DeploymentResult } from "./types/dao-types";
import { ContractGenerator } from "./services/contract-generator";
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  try {
    const [tokenSymbol, tokenName, tokenMaxSupply, tokenDecimals, tokenUri, generateFiles = "false"] =
      process.argv.slice(2);

    if (
      !tokenSymbol ||
      !tokenName ||
      !tokenMaxSupply ||
      !tokenDecimals ||
      !tokenUri
    ) {
      console.log(
        "Usage: bun run generate-dao.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenDecimals> <tokenUri> [generateFiles]"
      );
      process.exit(1);
    }

    const shouldGenerateFiles = generateFiles.toLowerCase() === "true";

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

    let outputDir = "";
    if (shouldGenerateFiles) {
      // Create output directory
      outputDir = path.join('generated', tokenSymbol.toLowerCase());
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const senderAddress = getAddressFromPrivateKey(key, networkObj.version);

    const contractGenerator = new ContractGenerator(
      CONFIG.NETWORK,
      senderAddress
    );

    // Function to save contract to file
    const saveContract = (name: string, source: string) => {
      if (shouldGenerateFiles) {
        const fileName = `${tokenSymbol.toLowerCase()}-${name}.clar`;
        const filePath = path.join(outputDir, fileName);
        fs.writeFileSync(filePath, source);
        console.log(`Generated: ${filePath}`);
      }
      console.log(`===== ${name}`);
      console.log(source);
    };

    // Step 1 - generate token-related contracts
    const tokenSource = await contractGenerator.generateTokenContract(
      tokenSymbol,
      tokenName,
      tokenMaxSupply,
      tokenDecimals,
      tokenUri
    );
    saveContract('token', tokenSource);

    const poolSource = contractGenerator.generateBitflowPoolContract(tokenSymbol);
    saveContract('bitflow-pool', poolSource);

    const dexSource = contractGenerator.generateTokenDexContract(
      tokenMaxSupply,
      tokenDecimals,
      tokenSymbol
    );
    saveContract('token-dex', dexSource);

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

    // Save all contracts
    for (const [key, contract] of sortedContracts) {
      saveContract(key, contract.source);
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
