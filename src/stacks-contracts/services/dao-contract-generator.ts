import { Eta } from "eta";
import * as path from "path";
import {
  NetworkName,
  DAO_CONTRACTS,
  ContractRequest,
  ContractCategory,
  getTraitReferences,
  TRAIT_CONTRACTS,
  ADDRESSES,
  TraitReferenceMap,
  TraitContractCategory,
  TraitContractType,
  KnownAddresses,
} from "../types/dao-types-v2";

// type for template data structure that mirrors DAO_CONTRACTS
type TemplateValues = {
  BASE: {
    DAO: {
      base_dao_trait: string;
      proposal_trait: string;
      extension_trait: string;
    };
  };
  TOKEN: {
    DAO: {
      token_sip010_trait: string;
      token_symbol: string;
      token_name: string;
      token_decimals: string;
      token_supply: string;
      token_uri: string;
    };
    DEX: {
      burn_address: string;
      sip010_trait: string;
      dao_token_dex_trait: string;
      dao_token_contract: string;
      dao_token_max_supply: string;
      dao_token_decimals: string;
      dex_stx_target_amount: string;
      dex_contract_mint_amount: string;
      dex_virtual_stx_value: string;
      dex_complete_fee: string;
      dex_deployment_fee_address: string;
      bitflow_core_contract: string;
      bitflow_pool_contract: string;
      bitflow_fee_address: string;
      bitflow_stx_token_contract: string;
    };
    POOL: {
      dao_bitflow_pool_trait: string;
      dao_dex_contract: string;
      bitflow_pool_trait: string;
      bitflow_sip010_trait: string;
      bitflow_xyk_core_address: string;
    };
  };
  EXTENSIONS: {
    ACTION_PROPOSALS: {
      extension_trait: string;
      action_proposals_trait: string;
      sip10_trait: string;
      treasury_trait: string;
      action_trait: string;
      dao_base_contract: string;
      dao_token_contract: string;
      dao_token_dex_contract: string;
      dao_token_pool_contract: string;
      dao_treasury_contract: string;
    };
    BANK_ACCOUNT: {
      extension_trait: string;
      bank_account_trait: string;
      dao_base_contract: string;
    };
    CORE_PROPOSALS: {
      extension_trait: string;
      core_proposal_trait: string;
      sip10_trait: string;
      proposal_trait: string;
      treasury_trait: string;
      dao_base_contract: string;
      dao_token_contract: string;
      dao_token_dex_contract: string;
      dao_token_pool_contract: string;
      dao_treasury_contract: string;
    };
    CHARTER: {
      extension_trait: string;
      charter_trait: string;
      dao_base_contract: string;
    };
    MESSAGING: {
      extension_trait: string;
      messaging_trait: string;
      dao_base_contract: string;
    };
    PAYMENTS: {
      extension_trait: string;
      invoices_trait: string;
      resources_trait: string;
      dao_base_contract: string;
      dao_treasury_contract: string;
    };
    TOKEN_OWNER: {
      extension_trait: string;
      token_owner_trait: string;
      dao_base_contract: string;
      dao_token_contract: string;
    };
    TREASURY: {
      extension_trait: string;
      treasury_trait: string;
      sip010_trait: string;
      sip009_trait: string;
      dao_base_contract: string;
      stacks_pox_contract: string;
    };
  };
  ACTIONS: {
    ADD_RESOURCE: {
      extension_trait: string;
      action_trait: string;
      dao_base_contract: string;
      dao_resources_contract: string;
    };
    ALLOW_ASSET: {
      extension_trait: string;
      action_trait: string;
      dao_base_contract: string;
      dao_treasury_contract: string;
    };
    SEND_MESSAGE: {
      extension_trait: string;
      action_trait: string;
      dao_base_contract: string;
      dao_messaging_contract: string;
    };
    SET_ACCOUNT_HOLDER: {
      extension_trait: string;
      action_trait: string;
      dao_base_contract: string;
      dao_bank_account_contract: string;
    };
    SET_WITHDRAWAL_AMOUNT: {
      extension_trait: string;
      action_trait: string;
      dao_base_contract: string;
      dao_bank_account_contract: string;
    };
    SET_WITHDRAWAL_PERIOD: {
      extension_trait: string;
      action_trait: string;
      dao_base_contract: string;
      dao_bank_account_contract: string;
    };
    TOGGLE_RESOURCE: {
      extension_trait: string;
      action_trait: string;
      dao_base_contract: string;
      dao_resources_contract: string;
    };
  };
  PROPOSALS: {
    BOOTSTRAP_INIT: {
      proposal_trait: string;
      dao_manifest: string;
      dao_base_contract: string;
      dao_token_contract: string;
      dao_action_proposals_contract: string;
      dao_bank_account_contract: string;
      dao_charter_contract: string;
      dao_core_proposals_contract: string;
      dao_messaging_contract: string;
      dao_resources_contract: string;
      dao_token_owner_contract: string;
      dao_treasury_contract: string;
      dao_action_allow_asset_contract: string;
      dao_action_send_message_contract: string;
      dao_action_set_account_holder_contract: string;
      dao_action_set_withdrawal_amount_contract: string;
      dao_action_set_withdrawal_period_contract: string;
      dao_action_toggle_resource_by_name_contract: string;
    };
  };
};

