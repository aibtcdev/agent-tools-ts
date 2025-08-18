# Agent Account Registry Tooling Development Plan

## Overview
This document outlines the plan to create command-line tools for interacting with the `agent-account-registry.clar` contract. Each tool will correspond to a function in the contract, following existing coding patterns and conventions.

## General Structure for Tool Scripts
Each script will follow a consistent structure:
1.  **Imports**: Import necessary functions and types from `@stacks/transactions` and shared `utilities`.
2.  **Usage Information**: Define `usage` and `usageExample` constants for command-line help.
3.  **Argument Interface**: Define an `ExpectedArgs` interface for type-safe argument handling.
4.  **Argument Validation**: Implement a `validateArgs` function to parse and validate command-line arguments. It should throw descriptive errors.
5.  **Main Logic**: An async `main` function that:
    *   Calls `validateArgs`.
    *   Sets up network configuration and derives the sender's account.
    *   Constructs Clarity value arguments for the contract call.
    *   Executes the contract call (read-only or public).
    *   Processes and returns the result in a standardized `ToolResponse` format.
6.  **Execution**: A top-level call to `main()` with `.then()` and `.catch()` to handle asynchronous results and send them to the LLM.

---

## Public (Transactional) Function Tools
These scripts will create and broadcast transactions. They require the user's mnemonic in the environment configuration to sign the transaction.

### 1. `src/aibtc-cohort-0/agent-account-registry/public/register-agent-account.ts`
*   **Objective**: Create a script to call the `register-agent-account` function.
*   **Pseudo-code Plan**:
    1.  **Imports**: `Cl`, `makeContractCall`, `SignedContractCallOptions`, `PostConditionMode`, and standard utilities (`broadcastTx`, `CONFIG`, `deriveChildAccount`, etc.).
    2.  **Args**: `registryContract`, `agentAccountContract`.
    3.  **`validateArgs`**:
        *   Parse the two contract principal arguments.
        *   Validate both using `isValidContractPrincipal`.
    4.  **`main`**:
        *   Get network, derive sender account (`address`, `key`), and get nonce. **Note**: The contract requires `tx-sender` to be the `ATTESTOR_DEPLOYER`, so the script must be run using the deployer's credentials.
        *   Prepare `functionArgs`: `[Cl.principal(agentAccountContract)]`.
        *   Create `txOptions` for `makeContractCall` with `functionName: "register-agent-account"`.
        *   Set `postConditionMode` to `Deny` with empty `postConditions`.
        *   Call `makeContractCall` then `broadcastTx`.
        *   Return the broadcast response.

### 2. `src/aibtc-cohort-0/agent-account-registry/public/attest-agent-account.ts`
*   **Objective**: Create a script to call the `attest-agent-account` function.
*   **Pseudo-code Plan**:
    1.  **Imports**: Same as `register-agent-account.ts`.
    2.  **Args**: `registryContract`, `agentAccountToAttest`.
    3.  **`validateArgs`**:
        *   Parse the two contract principal arguments.
        *   Validate both using `isValidContractPrincipal`.
    4.  **`main`**:
        *   Get network, derive sender account, and get nonce. **Note**: The contract requires `tx-sender` to be a registered `ATTESTOR`, so the script must be run with an attestor's credentials.
        *   Prepare `functionArgs`: `[Cl.principal(agentAccountToAttest)]`.
        *   Create `txOptions` for `makeContractCall` with `functionName: "attest-agent-account"`.
        *   Set `postConditionMode` to `Deny` with empty `postConditions`.
        *   Call `makeContractCall` then `broadcastTx`.
        *   Return the broadcast response.

---

## Read-Only Function Tools
These scripts will query the contract's state without creating a transaction.

### 1. `src/aibtc-cohort-0/agent-account-registry/read-only/get-registry-config.ts`
*   **Objective**: Create a script to call the `get-registry-config` read-only function.
*   **Pseudo-code Plan**:
    1.  **Imports**: `fetchCallReadOnlyFunction`, `convertClarityTuple`, and standard utilities.
    2.  **Args**: `registryContract`.
    3.  **`validateArgs`**:
        *   Parse one contract principal argument and validate it.
    4.  **`main`**:
        *   Get network and derive a sender address for the read-only call.
        *   Call `fetchCallReadOnlyFunction` with `functionName: "get-registry-config"` and empty `functionArgs`.
        *   Convert the returned Clarity tuple to a JavaScript object using `convertClarityTuple`.
        *   Return a `ToolResponse` containing the configuration object.

### 2. `src/aibtc-cohort-0/agent-account-registry/read-only/get-agent-account-info.ts`
*   **Objective**: Create a script to call `get-agent-account-info`.
*   **Pseudo-code Plan**:
    1.  **Imports**: `fetchCallReadOnlyFunction`, `cvToValue`, `convertClarityTuple`, `Cl`, and standard utilities.
    2.  **Args**: `registryContract`, `agentAccountContract`.
    3.  **`validateArgs`**:
        *   Parse two contract principal arguments and validate them.
    4.  **`main`**:
        *   Get network and derive sender address.
        *   Prepare `functionArgs`: `[Cl.principal(agentAccountContract)]`.
        *   Call `fetchCallReadOnlyFunction` with `functionName: "get-agent-account-info"`.
        *   The result is an optional tuple. Use `cvToValue` to unwrap the optional.
        *   If the result is not `null`, use `convertClarityTuple` to convert the inner tuple to a JavaScript object.
        *   Return a `ToolResponse` with the info object or `null`.

