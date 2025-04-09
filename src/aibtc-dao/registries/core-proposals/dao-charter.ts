import { BaseCoreProposalRegistryEntry } from "../dao-core-proposal-registry";

// DAO Charter Proposals
export const COREPROPOSALS_DAO_CHARTER: BaseCoreProposalRegistryEntry[] = [
  {
    name: "aibtc-dao-charter-set-dao-charter",
    friendlyName: "DAO Charter: Set DAO Charter",
    templatePath: "proposals/aibtc-dao-charter-set-dao-charter.clar",
    requiredRuntimeValues: [
      { key: "dao_charter_text" },
      { key: "dao_charter_inscription_id" },
    ],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "charter_contract",
        category: "EXTENSIONS",
        subcategory: "CHARTER",
      },
    ],
  },
];
