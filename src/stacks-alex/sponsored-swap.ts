import { AlexSDK, Currency } from "alex-sdk";

async function runSponsoredSwap(
  address: string,
  fromCurrency: string,
  toCurrency: string,
  amount: string,
  minToReceive: string = "0"
) {
  try {
    // Initialize the SDK
    const alex = new AlexSDK();

    // Check if sponsored transaction service is available
    const isSponsorAvailable = await alex.isSponsoredTxServiceAvailable();
    if (!isSponsorAvailable) {
      throw new Error("Sponsored transaction service is currently unavailable");
    }

    // Validate address format (basic check)
    if (!address.startsWith("ST") && !address.startsWith("SM")) {
      throw new Error(
        "Invalid STX address format. Address should start with ST or SM."
      );
    }

    // Validate currencies
    if (!(fromCurrency in Currency) || !(toCurrency in Currency)) {
      throw new Error(
        "Invalid currency. Use one of: " + Object.keys(Currency).join(", ")
      );
    }

    // Parse amounts
    const parsedAmount = parseFloat(amount);
    const parsedMinToReceive = parseFloat(minToReceive);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Invalid amount. Please provide a positive number.");
    }

    if (isNaN(parsedMinToReceive) || parsedMinToReceive < 0) {
      throw new Error(
        "Invalid minimum to receive. Please provide a non-negative number."
      );
    }

    // Get estimated amount to receive for info display
    const microunits = BigInt(Math.floor(parsedAmount * 1e8));
    const minMicrounits = BigInt(Math.floor(parsedMinToReceive * 1e8));

    const estimatedToReceive = await alex.getAmountToForSponsoredTx(
      Currency[fromCurrency as keyof typeof Currency],
      microunits,
      Currency[toCurrency as keyof typeof Currency]
    );

    // If zero, sponsor fee would be more than the amount
    if (estimatedToReceive === BigInt(0)) {
      throw new Error(
        "Swap amount is too small to cover the sponsored transaction fee"
      );
    }

    console.log(`\nSponsored Swap Summary:`);
    console.log(`From: ${parsedAmount} ${fromCurrency}`);
    console.log(
      `Estimated to receive: ${Number(estimatedToReceive) / 1e8} ${toCurrency}`
    );
    console.log(`Minimum to receive: ${parsedMinToReceive} ${toCurrency}`);
    console.log(`Transaction will be sponsored (no STX fee required)\n`);

    // Generate the sponsored transaction
    const tx = await alex.runSwapForSponsoredTx(
      address,
      Currency[fromCurrency as keyof typeof Currency],
      Currency[toCurrency as keyof typeof Currency],
      microunits,
      minMicrounits
    );

    console.log(`Generated sponsored swap transaction:`);
    console.log(JSON.stringify(tx, null, 2));

    console.log(`\nNote: This transaction needs to be signed and broadcasted.`);
    console.log(`After signing, you can broadcast it with:`);
    console.log(`bun sponsored-broadcast.ts <signedTransaction>`);

    return tx;
  } catch (error) {
    console.error("Error generating sponsored swap transaction:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 4) {
  console.log(
    "Usage: bun sponsored-swap.ts <address> <fromCurrency> <toCurrency> <amount> [minToReceive]"
  );
  console.log(
    "Example: bun sponsored-swap.ts ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG STX ALEX 100 0"
  );
  process.exit(1);
}

const address = args[0];
const fromCurrency = args[1];
const toCurrency = args[2];
const amount = args[3];
const minToReceive = args[4] || "0";

// Execute the function
await runSponsoredSwap(address, fromCurrency, toCurrency, amount, minToReceive);

export {};
