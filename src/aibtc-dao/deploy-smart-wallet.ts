import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  sendToLLM,
} from "../utilities";
import { SmartWalletGenerator } from "./services/smart-wallet-generator";
import { SmartWalletDeployer } from "./services/smart-wallet-deployer";
import { validateStacksAddress } from "@stacks/transactions";

const usage =
  "Usage: bun run deploy-smart-wallet.ts <userAddress> <agentAddress> <sbtcTokenContract> <daoTokenContract>";
const usageExample =
  "Example: bun run deploy-smart-wallet.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token";

interface ExpectedArgs {
  userAddress: string;
  agentAddress: string;
  sbtcTokenContract: string;
  daoTokenContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [userAddress, agentAddress, sbtcTokenContract, daoTokenContract] =
    process.argv.slice(2);

  if (
    !userAddress ||
    !agentAddress ||
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

  // return validated arguments
  return {
    userAddress,
    agentAddress,
    sbtcTokenContract,
    daoTokenContract,
  };
}

async function main() {
  try {
    // Validate arguments
    const args = validateArgs();

    // Get account info
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    console.log(`Deploying smart wallet from account: ${address}`);
    console.log(`User: ${args.userAddress}`);
    console.log(`Agent: ${args.agentAddress}`);

    // Generate smart wallet contract
    const generator = new SmartWalletGenerator(CONFIG.NETWORK, address);
    const smartWallet = generator.generateSmartWallet({
      userAddress: args.userAddress,
      agentAddress: args.agentAddress,
      sbtcTokenContract: args.sbtcTokenContract,
      daoTokenContract: args.daoTokenContract,
    });

    console.log(`Generated smart wallet contract: ${smartWallet.name}`);
    console.log(`Contract hash: ${smartWallet.hash}`);

    // Deploy smart wallet contract
    const deployer = new SmartWalletDeployer(CONFIG.NETWORK, address, key);
    const deployedWallet = await deployer.deploySmartWalletWithNonce(
      smartWallet
    );

    if (deployedWallet.success) {
      console.log(
        `Successfully deployed smart wallet: ${deployedWallet.address}`
      );
      console.log(`Transaction ID: ${deployedWallet.txId}`);
      return {
        success: true,
        message: "Smart wallet deployed successfully",
        data: {
          smartWalletAddress: deployedWallet.address,
          txId: deployedWallet.txId,
          user: args.userAddress,
          agent: args.agentAddress,
        },
      };
    } else {
      console.error(`Failed to deploy smart wallet: ${smartWallet.name}`);
      return {
        success: false,
        message: "Failed to deploy smart wallet",
        error: "Deployment transaction failed",
      };
    }
  } catch (error) {
    console.error("Error deploying smart wallet:", error);
    return createErrorResponse(error);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
