import { AlexSDK, Currency } from "alex-sdk";

async function getAmountTo(
  fromCurrency: string,
  amount: string,
  toCurrency: string
) {
  try {
    // Initialize the SDK
    const alex = new AlexSDK();

    // Validate currencies
    if (!(fromCurrency in Currency) || !(toCurrency in Currency)) {
      throw new Error(
        "Invalid currency. Use one of: " + Object.keys(Currency).join(", ")
      );
    }

    // Parse amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      throw new Error("Invalid amount. Please provide a valid number.");
    }

    // Convert to microunits (most tokens use 8 decimal places)
    const microunits = BigInt(Math.floor(parsedAmount * 1e8));

    // Get the amount that will be received when swapping
    const amountTo = await alex.getAmountTo(
      Currency[fromCurrency as keyof typeof Currency],
      microunits,
      Currency[toCurrency as keyof typeof Currency]
    );

    // Convert back from microunits for display
    const readableAmount = Number(amountTo) / 1e8;

    console.log(
      `When swapping ${parsedAmount} ${fromCurrency} to ${toCurrency}, you'll receive: ${readableAmount} ${toCurrency}`
    );
    return readableAmount;
  } catch (error) {
    console.error("Error getting amount to receive:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log(
    "Usage: bun get-amount-to.ts <fromCurrency> <amount> <toCurrency>"
  );
  console.log("Example: bun get-amount-to.ts STX 100 ALEX");
  process.exit(1);
}

const fromCurrency = args[0];
const amount = args[1];
const toCurrency = args[2];

// Execute the function
await getAmountTo(fromCurrency, amount, toCurrency);

export {};
