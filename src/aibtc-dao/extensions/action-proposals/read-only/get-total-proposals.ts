import {
  callReadOnlyFunction,
  cvToValue,
  getAddressFromPrivateKey,
} from "@stacks/transactions";
import { CONFIG, deriveChildAccount, getNetwork } from "../../../../utilities";

// gets total proposals in action proposal contract
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
      "Usage: bun run get-total-proposals.ts <daoActionProposalExtensionContract>"
    );
    console.log(
      "- e.g. bun run get-total-proposals.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-proposals"
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
    functionName: "get-total-proposals",
    functionArgs: [],
    senderAddress,
    network: networkObj,
  });

  console.log(cvToValue(result));
}

main().catch((error) => {
  error instanceof Error
    ? console.error(JSON.stringify({ success: false, message: error.message }))
    : console.error(JSON.stringify({ success: false, message: String(error) }));
  process.exit(1);
});
