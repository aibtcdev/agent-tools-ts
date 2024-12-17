import { createClient } from "@stacks/blockchain-api-client";

export const createStacksClient = (baseUrl: string) => {
  const client = createClient({
    baseUrl,
  });

  client.use({
    onRequest({ request }) {
      request.headers.set("x-hiro-api-key", String(process.env.STACKS_API_KEY));
      return request;
    },
  });

  return client;
};