### 3. `src/aibtc-cohort-0/agent-account-registry/read-only/get-agent-account-by-owner.ts`
*   **Objective**: Create a script to call `get-agent-account-by-owner`.
*   **Pseudo-code Plan**:
    1.  **Imports**: `fetchCallReadOnlyFunction`, `cvToValue`, `Cl`, and standard utilities.
    2.  **Args**: `registryContract`, `ownerPrincipal`.
    3.  **`validateArgs`**:
        *   Parse a contract principal and a standard principal. Validate both.
    4.  **`main`**:
        *   Get network and derive sender address.
        *   Prepare `functionArgs`: `[Cl.principal(ownerPrincipal)]`.
        *   Call `fetchCallReadOnlyFunction` with `functionName: "get-agent-account-by-owner"`.
        *   Convert the result (an optional principal) with `cvToValue`.
        *   Return a `ToolResponse` with the agent account address string or `null`.

### 4. `src/aibtc-cohort-0/agent-account-registry/read-only/get-agent-account-by-agent.ts`
*   **Objective**: Create a script to call `get-agent-account-by-agent`.
*   **Pseudo-code Plan**:
    1.  **Imports**: `fetchCallReadOnlyFunction`, `cvToValue`, `Cl`, and standard utilities.
    2.  **Args**: `registryContract`, `agentPrincipal`.
    3.  **`validateArgs`**:
        *   Parse a contract principal and a standard principal. Validate both.
    4.  **`main`**:
        *   Get network and derive sender address.
        *   Prepare `functionArgs`: `[Cl.principal(agentPrincipal)]`.
        *   Call `fetchCallReadOnlyFunction` with `functionName: "get-agent-account-by-agent"`.
        *   Convert the result (an optional principal) with `cvToValue`.
        *   Return a `ToolResponse` with the agent account address string or `null`.

### 5. `src/aibtc-cohort-0/agent-account-registry/read-only/get-account-attestors.ts`
*   **Objective**: Create a script to call `get-account-attestors`.
*   **Pseudo-code Plan**:
    1.  **Imports**: `fetchCallReadOnlyFunction`, `convertClarityTuple`, `Cl`, and standard utilities.
    2.  **Args**: `registryContract`, `agentAccountContract`.
    3.  **`validateArgs`**:
        *   Parse two contract principal arguments and validate them.
    4.  **`main`**:
        *   Get network and derive sender address.
        *   Prepare `functionArgs`: `[Cl.principal(agentAccountContract)]`.
        *   Call `fetchCallReadOnlyFunction` with `functionName: "get-account-attestors"`.
        *   Convert the result (a tuple of booleans) with `convertClarityTuple`.
        *   Return a `ToolResponse` with the attestor status object.

---

## Testing
Create a test script `tests/test-agent-account-registry-tools.ts` to execute all the newly created tool scripts and verify their functionality.

### 1. `tests/test-agent-account-registry-tools.ts`
*   **Objective**: Create a comprehensive test suite for all agent account registry tools.
*   **Pseudo-code Plan**:
    1.  **Configuration**: Define constants for the `REGISTRY_CONTRACT`, `AGENT_ACCOUNT_TO_REGISTER`, `OWNER_PRINCIPAL`, and `AGENT_PRINCIPAL`.
    2.  **Test Runner**: Use the `runTool` and `delay` helper functions from the existing `test-agent-account-tools.ts` example.
    3.  **Test Sequence**:
        *   Call all read-only tools first to check initial state:
            *   `get-registry-config`
            *   `get-agent-account-info` (for a known account)
            *   `get-agent-account-by-owner`
            *   `get-agent-account-by-agent`
            *   `get-account-attestors`
        *   Execute a `register-agent-account` call.
        *   Execute an `attest-agent-account` call.
        *   Re-run the read-only tools to verify the state changes after the transactions.
    4.  **Summary**: Keep track of `successCount` and `failureCount` and print a summary at the end. Exit with code 1 on failure.

---

## Testing
Create a test script `tests/test-agent-account-registry-tools.ts` to execute all the newly created tool scripts and verify their functionality.

### 1. `tests/test-agent-account-registry-tools.ts`
*   **Objective**: Create a comprehensive test suite for all agent account registry tools.
*   **Pseudo-code Plan**:
    1.  **Configuration**: Define constants for the `REGISTRY_CONTRACT`, `AGENT_ACCOUNT_TO_REGISTER`, `OWNER_PRINCIPAL`, and `AGENT_PRINCIPAL`.
    2.  **Test Runner**: Use the `runTool` and `delay` helper functions from the existing `test-agent-account-tools.ts` example.
    3.  **Test Sequence**:
        *   Call all read-only tools first to check initial state:
            *   `get-registry-config`
            *   `get-agent-account-info` (for a known account)
            *   `get-agent-account-by-owner`
            *   `get-agent-account-by-agent`
            *   `get-account-attestors`
        *   Execute a `register-agent-account` call.
        *   Execute an `attest-agent-account` call.
        *   Re-run the read-only tools to verify the state changes after the transactions.
    4.  **Summary**: Keep track of `successCount` and `failureCount` and print a summary at the end. Exit with code 1 on failure.
