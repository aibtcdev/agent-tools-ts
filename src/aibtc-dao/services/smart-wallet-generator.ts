import * as path from "path";
import * as crypto from "crypto";
import { Eta } from "eta";
import { StacksNetworkName } from "@stacks/network";
import { getKnownTraits } from "../types/dao-types";

/**
 * Expected arguments for smart wallet generation
 */
export interface SmartWalletGeneratorArgs {
  /** The principal address of the user who will own the smart wallet */
  userAddress: string;
  /** The principal address of the agent who will vote on behalf of the user */
  agentAddress: string;
  /** The fully qualified contract ID of the sBTC token */
  sbtcTokenContract: string;
  /** The fully qualified contract ID of the DAO token */
  daoTokenContract: string;
}

/**
 * Generated smart wallet contract information
 */
export interface GeneratedSmartWallet {
  name: string;
  source: string;
  hash: string;
}

/**
 * Smart wallet generator service
 */
export class SmartWalletGenerator {
  private eta: Eta;
  private network: StacksNetworkName;
  private senderAddress: string;

  /**
   * Create a new SmartWalletGenerator instance
   *
   * @param network Network to generate contracts for (mainnet or testnet)
   * @param senderAddress Principal address that will deploy the contracts
   */
  constructor(network: StacksNetworkName, senderAddress: string) {
    this.eta = new Eta({
      views: path.join(__dirname, "../templates/smart-wallet"),
    });
    this.network = network;
    this.senderAddress = senderAddress;
  }

  /**
   * Generate a smart wallet contract
   *
   * @param args Arguments for smart wallet generation
   * @returns Generated smart wallet contract
   */
  public generateSmartWallet(
    args: SmartWalletGeneratorArgs
  ): GeneratedSmartWallet {
    // Build contract name
    const contractName = `aibtc-smart-wallet-${args.userAddress}`;

    // Get known traits
    const traitRefs = getKnownTraits(this.network);

    // Template variables
    const templateVars = {
      smart_wallet_owner: args.userAddress,
      smart_wallet_agent: args.agentAddress,
      sbtc_token_contract: args.sbtcTokenContract,
      dao_token_contract: args.daoTokenContract,
      smart_wallet_trait: ".smart-wallet-trait",
      sip010_trait: traitRefs["STANDARD_SIP010"],
      dao_action_trait: traitRefs["DAO_ACTION"],
      dao_proposal_trait: traitRefs["DAO_PROPOSAL"],
      dao_action_proposals_trait: traitRefs["DAO_ACTION_PROPOSALS"],
      dao_core_proposals_trait: traitRefs["DAO_CORE_PROPOSALS"],
    };

    // Render the template
    const source = this.eta.render(
      "aibtc-user-agent-smart-wallet.clar",
      templateVars
    );

    // Hash the contract
    const hash = crypto.createHash("sha256").update(source).digest("hex");

    // Return the generated contract
    return {
      name: contractName,
      source,
      hash,
    };
  }
}
