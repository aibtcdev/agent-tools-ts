import {
  AnchorMode,
  broadcastTransaction,
  makeContractCall,
  noneCV,
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

//sends transaction to deposit on StakingDao contract
async function deposit(stxAmount: Number, referrer: string | null) {
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
      functionName: "deposit",
      functionArgs: [
        principalCV(
          getStakingDaoContractID(stakingDaoContractNames.reserveContract)
        ),
        principalCV(
          getStakingDaoContractID(stakingDaoContractNames.commissionContract)
        ),
        principalCV(
          getStakingDaoContractID(stakingDaoContractNames.stakingContract)
        ),
        principalCV(
          getStakingDaoContractID(stakingDaoContractNames.directHelpers)
        ),
        uintCV(amountInMicroStx),
        referrer ? principalCV(referrer) : noneCV(),
        noneCV(),
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
    console.error(`Error making deposit : ${error}`);
    return null;
  }
}

async function main() {
  // Get the amount(stx) , referrer in order from command line arguments and call deposit

  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: bun run deposit.ts <stxAmount> <referrer>(optional)'");
    return;
  }
  const stxAmount = Number(args[0]);
  const referrer = args.length > 1 ? args[1] : null;

  if (!stxAmount) {
    console.error("Please provide valid amount as argument");
    return;
  }
  let response = await deposit(stxAmount, referrer);
  //return if response is null as the error  is logged by the returning function
  if (!response) {
    return;
  }
  logBroadCastResult(response, response.from);
}

main();
