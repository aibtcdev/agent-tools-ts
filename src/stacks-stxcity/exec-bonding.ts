import { Eta } from 'eta';
import * as fs from 'fs';
import * as path from 'path';
import { getStxCityHash } from '../utilities';

// Get command line arguments
const tokenSymbol = process.argv[2];
const tokenName = process.argv[3];
const tokenMaxSupply = process.argv[4];
const tokenDecimals = process.argv[5];
const tokenUri = process.argv[6];
const creator = process.argv[7];

if (!tokenSymbol || !tokenName || !tokenMaxSupply || !tokenDecimals || !tokenUri || !creator) {
  console.error("Please provide all required parameters:");
  console.error("ts-node src/stacks-stxcity/exec-bonding.ts <token_symbol> <token_name> <token_max_supply> <token_decimals> <token_uri> <creator>");
  process.exit(1);
}

async function main() {
  try {
    // Initialize Eta with templates directory
    const eta = new Eta({
      views: path.join(__dirname, 'templates')
    });

    // Generate hash for the contract
    const contractId = `${creator}.${tokenSymbol}-stxcity-dex`;
    const hash = await getStxCityHash(contractId);

    // Calculate token distribution amounts
    const dexTokenAmount = '9354536950420954';  // ~93.5% of max supply
    const ownerTokenAmount = '645463049579046';  // ~6.5% of max supply
    const dexStxAmount = '27600000';            // 27.6 STX

    // Calculate DEX parameters
    const stxTargetAmount = '2000000000';       // 2000 STX target
    const virtualStxValue = '400000000';        // 400 STX (1/5 of target)
    const completeFee = '40000000';             // 40 STX (2% of target)
    const burnPercent = '20';                   // 20% burn
    const deployerPercent = '10';               // 10% of burn amount to deployer

    // Prepare template variables
    const view = {
      token_symbol: tokenSymbol,
      token_name: `"${tokenName}"`, // Wrap in quotes for Clarity string
      token_max_supply: tokenMaxSupply,
      token_decimals: tokenDecimals,
      token_uri: tokenUri,
      creator,
      hash,
      dex_token_amount: dexTokenAmount,
      owner_token_amount: ownerTokenAmount,
      dex_stx_amount: dexStxAmount,
      stx_target_amount: stxTargetAmount,
      virtual_stx_value: virtualStxValue,
      complete_fee: completeFee,
      burn_percent: burnPercent,
      deployer_percent: deployerPercent
    };

    // Render both templates
    const tokenTemplate = 'bonding.tmpl';
    const dexTemplate = 'dex.tmpl';
    
    const tokenContract = eta.render(tokenTemplate, view);
    if (!tokenContract) {
      throw new Error('Failed to render token template');
    }

    const dexContract = eta.render(dexTemplate, view);
    if (!dexContract) {
      throw new Error('Failed to render DEX template');
    }

    // Output both contracts
    console.log('\n=== Token Contract ===\n');
    console.log(tokenContract);
    console.log('\n=== DEX Contract ===\n');
    console.log(dexContract);

  } catch (error) {
    console.error("Error generating bonding contract:", error);
    process.exit(1);
  }
}

main();
