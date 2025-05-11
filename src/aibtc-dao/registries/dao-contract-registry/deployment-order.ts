/**
 * Centralized deployment order for all contracts in the DAO.
 * This order is based on the deployment plan in the simnet-plan.yaml file.
 *
 * Lower numbers deploy first. Contracts with the same number can be deployed in any order.
 */

// Define an interface for the contract objects
interface Contract {
  name: keyof typeof DEPLOYMENT_ORDER;
  type: string;
  subtype: string;
  requiredContractAddresses?: Array<{
    category: string;
    subcategory: string;
  }>;
}

/**
 * Generate deployment orders for multiple copies of a contract
 *
 * @param baseContractName The base contract name
 * @param baseOrder The base deployment order
 * @param count Number of copies
 * @param nameFormat Optional format string (default: "{name}-{index}")
 * @returns Record of contract names to deployment orders
 */
function generateCopiesDeploymentOrder(
  baseContractName: string,
  baseOrder: number,
  count: number,
  nameFormat: string = "{name}-{index}"
): Record<string, number> {
  const result: Record<string, number> = {};

  for (let i = 1; i <= count; i++) {
    const name = nameFormat
      .replace("{name}", baseContractName)
      .replace("{index}", i.toString());

    // Each copy gets a slightly higher deployment order
    // to ensure they deploy in sequence
    result[name] = baseOrder + i * 0.1;
  }

  return result;
}

export const DEPLOYMENT_ORDER = {
  // Batch 2 - Token contracts
  "aibtc-pre-faktory": 10,
  "aibtc-faktory": 11,

  // Batch 3 - Base contracts and extensions
  "aibtc-base-dao": 20,
  "faktory-trait-v1": 21,
  "aibtc-dao-traits-v3": 22,
  "aibtc-dao-v2": 23,

  // Token contracts continued
  "xyk-pool-sbtc-aibtc-v-1-1": 30,
  "xyk-pool-stx-aibtc-v-1-1": 31,
  "aibtc-faktory-dex": 32,

  // Extensions - first wave
  "aibtc-action-proposals-v2": 40,
  "aibtc-core-proposals-v2": 41,
  "aibtc-timed-vault-dao": 42,
  "aibtc-timed-vault-sbtc": 43,
  "aibtc-timed-vault-stx": 44,

  // Timed vault copies
  ...generateCopiesDeploymentOrder("aibtc-timed-vault-dao", 42, 5),
  ...generateCopiesDeploymentOrder("aibtc-timed-vault-sbtc", 43, 5),
  ...generateCopiesDeploymentOrder("aibtc-timed-vault-stx", 44, 5),

  // Extensions - second wave
  "aibtc-dao-charter": 50,
  "aibtc-onchain-messaging": 51,
  "aibtc-payment-processor-dao": 52,
  "aibtc-payment-processor-sbtc": 53,
  "aibtc-payment-processor-stx": 54,
  "aibtc-token-owner": 55,
  "aibtc-treasury": 56,

  // Actions - first wave
  "aibtc-action-pmt-dao-add-resource": 60,
  "aibtc-action-pmt-dao-toggle-resource": 61,
  "aibtc-action-pmt-sbtc-add-resource": 62,
  "aibtc-action-pmt-sbtc-toggle-resource": 63,
  "aibtc-action-pmt-stx-add-resource": 64,
  "aibtc-action-pmt-stx-toggle-resource": 65,

  // Actions - second wave
  "aibtc-action-treasury-allow-asset": 70,

  // Actions - third wave
  "aibtc-action-configure-timed-vault-dao": 80,
  "aibtc-action-configure-timed-vault-sbtc": 81,
  "aibtc-action-configure-timed-vault-stx": 82,
  "aibtc-action-send-message": 83,

  // Bootstrap proposal - always last
  "aibtc-base-bootstrap-initialization-v2": 90,
};

/**
 * Utility function to visualize the deployment order of all contracts
 */
export function visualizeDeploymentOrder(contracts: Contract[]) {
  // Sort contracts by deployment order
  const sortedContracts = [...contracts].sort(
    (a, b) => DEPLOYMENT_ORDER[a.name] - DEPLOYMENT_ORDER[b.name]
  );

  // Group contracts by deployment order
  const groupedContracts: Record<number, Contract[]> = {};

  for (const contract of sortedContracts) {
    const order = DEPLOYMENT_ORDER[contract.name];
    if (!groupedContracts[order]) {
      groupedContracts[order] = [];
    }
    groupedContracts[order].push(contract);
  }

  // Format the output
  console.log("=== DEPLOYMENT ORDER ===");

  Object.keys(groupedContracts)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((order) => {
      console.log(`\nDEPLOYMENT GROUP ${order}:`);
      groupedContracts[Number(order)].forEach((contract) => {
        console.log(
          `  - ${contract.name} (${contract.type}/${contract.subtype})`
        );
      });
    });
}

/**
 * Validates that the deployment order respects all dependencies
 */
export function validateDeploymentOrder(contracts: Contract[]) {
  const errors: string[] = [];
  const contractsByTypeAndSubtype = new Map<string, Contract>();

  // Index contracts by type and subtype
  for (const contract of contracts) {
    const key = `${contract.type}/${contract.subtype}`;
    contractsByTypeAndSubtype.set(key, contract);
  }

  // Check dependencies
  for (const contract of contracts) {
    if (contract.requiredContractAddresses) {
      for (const dependency of contract.requiredContractAddresses) {
        const key = `${dependency.category}/${dependency.subcategory}`;
        const dependencyContract = contractsByTypeAndSubtype.get(key);

        if (dependencyContract) {
          const contractOrder = DEPLOYMENT_ORDER[contract.name];
          const dependencyOrder = DEPLOYMENT_ORDER[dependencyContract.name];

          if (dependencyOrder >= contractOrder) {
            errors.push(
              `Deployment order issue: ${contract.name} (order ${contractOrder}) ` +
                `depends on ${dependencyContract.name} (order ${dependencyOrder})`
            );
          }
        }
      }
    }
  }

  return errors;
}
