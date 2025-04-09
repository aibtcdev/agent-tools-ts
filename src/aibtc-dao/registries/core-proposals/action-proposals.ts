import { BaseCoreProposalRegistryEntry } from "../dao-core-proposal-registry";

// Action Proposals
export const COREPROPOSALS_ACTION_PROPOSALS: BaseCoreProposalRegistryEntry[] = [
  {
    name: "aibtc-action-proposals-set-proposal-bond",
    friendlyName: "Action Proposals: Set Proposal Bond",
    templatePath: "proposals/aibtc-action-proposals-set-proposal-bond.clar",
    requiredRuntimeValues: [{ key: "bond_amount" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "action_proposal_contract",
        category: "EXTENSIONS",
        subcategory: "ACTION_PROPOSALS",
      },
    ],
  },
];
