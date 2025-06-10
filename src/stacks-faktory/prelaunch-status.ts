// prelaunch-status.ts - Utility script to check status
import { FaktorySDK } from "@faktoryfun/core-sdk";
import { CONFIG, deriveChildAccount } from "../utilities";
import dotenv from "dotenv";

dotenv.config();

const prelaunchContract = process.argv[2]; // Pre-launch contract address

if (!prelaunchContract) {
  console.error("Please provide the pre-launch contract address:");
  console.error("ts-node src/faktory/prelaunch-status.ts <prelaunch_contract>");
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

    console.log("Fetching pre-launch status...");
    const status = await sdk.getPrelaunchStatus(prelaunchContract, address);

    const contractStatus = status.status.value.value;
    const userInfo = status.userInfo.value.value;
    const remainingSeats =
      status.remainingSeats.value.value["remainin-seats"].value;
    const maxSeatsAllowed = status.maxSeatsAllowed.value;
    const seatHolders = status.seatHolders.value.value["seat-holders"].value;

    const result = {
      contractInfo: {
        isDistributionPeriod: contractStatus["is-distribution-period"].value,
        totalUsers: contractStatus["total-users"].value,
        totalSeatsTaken: contractStatus["total-seats-taken"].value,
        distributionHeight: contractStatus["distribution-height"].value,
        acceleratedVesting: contractStatus["accelerated-vesting"].value,
        marketOpen: contractStatus["market-open"].value,
        governanceActive: contractStatus["governance-active"].value,
      },
      userInfo: {
        seatsOwned: userInfo["seats-owned"].value,
        amountClaimed: userInfo["amount-claimed"].value,
        claimableAmount: userInfo["claimable-amount"].value,
      },
      marketInfo: {
        remainingSeats,
        maxSeatsAllowed,
        pricePerSeat: "69,000 satoshis (0.00069000 BTC)",
        totalSeats: 20,
      },
      seatHolders: seatHolders.map((holder: any) => ({
        owner: holder.value.owner.value,
        seats: holder.value.seats.value,
      })),
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error fetching pre-launch status:", error);
    process.exit(1);
  }
})();
