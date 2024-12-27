// src/index.ts

// Re-export everything from stacks-dao
export { DaoSDK, Executor, Treasury, Messaging, Payments } from "./stacks-dao";
export * from "./stacks-dao/types";

// Namespaced export for compatibility
import * as daoNamespace from "./stacks-dao";
export { daoNamespace as dao };
