import { BaseCoreProposalRegistryEntry } from "../dao-core-proposal-registry";

// Messaging Proposals
export const COREPROPOSALS_ONCHAIN_MESSAGING: BaseCoreProposalRegistryEntry[] =
  [
    {
      name: "aibtc-onchain-messaging-send",
      friendlyName: "Onchain Messaging: Send Message",
      templatePath: "proposals/aibtc-onchain-messaging-send.clar",
      requiredRuntimeValues: [{ key: "message_to_send" }],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
      ],
    },
  ];
