// Export main components
export { ContractApiClient } from "./api/client";
export * from "./contracts/dao";
export * from "./contracts/token";
export * from "./contracts/agent-account";

// Main entry point for the package
if (import.meta.main) {
  console.log("AIBTC Cohort 0 Tools");
  console.log("====================");
  console.log("This package provides tools for working with AIBTC contracts via the API.");
  console.log("Import the modules you need or run one of the example scripts:");
  console.log("- bun run examples/query-contracts.ts");
  console.log("- bun run examples/generate-contracts.ts");
  console.log("- bun run examples/deploy-dao.ts");
}
