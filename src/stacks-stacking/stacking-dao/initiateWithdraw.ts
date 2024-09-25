import {
  AnchorMode,
  broadcastTransaction,
  makeContractCall,
  principalCV,
  uintCV,
} from "@stacks/transactions";
import { bytesToHex } from "@stacks/common";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getStakingDaoContractID,
  logBroadCastResult,
  stakingDaoContractAddress,
  stakingDaoContractNames,
  stxToMicroStx,
} from "../../utilities";

// CONFIGURATION
const networkObj = getNetwork(CONFIG.NETWORK);

//sends transaction to initiateWithdraw on StakingDao Contract
async function initiateWithdraw(stxAmount: Number) {
  try {
    // get account info from env
    const network = CONFIG.NETWORK;
    const mnemonic = CONFIG.MNEMONIC;
    const accountIndex = CONFIG.ACCOUNT_INDEX;

    // get account address and private key
    const { address, key } = await deriveChildAccount(
      network,
      mnemonic,
      accountIndex
    );

    const amountInMicroStx = stxToMicroStx(Number(stxAmount));

    const transaction = await makeContractCall({
      contractAddress: stakingDaoContractAddress,
      contractName: stakingDaoContractNames.baseContract,
      functionName: "init-withdraw",
      functionArgs: [
        principalCV(
          getStakingDaoContractID(stakingDaoContractNames.reserveContract)
        ),
        principalCV(
          getStakingDaoContractID(stakingDaoContractNames.directHelpers)
        ),
        uintCV(amountInMicroStx),
      ],
      senderKey: key,
      validateWithAbi: true,
      network,
      anchorMode: AnchorMode.Any,
    });

    // To see the raw serialized transaction
    const serializedTx = transaction.serialize();
    const serializedTxHex = bytesToHex(serializedTx);
    console.log(`Serialized Transaction (Hex): ${serializedTxHex}`);

    // Broadcast the transaction
    const broadcastResponse = await broadcastTransaction(
      transaction,
      networkObj
    );
    return {
      from: address,
      ...broadcastResponse,
    };
  } catch (error) {
    console.error(`Error initiating withdrawl : ${error}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: bun run initiateWithdraw.ts <stxAmount>'");
    return;
  }
  const stxAmount = Number(args[0]);
  if (!stxAmount) {
    console.error("Please provide valid amount as argument");
    return;
  }
  let response = await initiateWithdraw(stxAmount);
  //return if response is null as the error  is logged by the returning function
  if (!response) {
    return;
  }
  logBroadCastResult(response, response.from);
}

main();
