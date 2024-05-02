import { getAddressFromPublicKey } from "@stacks/transactions";
import { getTxVersion } from "../utilities";

async function main() {
  const pubKeys = ["array", "of hex", "pubkeys"];
  // get tx version object
  const txVersion = getTxVersion("mainnet");
  // convert public keys
  const addresses = pubKeys.map((pubKey) =>
    getAddressFromPublicKey(pubKey, txVersion)
  );
  // print addresses
  for (const address of addresses) {
    console.log(address.toString());
  }
}

main();
