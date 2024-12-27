import {
  getAddressFromPrivateKey,
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  SignedContractDeployOptions,
  PostConditionMode,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  getTraitReference,
  getAddressReference,
} from "../utilities";
import * as path from "path";
import { Eta } from "eta";

enum TraitType {
  DAO_TRAITS = "aibtcdev-dao-traits-v1",
  DAO_BASE = "aibtcdev-dao-v1",
  POOL = "xyk-pool-trait-v-1-2",
}

type DeploymentResult = {
  success: boolean;
  contracts: {
    [key in TraitType]?: any;
  };
  error?: {
    stage?: string;
    message?: string;
    reason?: string | null;
    details?: any;
  };
};

// Initialize network and account
const networkObj = getNetwork(CONFIG.NETWORK);
const network = CONFIG.NETWORK;

// Define nonce offsets for each trait type
const nonceOffsets: { [key in TraitType]: number } = {
  [TraitType.DAO_TRAITS]: 0,
  [TraitType.DAO_BASE]: 1,
  [TraitType.POOL]: 2,
};

async function generateTraitContract(traitType: TraitType, senderAddress: string): Promise<string> {
  const eta = new Eta({ views: path.join(__dirname, "templates", "dao") });
  
  const data = {
    sip10_trait: getTraitReference(network, "SIP10"),
    sip09_trait: getTraitReference(network, "SIP09"),
    dao_base_trait: getTraitReference(network, "DAO_BASE"),
    dao_proposal_trait: getTraitReference(network, "DAO_PROPOSAL"),
    dao_extension_trait: getTraitReference(network, "DAO_EXTENSION"),
    creator: senderAddress,
  };

  return eta.render(`traits/${traitType}.clar`, data);
}

async function deployContract(
  sourceCode: string,
  traitType: TraitType,
  nextPossibleNonce: number
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const senderAddress = getAddressFromPrivateKey(key, networkObj.version);
    const theNextNonce = nextPossibleNonce + nonceOffsets[traitType];

    const contractName = traitType.toLowerCase();
    
    const deployOptions: SignedContractDeployOptions = {
      senderKey: key,
      contractName,
      codeBody: sourceCode,
      clarityVersion: 2,
      network: networkObj,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      nonce: theNextNonce,
      fee: BigInt(100_000), // 0.1 STX
    };

    const transaction = await makeContractDeploy(deployOptions);
    const broadcastResponse = await broadcastTransaction(transaction, networkObj);

    return {
      success: true,
      data: {
        contractPrincipal: `${address}.${contractName}`,
        transactionId: `0x${broadcastResponse.txid}`,
        sender: address
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message,
        details: error,
      },
    };
  }
}

async function main(): Promise<void> {
  const result: DeploymentResult = {
    success: false,
    contracts: {},
  };

  try {
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );
    
    const senderAddress = getAddressFromPrivateKey(key, networkObj.version);
    const nextPossibleNonce = await getNextNonce(network, senderAddress);

    // Deploy traits in order
    const traitsToProcess = [TraitType.DAO_TRAITS, TraitType.DAO_BASE, TraitType.POOL];

    for (const traitType of traitsToProcess) {
      console.log(`Generating and deploying ${traitType}...`);
      
      const sourceCode = await generateTraitContract(traitType, senderAddress);
      const deployResult = await deployContract(sourceCode, traitType, nextPossibleNonce);

      if (!deployResult.success) {
        result.error = {
          stage: `Deploying ${traitType}`,
          ...deployResult.error,
        };
        throw new Error(`Failed to deploy ${traitType}`);
      }

      result.contracts[traitType] = deployResult.data;
      console.log(`Successfully deployed ${traitType}`);
    }

    result.success = true;
  } catch (error: any) {
    if (!result.error) {
      result.error = {
        message: error.message,
        details: error,
      };
    }
    console.error("Deployment failed:", result.error);
  }

  console.log("Deployment result:", JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});