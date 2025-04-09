import { BaseCoreProposalRegistryEntry } from "../dao-core-proposal-registry";

// payment processor proposals
export const COREPROPOSALS_PAYMENT_PROCESSOR: BaseCoreProposalRegistryEntry[] =
  [
    {
      name: "aibtc-pmt-dao-add-resource",
      friendlyName: "Payment Processor (DAO): Add Resource",
      templatePath: "proposals/aibtc-pmt-dao-add-resource.clar",
      requiredRuntimeValues: [
        { key: "resource_name" },
        { key: "resource_description" },
        { key: "resource_amount" },
        { key: "resource_url" },
      ],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
        {
          key: "payment_processor_dao_contract",
          category: "EXTENSIONS",
          subcategory: "PAYMENTS_DAO",
        },
      ],
    },
    {
      name: "aibtc-pmt-dao-set-payment-address",
      friendlyName: "Payment Processor (DAO): Set Payment Address",
      templatePath: "proposals/aibtc-pmt-dao-set-payment-address.clar",
      requiredRuntimeValues: [{ key: "payout_address" }],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
        {
          key: "payment_processor_dao_contract",
          category: "EXTENSIONS",
          subcategory: "PAYMENTS_DAO",
        },
      ],
    },
    {
      name: "aibtc-pmt-dao-toggle-resource-by-name",
      friendlyName: "Payment Processor (DAO): Toggle Resource By Name",
      templatePath: "proposals/aibtc-pmt-dao-toggle-resource-by-name.clar",
      requiredRuntimeValues: [{ key: "resource_name" }],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
        {
          key: "payment_processor_dao_contract",
          category: "EXTENSIONS",
          subcategory: "PAYMENTS_DAO",
        },
      ],
    },
    {
      name: "aibtc-pmt-dao-toggle-resource",
      friendlyName: "Payment Processor (DAO): Toggle Resource",
      templatePath: "proposals/aibtc-pmt-dao-toggle-resource.clar",
      requiredRuntimeValues: [{ key: "resource_index" }],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
        {
          key: "payment_processor_dao_contract",
          category: "EXTENSIONS",
          subcategory: "PAYMENTS_DAO",
        },
      ],
    },
    {
      name: "aibtc-pmt-dao-toggle-resource",
      friendlyName: "Payment Processor (DAO): Toggle Resource",
      templatePath: "proposals/aibtc-pmt-dao-toggle-resource.clar",
      requiredRuntimeValues: [{ key: "resource_index" }],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
        {
          key: "payment_processor_dao_contract",
          category: "EXTENSIONS",
          subcategory: "PAYMENTS_DAO",
        },
      ],
    },
    {
      name: "aibtc-pmt-sbtc-add-resource",
      friendlyName: "Payment Processor (SBTC): Add Resource",
      templatePath: "proposals/aibtc-pmt-sbtc-add-resource.clar",
      requiredRuntimeValues: [
        { key: "resource_name" },
        { key: "resource_description" },
        { key: "resource_amount" },
        { key: "resource_url" },
      ],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
        {
          key: "payment_processor_sbtc_contract",
          category: "EXTENSIONS",
          subcategory: "PAYMENTS_SBTC",
        },
      ],
    },
    {
      name: "aibtc-pmt-sbtc-set-payment-address",
      friendlyName: "Payment Processor (SBTC): Set Payment Address",
      templatePath: "proposals/aibtc-pmt-sbtc-set-payment-address.clar",
      requiredRuntimeValues: [{ key: "payout_address" }],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
        {
          key: "payment_processor_sbtc_contract",
          category: "EXTENSIONS",
          subcategory: "PAYMENTS_SBTC",
        },
      ],
    },
    {
      name: "aibtc-pmt-sbtc-toggle-resource-by-name",
      friendlyName: "Payment Processor (SBTC): Toggle Resource By Name",
      templatePath: "proposals/aibtc-pmt-sbtc-toggle-resource-by-name.clar",
      requiredRuntimeValues: [{ key: "resource_name" }],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
        {
          key: "payment_processor_sbtc_contract",
          category: "EXTENSIONS",
          subcategory: "PAYMENTS_SBTC",
        },
      ],
    },
    {
      name: "aibtc-pmt-sbtc-toggle-resource",
      friendlyName: "Payment Processor (SBTC): Toggle Resource",
      templatePath: "proposals/aibtc-pmt-sbtc-toggle-resource.clar",
      requiredRuntimeValues: [{ key: "resource_index" }],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
        {
          key: "payment_processor_sbtc_contract",
          category: "EXTENSIONS",
          subcategory: "PAYMENTS_SBTC",
        },
      ],
    },
    {
      name: "aibtc-pmt-stx-add-resource",
      friendlyName: "Payment Processor (STX): Add Resource",
      templatePath: "proposals/aibtc-pmt-stx-add-resource.clar",
      requiredRuntimeValues: [
        { key: "resource_name" },
        { key: "resource_description" },
        { key: "resource_amount" },
        { key: "resource_url" },
      ],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
        {
          key: "payment_processor_stx_contract",
          category: "EXTENSIONS",
          subcategory: "PAYMENTS_STX",
        },
      ],
    },
    {
      name: "aibtc-pmt-stx-set-payment-address",
      friendlyName: "Payment Processor (STX): Set Payment Address",
      templatePath: "proposals/aibtc-pmt-stx-set-payment-address.clar",
      requiredRuntimeValues: [{ key: "payout_address" }],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
        {
          key: "payment_processor_stx_contract",
          category: "EXTENSIONS",
          subcategory: "PAYMENTS_STX",
        },
      ],
    },
    {
      name: "aibtc-pmt-stx-toggle-resource-by-name",
      friendlyName: "Payment Processor (STX): Toggle Resource By Name",
      templatePath: "proposals/aibtc-pmt-stx-toggle-resource-by-name.clar",
      requiredRuntimeValues: [{ key: "resource_name" }],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
        {
          key: "payment_processor_stx_contract",
          category: "EXTENSIONS",
          subcategory: "PAYMENTS_STX",
        },
      ],
    },
    {
      name: "aibtc-pmt-stx-toggle-resource",
      friendlyName: "Payment Processor (STX): Toggle Resource",
      templatePath: "proposals/aibtc-pmt-stx-toggle-resource.clar",
      requiredRuntimeValues: [{ key: "resource_index" }],
      requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
      requiredContractAddresses: [
        {
          key: "message_contract",
          category: "EXTENSIONS",
          subcategory: "MESSAGING",
        },
        {
          key: "payment_processor_stx_contract",
          category: "EXTENSIONS",
          subcategory: "PAYMENTS_STX",
        },
      ],
    },
  ];
