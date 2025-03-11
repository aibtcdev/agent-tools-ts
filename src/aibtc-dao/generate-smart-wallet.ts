import * as fs from "fs";
import * as path from "path";
import { validateStacksAddress } from "@stacks/transactions";
import { SmartWalletGenerator } from "./services/smart-wallet-generator";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  sendToLLM,
  ToolResponse,
} from "../utilities";

const usage = `Usage: bun run generate-smart-wallet.ts <userAddress> <agentAddress> <tokenSymbol> <sbtcTokenContract> <daoTokenContract> <generateFiles>`;
const usageExample = `Example: bun run generate-smart-wallet.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG aibtc STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token true`;

interface ExpectedArgs {
  userAddress: string;
  agentAddress: string;
  tokenSymbol: string;
  sbtcTokenContract: string;
  daoTokenContract: string;
  generateFiles: boolean;
}

function validateArgs(): ExpectedArgs {
  // capture all arguments
  const [
    userAddress,
    agentAddress,
    tokenSymbol,
    sbtcTokenContract,
    daoTokenContract,
    generateFiles,
  ] = process.argv.slice(2);

  // verify all required arguments are provided
  if (
    !userAddress ||
    !agentAddress ||
    !tokenSymbol ||
    !sbtcTokenContract ||
    !daoTokenContract
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // verify addresses are valid
  if (
    !validateStacksAddress(userAddress) ||
    !validateStacksAddress(agentAddress)
  ) {
    const errorMessage = [
      `Invalid addresses: User=${userAddress}, Agent=${agentAddress}`,
      "Addresses must be valid Stacks addresses",
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // verify token contracts
  const [sbtcAddress, sbtcName] = sbtcTokenContract.split(".");
  const [daoAddress, daoName] = daoTokenContract.split(".");
  if (!sbtcAddress || !sbtcName || !daoAddress || !daoName) {
    const errorMessage = [
      `Invalid token contracts: sBTC=${sbtcTokenContract}, DAO=${daoTokenContract}`,
      "Token contracts must be in the format 'address.contractName'",
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // convert generateFiles to boolean
  const shouldGenerateFiles = generateFiles === "true";

  // return validated arguments
  return {
    userAddress,
    agentAddress,
    tokenSymbol,
    sbtcTokenContract,
    daoTokenContract,
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
      userAddress: args.userAddress,
      agentAddress: args.agentAddress,
      tokenSymbol: args.tokenSymbol,
      sbtcTokenContract: args.sbtcTokenContract,
      daoTokenContract: args.daoTokenContract,
    });

    // save contract to file (optional)
    if (args.generateFiles) {
      const outputDir = path.join("generated", args.tokenSymbol.toLowerCase());
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
