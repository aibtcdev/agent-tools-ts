type PriceHistory = {
  block_height: number;
  sync_at: number;
  token: string;
  avg_price_usd: number;
};

type TokenPrice = {
  token: string;
  prices: PriceHistory[];
};

// New function to get the price history of a token
async function getTokenPriceHistory(token: string): Promise<TokenPrice> {
  const response = await fetch(
    `https://api.alexgo.io/v1/price_history/${token}?limit=10000`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get token price history: ${response.statusText}`
    );
  }

  const data = (await response.json()) as TokenPrice;
  return data;
}

// Capture the token from command-line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide a token as an argument.");
  process.exit(1);
}

const token = args[0];
getTokenPriceHistory(token)
  .then((tokenPrice) => {
    console.log(`Token: ${tokenPrice.token}`);
    tokenPrice.prices.forEach((price) => {
      console.log(
        `Block Height: ${price.block_height}, Price: ${price.avg_price_usd}`
      );
    });
  })
  .catch((error) => {
    console.error(error);
  });
