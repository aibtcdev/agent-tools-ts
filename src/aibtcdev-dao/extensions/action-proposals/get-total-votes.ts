import {
  callReadOnlyFunction,
  cvToValue,
  getAddressFromPrivateKey,
  principalCV,
  uintCV,
} from "@stacks/transactions";
import { CONFIG, deriveChildAccount, getNetwork } from "../../../utilities";

// gets total votes from core proposal contract for a given voter

async function main() {
  const [
    daoActionProposalsExtensionContractAddress,
    daoActionProposalsExtensionContractName,
  ] = process.argv[2]?.split(".") || [];
  const proposalId = parseInt(process.argv[3]);
  const voterAddress = process.argv[4];

  if (
    !daoActionProposalsExtensionContractAddress ||
    !daoActionProposalsExtensionContractName ||
    !proposalId ||
    !voterAddress
  ) {
    console.log(
      "Usage: bun run get-total-votes.ts <daoActionProposalsExtensionContractAddress> <proposalId> <voterAddress>"
    );
    console.log(
      "- e.g. bun run get-total-votes.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-proposals 1 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA"
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
    functionName: "get-total-votes",
    functionArgs: [uintCV(proposalId), principalCV(voterAddress)],
    senderAddress,
    network: networkObj,
  });

  const parsedResult = cvToValue(result, true);
  console.log(parsedResult);
}

main().catch((error) => {
  error instanceof Error
    ? console.error(JSON.stringify({ success: false, message: error.message }))
    : console.error(JSON.stringify({ success: false, message: String(error) }));
  process.exit(1);
});
