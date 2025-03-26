import * as fs from "fs";
import * as path from "path";
import { validateStacksAddress } from "@stacks/transactions";
import { SmartWalletGenerator } from "../services/smart-wallet-generator";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  sendToLLM,
  ToolResponse,
} from "../../utilities";

const usage = `Usage: bun run generate-smart-wallet.ts <ownerAddress> <agentAddress> <daoTokenContract> <daoTokenDexContract> <generateFiles>`;
const usageExample = `Example: bun run generate-smart-wallet.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token-dex true`;

interface ExpectedArgs {
  ownerAddress: string;
  agentAddress: string;
  daoTokenContract: string;
  daoTokenDexContract: string;
  generateFiles?: boolean;
}

function validateArgs(): ExpectedArgs {
  // capture all arguments
  const [ownerAddress, agentAddress, daoTokenContract, daoTokenDexContract, generateFiles] =
    process.argv.slice(2);

  // verify all required arguments are provided
  if (!ownerAddress || !agentAddress || !daoTokenContract || !daoTokenDexContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // verify addresses are valid
  if (!validateStacksAddress(ownerAddress) || !validateStacksAddress(agentAddress)) {
    const errorMessage = [
      `Invalid addresses: Owner=${ownerAddress}, Agent=${agentAddress}`,
      "Addresses must be valid Stacks addresses",
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // verify token contracts
  const [daoAddress, daoName] = daoTokenContract.split(".");
  if (!daoAddress || !daoName) {
    const errorMessage = [
      `Invalid token contracts: daoTokenContract=${daoTokenContract}`,
      "Token contracts must be in the format 'address.contractName'",
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  const [dexAddress, dexName] = daoTokenDexContract.split(".");
  if (!dexAddress || !dexName) {
    const errorMessage = [
      `Invalid token contracts: daoTokenDexContract=${daoTokenDexContract}`,
      "Token contracts must be in the format 'address.contractName'",
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // convert generateFiles to boolean
  const shouldGenerateFiles = convertStringToBoolean(generateFiles);

  // return validated arguments
  return {
    ownerAddress,
    agentAddress,
    daoTokenContract,
    daoTokenDexContract,
    generateFiles: shouldGenerateFiles,
  };
}

async function main(): Promise<ToolResponse<any>> {
  try {
    // validate and store provided args
    const args = validateArgs();

    // setup network and wallet info
    const { address } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    // create contract generator instance
    const contractGenerator = new SmartWalletGenerator(CONFIG.NETWORK, address);

    // generate smart wallet contract
    const smartWallet = contractGenerator.generateSmartWallet({
      ownerAddress: args.ownerAddress,
      agentAddress: args.agentAddress,
      daoTokenContract: args.daoTokenContract,
      daoTokenDexContract: args.daoTokenDexContract,
    });

    // save contract to file (optional)
    if (args.generateFiles) {
      const outputDir = `generated/${address}`;
      fs.mkdirSync(outputDir, { recursive: true });
      const fileName = `${smartWallet.name}.clar`;
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, smartWallet.source);
      console.log(`Generated: ${filePath}`);
    }

    // return generated contract
    return {
      success: true,
      message: "Smart wallet contract generated successfully",
      data: {
        name: smartWallet.name,
        hash: smartWallet.hash,
        source: smartWallet.source.substring(0, 250) + "...", // Truncate for display
      },
    };
  } catch (error) {
    return createErrorResponse(error);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
