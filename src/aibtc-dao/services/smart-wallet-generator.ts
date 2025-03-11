import * as path from "path";
import * as crypto from "crypto";
import { Eta } from "eta";
import { StacksNetworkName } from "@stacks/network";

/**
 * Expected arguments for smart wallet generation
 */
export interface SmartWalletGeneratorArgs {
  userAddress: string;
  agentAddress: string;
  tokenSymbol: string;
  sbtcTokenContract: string;
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
   * @param network Network to generate contracts for
   * @param senderAddress Address that will deploy the contracts
   */
  constructor(network: StacksNetworkName, senderAddress: string) {
    this.eta = new Eta({ views: path.join(__dirname, "../templates/smart-wallet") });
    this.network = network;
    this.senderAddress = senderAddress;
  }

  /**
   * Generate a smart wallet contract
   * 
   * @param args Arguments for smart wallet generation
   * @returns Generated smart wallet contract
   */
  public generateSmartWallet(args: SmartWalletGeneratorArgs): GeneratedSmartWallet {
    // Build contract name with token symbol
    const contractName = `${args.tokenSymbol.toLowerCase()}-user-agent-smart-wallet`;

    // Template variables
    const templateVars = {
      userAddress: args.userAddress,
      agentAddress: args.agentAddress,
      sbtcTokenContract: args.sbtcTokenContract,
      daoTokenContract: args.daoTokenContract,
    };

    // Render the template
    const source = this.eta.render("smart-wallet.eta", templateVars);

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
