import * as path from "path";
import * as crypto from "crypto";
import { Eta } from "eta";
import { StacksNetworkName } from "@stacks/network";

/**
 * Expected arguments for smart wallet generation
 */
export interface SmartWalletGeneratorArgs {
  /** The principal address of the user who will own the smart wallet */
  userAddress: string;
  /** The principal address of the agent who will vote on behalf of the user */
  agentAddress: string;
  /** The token symbol used to name the smart wallet contract */
  tokenSymbol: string;
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
    // Build contract name with token symbol
    const contractName = `${args.tokenSymbol.toLowerCase()}-user-agent-smart-wallet`;

    // Template variables
    const templateVars = {
      smart_wallet_owner: args.userAddress,
      smart_wallet_agent: args.agentAddress,
      sbtc_token_contract: args.sbtcTokenContract,
      dao_token_contract: args.daoTokenContract,
      smart_wallet_trait: ".smart-wallet-trait",
      sip010_trait: ".sip-010-trait-ft-standard",
      dao_action_trait: ".dao-action-trait",
      dao_proposal_trait: ".dao-proposal-trait",
      dao_action_proposals_trait: ".dao-action-proposals-trait",
      dao_core_proposals_trait: ".dao-core-proposals-trait",
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
