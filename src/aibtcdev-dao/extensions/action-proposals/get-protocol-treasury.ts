import {
  callReadOnlyFunction,
  ClarityType,
  cvToJSON,
  getAddressFromPrivateKey,
} from "@stacks/transactions";
import { CONFIG, deriveChildAccount, getNetwork } from "../../../utilities";

// gets set protocol treasury in action proposal contract
async function main() {
  const [
    daoActionProposalsExtensionContractAddress,
    daoActionProposalsExtensionContractName,
  ] = process.argv[2]?.split(".") || [];

  if (
    !daoActionProposalsExtensionContractAddress ||
    !daoActionProposalsExtensionContractName
  ) {
    console.log(
      "Usage: bun run get-protocol-treasury.ts <daoActionProposalsExtensionContractAddress>"
    );
    console.log(
      "- e.g. bun run get-protocol-treasury.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-proposals"
    );

    process.exit(1);
  }

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const senderAddress = getAddressFromPrivateKey(key, networkObj.version);

  const result = await callReadOnlyFunction({
    contractAddress: daoActionProposalsExtensionContractAddress,
    contractName: daoActionProposalsExtensionContractName,
    functionName: "get-protocol-treasury",
    functionArgs: [],
    senderAddress,
    network: networkObj,
  });

  if (result.type === ClarityType.OptionalNone) {
    console.log("Contract has not been initialized with a treasury contract");
  }
  if (result.type === ClarityType.OptionalSome) {
    const jsonResult = cvToJSON(result);
    // TODO: might need a better way to display the result
    console.log(jsonResult);
  }
}

main().catch((error) => {
  error instanceof Error
    ? console.error(JSON.stringify({ success: false, message: error.message }))
    : console.error(JSON.stringify({ success: false, message: String(error) }));
  process.exit(1);
});