interface ContractData {
  source: string;
  name: string;
  address: string;
}

type TraitContractType<T extends TraitContractCategory> =
  keyof (typeof TRAIT_CONTRACTS)[T];

export class DaoContractGenerator {
  private eta: Eta;
  private network: NetworkName;
  private senderAddress: string;
  private templateValues: TemplateValues;
  private traitRefs: TraitReferenceMap;

  constructor(network: NetworkName, senderAddress: string) {
    this.eta = new Eta({ views: path.join(__dirname, "../templates/dao") });
    this.network = network;
    this.senderAddress = senderAddress;
    this.traitRefs = getTraitReferences(network);
    this.templateValues = this.initializeTemplateValues();
  }

  private getAddressRef(ref: keyof KnownAddresses): string {
    return ADDRESSES[this.network][ref];
  }

  private getTraitRef<T extends TraitContractCategory>(
    category: T,
    contract: TraitContractType<T>
  ): string {
    const ref = this.traitRefs[category][contract];
    return `${ref.contractAddress}.${ref.contractName}::${ref.traitName}`;
  }

  private initializeTemplateValues(): TemplateValues {
    return {
      BASE: {
        DAO: {
          base_dao_trait: this.getTraitRef("BASE", "DAO"),
          proposal_trait: this.getTraitRef("PROPOSALS", "PROPOSAL"),
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
        },
      },
      TOKEN: {
        DAO: {
          token_sip010_trait: this.getTraitRef("STANDARDS", "SIP010"),
          token_symbol: "", // Set during contract generation
          token_name: "", // Set during contract generation
          token_decimals: "",
          token_supply: "",
          token_uri: "",
        },
        DEX: {
          burn_address: this.getAddressRef("BURN"),
          sip010_trait: this.getTraitRef("FAKTORY", "SIP010"),
          dao_token_dex_trait: this.getTraitRef("EXTENSIONS", "FAKTORY_DEX"),
          dao_token_contract: "", // Set during contract generation
          dao_token_max_supply: "",
          dao_token_decimals: "",
          dex_stx_target_amount: "",
          dex_contract_mint_amount: "",
          dex_virtual_stx_value: "",
          dex_complete_fee: "",
          dex_deployment_fee_address: this.getAddressRef("DEPLOYER"),
          bitflow_core_contract: this.getAddressRef("BITFLOW_CORE"),
          bitflow_pool_contract: "", // Set during contract generation
          bitflow_fee_address: this.getAddressRef("BITFLOW_FEE"),
          bitflow_stx_token_contract: this.getAddressRef("BITFLOW_STX_TOKEN"),
        },
        POOL: {
          dao_bitflow_pool_trait: this.getTraitRef(
            "EXTENSIONS",
            "BITFLOW_POOL"
          ),
          dao_dex_contract: "", // Set during contract generation
          bitflow_pool_trait: this.getTraitRef("BITFLOW", "POOL"),
          bitflow_sip010_trait: this.getTraitRef("BITFLOW", "SIP010"),
          bitflow_xyk_core_address: this.getAddressRef("BITFLOW_CORE"),
        },
      },
      EXTENSIONS: {
        ACTION_PROPOSALS: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          action_proposals_trait: this.getTraitRef("EXTENSIONS", "ACTION_PROPOSALS"),
          sip10_trait: this.getTraitRef("SIP010"),
          treasury_trait: this.getTraitRef("EXTENSIONS", "TREASURY"),
          action_trait: this.getTraitRef("EXTENSIONS", "ACTION"),
          dao_base_contract: "", // Set during contract generation
          dao_token_contract: "",
          dao_token_dex_contract: "",
          dao_token_pool_contract: "",
          dao_treasury_contract: "",
        },
        BANK_ACCOUNT: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          bank_account_trait: this.getTraitRef("EXTENSIONS", "BANK_ACCOUNT"),
          dao_base_contract: "", // Set during contract generation
        },
        CORE_PROPOSALS: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          core_proposal_trait: this.getTraitRef("EXTENSIONS", "CORE_PROPOSALS"),
          sip10_trait: this.getTraitRef("SIP010"),
          proposal_trait: this.getTraitRef("PROPOSALS", "PROPOSAL"),
          treasury_trait: this.getTraitRef("EXTENSIONS", "TREASURY"),
          dao_base_contract: "", // Set during contract generation
          dao_token_contract: "",
          dao_token_dex_contract: "",
          dao_token_pool_contract: "",
          dao_treasury_contract: "",
        },
        CHARTER: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          charter_trait: this.getTraitRef("EXTENSIONS", "CHARTER"),
          dao_base_contract: "", // Set during contract generation
        },
        MESSAGING: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          messaging_trait: this.getTraitRef("EXTENSIONS", "MESSAGING"),
          dao_base_contract: "", // Set during contract generation
        },
        PAYMENTS: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          invoices_trait: this.getTraitRef("EXTENSIONS", "INVOICES"),
          resources_trait: this.getTraitRef("EXTENSIONS", "RESOURCES"),
          dao_base_contract: "", // Set during contract generation
          dao_treasury_contract: "",
        },
        TOKEN_OWNER: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          token_owner_trait: this.getTraitRef("EXTENSIONS", "TOKEN_OWNER"),
          dao_base_contract: "", // Set during contract generation
          dao_token_contract: "",
        },
        TREASURY: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          treasury_trait: this.getTraitRef("EXTENSIONS", "TREASURY")
          sip010_trait: this.getTraitRef("SIP010"),
          sip009_trait: this.getTraitRef("SIP009"),
          dao_base_contract: "", // Set during contract generation
          stacks_pox_contract: this.getAddressRef("POX"),
        },
      },
      ACTIONS: {
        ADD_RESOURCE: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          action_trait: this.getTraitRef("EXTENSIONS", "ACTION"),
          dao_base_contract: "", // Set during contract generation
          dao_resources_contract: "",
        },
        ALLOW_ASSET: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          action_trait: this.getTraitRef("EXTENSIONS", "ACTION"),,
          dao_base_contract: "", // Set during contract generation
          dao_treasury_contract: "",
        },
        SEND_MESSAGE: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          action_trait: this.getTraitRef("EXTENSIONS", "ACTION"),,
          dao_base_contract: "", // Set during contract generation
          dao_messaging_contract: "",
        },
        SET_ACCOUNT_HOLDER: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          action_trait: this.getTraitRef("EXTENSIONS", "ACTION"),,
          dao_base_contract: "", // Set during contract generation
          dao_bank_account_contract: "",
        },
        SET_WITHDRAWAL_AMOUNT: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          action_trait: this.getTraitRef("EXTENSIONS", "ACTION"),,
          dao_base_contract: "", // Set during contract generation
          dao_bank_account_contract: "",
        },
        SET_WITHDRAWAL_PERIOD: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          action_trait: this.getTraitRef("EXTENSIONS", "ACTION"),,
          dao_base_contract: "", // Set during contract generation
          dao_bank_account_contract: "",
        },
        TOGGLE_RESOURCE: {
          extension_trait: this.getTraitRef("EXTENSIONS", "EXTENSION"),
          action_trait: this.getTraitRef("EXTENSIONS", "ACTION"),,
          dao_base_contract: "", // Set during contract generation
          dao_resources_contract: "",
        },
      },
      PROPOSALS: {
        BOOTSTRAP_INIT: {
          proposal_trait: this.getTraitRef("PROPOSALS", "PROPOSAL"),
          dao_manifest: "", // Set during contract generation
          dao_base_contract: "",
          dao_token_contract: "",
          dao_action_proposals_contract: "",
          dao_bank_account_contract: "",
          dao_charter_contract: "",
          dao_core_proposals_contract: "",
          dao_messaging_contract: "",
          dao_resources_contract: "",
          dao_token_owner_contract: "",
          dao_treasury_contract: "",
          dao_action_allow_asset_contract: "",
          dao_action_send_message_contract: "",
          dao_action_set_account_holder_contract: "",
          dao_action_set_withdrawal_amount_contract: "",
          dao_action_set_withdrawal_period_contract: "",
          dao_action_toggle_resource_by_name_contract: "",
        },
      },
    };
  }

  private getContractTemplateValues(
    category: ContractCategory,
    contractKey: keyof (typeof DAO_CONTRACTS)[typeof category]
  ) {
    return {
      network: this.network,
      sender: this.senderAddress,
      ...this.templateValues[category][contractKey],
    };
  }

  public generateContracts(
    symbol: string,
    inputContracts?: ContractRequest[]
  ): Record<string, ContractData> {
    // If no input contracts specified, generate all contracts
    const contracts =
      inputContracts ??
      Object.entries(DAO_CONTRACTS).flatMap(([category, subcategories]) =>
        Object.keys(subcategories).map((name) => ({
          category: category as ContractCategory,
          name,
        }))
      );

    return contracts.reduce((acc, { category, name }) => {
      const contractKey = name as keyof (typeof DAO_CONTRACTS)[typeof category];
      const template = DAO_CONTRACTS[category][contractKey];
      const contractName = template.replace(/SYMBOL/g, symbol.toLowerCase());
      const templatePath = `${category.toLowerCase()}/${contractName}.clar`;

      const templateVars = this.getContractTemplateValues(
        category,
        contractKey
      );

      return {
        ...acc,
        [`${category}_${name}`]: {
          source: this.eta.render(templatePath, templateVars),
          name: contractName,
          address: this.senderAddress,
        },
      };
    }, {} as Record<string, ContractData>);
  }
}
