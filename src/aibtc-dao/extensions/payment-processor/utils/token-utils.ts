import {
  callReadOnlyFunction,
  Cl,
  ClarityType,
  cvToValue,
  Pc,
} from "@stacks/transactions";
import { CONFIG, getNetwork } from "../../../../utilities";

/**
 * Determines the token type from the contract name
 * @param contractName The name of the contract
 * @returns The token type (STX, sBTC, or DAO)
 */
export function getTokenTypeFromContractName(contractName: string): 'STX' | 'sBTC' | 'DAO' {
  if (contractName.includes('-stx')) return 'STX';
  if (contractName.includes('-sbtc')) return 'sBTC';
  if (contractName.includes('-dao')) return 'DAO';
  
  // Default to STX if unable to determine
  console.warn(`Unable to determine token type from contract name: ${contractName}, defaulting to STX`);
  return 'STX';
}

/**
 * Creates post conditions based on token type
 * @param tokenType The type of token (STX, sBTC, or DAO)
 * @param contractAddress The contract address
 * @param contractName The contract name
 * @param address The sender address
 * @param price The price amount
 * @param networkObj The network object
 * @returns An array of post conditions
 */
export async function createPostConditions(
  tokenType: 'STX' | 'sBTC' | 'DAO',
  contractAddress: string,
  contractName: string,
  address: string,
  price: number,
  networkObj: any
): Promise<any[]> {
  switch (tokenType) {
    case 'STX':
      return [Pc.principal(address).willSendEq(price).ustx()];
    
    case 'sBTC':
      // For sBTC, we need to create an FT post condition
      // Get the contract data to find the token contract
      const sbtcContractData = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-contract-data",
        functionArgs: [],
        senderAddress: address,
        network: networkObj,
      });
      
      if (sbtcContractData.type === ClarityType.ResponseOk) {
        const data = cvToValue(sbtcContractData.value, true);
        const tokenContract = data.paymentToken;
        
        return [
          Pc.principal(address)
            .willSendEq(price)
            .fungibleToken(tokenContract, 'sbtc')
        ];
      }
      
      // Fallback to STX if we can't determine the token contract
      console.warn("Could not determine sBTC token contract, defaulting to STX post conditions");
      return [Pc.principal(address).willSendEq(price).ustx()];
    
    case 'DAO':
      // For DAO token, we need to get the token contract from the contract data
      const daoContractData = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-contract-data",
        functionArgs: [],
        senderAddress: address,
        network: networkObj,
      });
      
      if (daoContractData.type === ClarityType.ResponseOk) {
        const data = cvToValue(daoContractData.value, true);
        const tokenContract = data.paymentToken;
        const [tokenAddress, tokenName] = tokenContract.split('.');
        
        return [
          Pc.principal(address)
            .willSendEq(price)
            .fungibleToken(tokenContract, tokenName)
        ];
      }
      
      // Fallback to STX if we can't determine the token contract
      console.warn("Could not determine DAO token contract, defaulting to STX post conditions");
      return [Pc.principal(address).willSendEq(price).ustx()];
    
    default:
      return [Pc.principal(address).willSendEq(price).ustx()];
  }
}
