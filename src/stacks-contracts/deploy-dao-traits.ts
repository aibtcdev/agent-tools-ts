import { getAddressFromPrivateKey } from "@stacks/transactions";
import { CONFIG, deriveChildAccount, getNetwork, getNextNonce } from "../utilities";
import { TraitType, DeploymentResult } from "./types/dao-types";
import { ContractGenerator } from "./services/contract-generator";
import { ContractDeployer } from "./services/contract-deployer";

// Define nonce offsets for each trait type
const nonceOffsets: { [key in TraitType]: number } = {
  [TraitType.SIP10]: 0,
  [TraitType.SIP09]: 1,
  [TraitType.DAO_TRAITS]: 2,
  [TraitType.DAO_BASE]: 3,
  [TraitType.POOL]: 4,
};

async function main() {
  try {
    const result: DeploymentResult = {
      success: false,
      contracts: {},
    };

    const networkObj = getNetwork(CONFIG.NETWORK);
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const senderAddress = getAddressFromPrivateKey(key, networkObj.version);
    const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, senderAddress);

    const contractGenerator = new ContractGenerator(CONFIG.NETWORK, senderAddress);
    const contractDeployer = new ContractDeployer(CONFIG.NETWORK);

    // Deploy each trait contract
    for (const traitType of Object.values(TraitType)) {
      const contractSource = await contractGenerator.generateTraitContract(traitType);
      const contractName = traitType.toLowerCase();
      const nonce = nextPossibleNonce + nonceOffsets[traitType];

      const deployment = await contractDeployer.deployContract(
        contractSource,
        traitType,
        contractName,
        nonce
      );

      if (!deployment.success) {
        result.error = {
          stage: traitType,
          ...deployment.error,
        };
        return result;
      }

      result.contracts[traitType.toString()] = deployment.data;
    }

    result.success = true;
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error(JSON.stringify({ success: false, message: error.message }));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ success: false, message: error.message }));
  process.exit(1);
});