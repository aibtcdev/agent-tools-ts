// prelaunch-status-api.ts - Enhanced version using API
import { FaktorySDK } from "@faktoryfun/core-sdk";
import { CONFIG, deriveChildAccount } from "../utilities";
import dotenv from "dotenv";

dotenv.config();

const prelaunchContract = process.argv[2]; // Pre-launch contract address
const useAPI = process.argv[3] !== "false"; // Use API by default, pass "false" to force contract calls

if (!prelaunchContract) {
  console.error("Please provide the pre-launch contract address:");
  console.error(
    "bun run src/stacks-faktory/prelaunch-status-api.ts <prelaunch_contract> [use_api]"
  );
  console.error("Examples:");
  console.error(
    "  With API: bun run src/stacks-faktory/prelaunch-status-api.ts SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-pre-faktory"
  );
  console.error(
    "  Contract only: bun run src/stacks-faktory/prelaunch-status-api.ts SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-pre-faktory false"
  );
  process.exit(1);
}

const faktoryConfig = {
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
};

(async () => {
  try {
    const { address } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const sdk = new FaktorySDK(faktoryConfig);

    console.log(
      `Fetching pre-launch status${
        useAPI ? " (using API)" : " (contract calls only)"
      }...`
    );

    let status;
    if (useAPI) {
      status = await sdk.getPrelaunchInfoHybrid(
        prelaunchContract,
        address,
        true
      );
    } else {
      status = await sdk.getPrelaunchStatus(prelaunchContract, address);
    }

    // Extract data based on source
    const contractStatus = status.status.value.value;
    const userInfo = status.userInfo.value.value;
    const remainingSeats =
      status.remainingSeats.value.value["remainin-seats"].value;
    const maxSeatsAllowed = status.maxSeatsAllowed?.value || 0;

    // Get pricing info
    const contractType =
      status.contractType || FaktorySDK.detectContractType(prelaunchContract);
    const pricing = FaktorySDK.getSeatPricing(contractType);

    const result = {
      source: useAPI ? "API + Contract" : "Contract Only",
      contractType: contractType.toUpperCase(),
      pricing: pricing,
      contractInfo: {
        isDistributionPeriod: contractStatus["is-distribution-period"].value,
        totalUsers: contractStatus["total-users"].value,
        totalSeatsTaken: contractStatus["total-seats-taken"].value,
        distributionHeight:
          contractStatus["distribution-height"]?.value ||
          status.deploymentHeight,
        acceleratedVesting: contractStatus["accelerated-vesting"]?.value,
        marketOpen: contractStatus["market-open"]?.value,
        governanceActive: contractStatus["governance-active"]?.value,
      },
      userInfo: {
        seatsOwned: userInfo["seats-owned"].value,
        amountClaimed: userInfo["amount-claimed"]?.value || 0,
        claimableAmount: userInfo["claimable-amount"]?.value || 0,
      },
      marketInfo: {
        remainingSeats,
        maxSeatsAllowed,
        totalSeats: pricing.totalSeats,
        minUsers: pricing.minUsers,
        maxSeatsPerUser: pricing.maxSeatsPerUser,
        pricePerSeat: pricing.description,
      },
      constants: status.constants || {
        TOTAL_SEATS: pricing.totalSeats,
        MIN_USERS: pricing.minUsers,
        MAX_SEATS_PER_USER: pricing.maxSeatsPerUser,
      },
      blockInfo: {
        currentBlockHeight: status.currentBlockHeight,
        deploymentHeight: status.deploymentHeight,
      },
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error fetching pre-launch status:", error);
    process.exit(1);
  }
})();
