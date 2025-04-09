import { BaseCoreProposalRegistryEntry } from "../dao-core-proposal-registry";

// Core Proposals
export const COREPROPOSALS_CORE_PROPOSALS: BaseCoreProposalRegistryEntry[] = [
  {
    name: "aibtc-core-proposals-set-proposal-bond",
    friendlyName: "Core Proposals: Set Proposal Bond",
    templatePath: "proposals/aibtc-core-proposals-set-proposal-bond.clar",
    requiredRuntimeValues: [{ key: "bond_amount" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "core_proposals_contract",
        category: "EXTENSIONS",
        subcategory: "CORE_PROPOSALS",
      },
    ],
  },
];
