import { KnownAddresses, TraitReferenceUnion } from "../types/dao-types-v2";

export interface ExtensionRegistryEntry {
  id: string;
  contractNamePattern: string;
  templatePath: string;
  requiredTraits: Array<
    TraitReferenceUnion & {
      key: string; // e.g. used for injecting into your template
    }
  >;
  requiredAddresses?: Array<{
    ref: keyof KnownAddresses;
    key: string;
  }>;
}
/**
 * Central registry for each extension or proposal.
 * Just keep adding more entries as your DAO grows.
 */
export const EXTENSION_REGISTRY: ExtensionRegistryEntry[] = [
  {
    id: "ACTION_PROPOSALS",
    contractNamePattern: "SYMBOL-action-proposals",
    templatePath: "extensions/action-proposals.clar", // E.g. "extensions" folder
    requiredTraits: [
      {
        category: "EXTENSIONS",
        contract: "EXTENSION",
        key: "extension_trait",
      },
      {
        category: "EXTENSIONS",
        contract: "ACTION_PROPOSALS",
        key: "action_proposals_trait",
      },
      {
        category: "STANDARDS",
        contract: "SIP010",
        key: "sip10_trait",
      },
    ],
    requiredAddresses: [
      { ref: "DEPLOYER", key: "senderAddress" },
      // etc...
    ],
  },
  {
    id: "BANK_ACCOUNT",
    contractNamePattern: "SYMBOL-bank-account",
    templatePath: "extensions/bank-account.clar",
    requiredTraits: [
      { category: "EXTENSIONS", contract: "EXTENSION", key: "extension_trait" },
      {
        category: "EXTENSIONS",
        contract: "BANK_ACCOUNT",
        key: "bank_account_trait",
      },
    ],
  },
  // add more as needed...
];
