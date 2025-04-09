import { BaseCoreProposalRegistryEntry } from "../dao-core-proposal-registry";

// Token Owner Proposals
export const COREPROPOSALS_TOKEN_OWNER: BaseCoreProposalRegistryEntry[] = [
  {
    name: "aibtc-token-owner-set-token-uri",
    friendlyName: "Token Owner: Set Token URI",
    templatePath: "proposals/aibtc-token-owner-set-token-uri.clar",
    requiredRuntimeValues: [{ key: "token_uri" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "token_owner_contract",
        category: "EXTENSIONS",
        subcategory: "TOKEN_OWNER",
      },
    ],
  },
  {
    name: "aibtc-token-owner-transfer-ownership",
    friendlyName: "Token Owner: Transfer Ownership",
    templatePath: "proposals/aibtc-token-owner-transfer-ownership.clar",
    requiredRuntimeValues: [{ key: "new_owner_address" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "token_owner_contract",
        category: "EXTENSIONS",
        subcategory: "TOKEN_OWNER",
      },
    ],
  },
];
