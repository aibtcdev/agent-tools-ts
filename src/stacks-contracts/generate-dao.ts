import { getAddressFromPrivateKey } from "@stacks/transactions";
import {
  CONFIG,
  convertStringToBoolean,
  deriveChildAccount,
  getNetwork,
} from "../utilities";
import {
  ContractProposalType,
  ContractType,
  DeploymentResult,
} from "./types/dao-types";
import { ContractGenerator } from "./services/contract-generator";
import * as fs from "fs";
import * as path from "path";

async function main() {
  try {
    const [
      tokenSymbol,
      tokenName,
      tokenMaxSupply,
      tokenUri,
      logoUrl,
      originAddress,
      daoManifest,
      tweetOrigin,
      generateFiles = "false",
    ] = process.argv.slice(2);

    if (
      !tokenSymbol ||
      !tokenName ||
      !tokenMaxSupply ||
      !tokenUri ||
      !logoUrl ||
      !originAddress
    ) {
      console.log(
        "Usage: bun run generate-dao.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenUri> <logoUrl> <originAddress> <daoManifest> <tweetOrigin> <generateFiles>"
      );
      process.exit(1);
    }

    const shouldGenerateFiles = convertStringToBoolean(generateFiles);

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
      outputDir = path.join("generated", tokenSymbol.toLowerCase());
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
        const fileName = `${name}.clar`;
        const filePath = path.join(outputDir, fileName);
        fs.writeFileSync(filePath, source);
        console.log(`Generated: ${filePath}`);
      } else {
        console.log(`===== ${name}`);
        console.log(source);
      }
    };

    // set dao manifest, passed to proposal for dao construction
    // or default to dao name + token name
    const manifest = daoManifest
      ? daoManifest
      : `Bitcoin DeFAI ${tokenSymbol} ${tokenName}`;
    console.log(`- manifest: ${manifest}`);

    // Step 1 - generate token-related contracts

    // query the faktory contracts

    const { token, dex, pool } =
      await contractGenerator.generateFaktoryContracts(
        tokenSymbol,
        tokenName,
        tokenMaxSupply,
        tokenUri,
        senderAddress, // creatorAddress
        originAddress,
        logoUrl,
        manifest, // description
        tweetOrigin
      );

    // save token-related contracts (if generating files)

    saveContract(token.name, token.code);
    saveContract(dex.name, dex.code);
    saveContract(pool.name, pool.code);

    // Step 2 - generate remaining dao contracts

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

    // Save all contracts
    for (const [_, contract] of sortedContracts) {
      saveContract(contract.name, contract.source);
    }

    result.success = true;
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ success: false, message: errorMsg }));
    process.exit(1);
  }
}

main().catch((error) => {
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ success: false, message: errorMsg }));
  process.exit(1);
});
