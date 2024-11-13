import {
  getAddressFromPrivateKey,
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  SignedContractDeployOptions,
  PostConditionMode,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../utilities";

export function GenerateTokenBasicContract(
  tokenName: string,
  tokenSymbol: string,
  tokenDecimals: string,
  tokenUri: string,
  tokenMaxSupply: string
): string {
  let networkSipLocation: string;
  networkSipLocation =
    "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait";
  const decimals = parseInt(tokenDecimals, 10);
  const maxSupply = parseInt(tokenMaxSupply, 10);

  // Calculate the actual max supply
  const calculatedMaxSupply = maxSupply * Math.pow(10, decimals);

  return `;; SIP10 Token Contract by AIBTC\n\n;; Errors\n(define-constant ERR-UNAUTHORIZED u401)\n(define-constant ERR-NOT-OWNER u402)\n(define-constant ERR-INVALID-PARAMS u400)\n(define-constant ERR-NOT-ENOUGH-FUND u101)\n\n;; SIP-010 Trait Implementation\n(impl-trait '${networkSipLocation})\n\n;; Constants\n(define-constant MAXSUPPLY u${calculatedMaxSupply})\n\n;; Variables\n(define-fungible-token ${tokenSymbol} MAXSUPPLY)\n(define-data-var contract-owner principal tx-sender)\n(define-data-var token-uri (optional (string-utf8 256)) (some u"${tokenUri}"))\n(define-data-var token-name (string-ascii 32) "${tokenName}")\n(define-data-var token-symbol (string-ascii 32) "${tokenSymbol}")\n(define-data-var token-decimals uint u${tokenDecimals})\n\n;; Read-Only Functions\n(define-read-only (get-balance (owner principal))\n  (ok (ft-get-balance ${tokenSymbol} owner))\n)\n\n(define-read-only (get-name)\n  (ok (var-get token-name))\n)\n\n(define-read-only (get-symbol)\n  (ok (var-get token-symbol))\n)\n\n(define-read-only (get-decimals)\n  (ok (var-get token-decimals))\n)\n\n(define-read-only (get-total-supply)\n  (ok (ft-get-supply ${tokenSymbol}))\n)\n\n(define-read-only (get-token-uri)\n  (ok (var-get token-uri))\n)\n\n;; Public Functions\n(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))\n  (begin\n    (asserts! (is-eq from tx-sender) (err ERR-UNAUTHORIZED))\n    (asserts! (> amount u0) (err ERR-INVALID-PARAMS))\n    (asserts! (>= (ft-get-balance ${tokenSymbol} from) amount) (err ERR-NOT-ENOUGH-FUND))\n    (asserts! (not (is-eq from to)) (err ERR-INVALID-PARAMS))\n    (let ((result (ft-transfer? ${tokenSymbol} amount from to)))\n      (print\n        {\n          event: "transfer",\n          from: from,\n          to: to,\n          amount: amount,\n          memo: memo\n        }\n      )\n      result\n    )\n  )\n)\n\n(define-public (set-token-uri (uri (string-utf8 256)))\n  (begin\n    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-UNAUTHORIZED))\n    (var-set token-uri (some uri))\n    (print\n      {\n        event: "token-metadata-update",\n        uri: uri\n      }\n    )\n    (ok true)\n  )\n)\n\n(define-public (set-metadata (name (string-ascii 32)) (symbol (string-ascii 32)) (decimals uint))\n  (begin\n    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-UNAUTHORIZED))\n    (asserts! (> (len name) u0) (err ERR-INVALID-PARAMS))\n    (asserts! (> (len symbol) u0) (err ERR-INVALID-PARAMS))\n    (asserts! (<= decimals u18) (err ERR-INVALID-PARAMS))\n    (var-set token-name name)\n    (var-set token-symbol symbol)\n    (var-set token-decimals decimals)\n    (print\n      {\n        event: "token-metadata-update",\n        name: name,\n        symbol: symbol,\n        decimals: decimals\n      }\n    )\n    (ok true)\n  )\n)\n\n(define-public (transfer-ownership (new-owner principal))\n  (begin\n    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-OWNER))\n    (var-set contract-owner new-owner)\n    (print\n      {\n        event: "ownership-transfer",\n        new-owner: new-owner\n      }\n    )\n    (ok true)\n  )\n)\n\n(define-public (send-many (recipients (list 200 { to: principal, amount: uint, memo: (optional (buff 34)) })))\n  (begin\n    (asserts! (<= (len recipients) u200) (err ERR-INVALID-PARAMS))\n    (fold check-err (map send-token recipients) (ok true))\n  )\n)\n\n;; Private Functions\n(define-private (check-err (result (response bool uint)) (prior (response bool uint)))\n  (match prior ok-value result err-value (err err-value))\n)\n\n(define-private (send-token (recipient { to: principal, amount: uint, memo: (optional (buff 34)) }))\n  (send-token-with-memo (get amount recipient) (get to recipient) (get memo recipient))\n)\n\n(define-private (send-token-with-memo (amount uint) (to principal) (memo (optional (buff 34))))\n  (let ((transferOk (try! (transfer amount tx-sender to memo))))\n    (ok transferOk)\n  )\n)\n\n(define-private (send-stx (recipient principal) (amount uint))\n  (begin\n    (asserts! (> amount u0) (err ERR-INVALID-PARAMS))\n    (try! (stx-transfer? amount tx-sender recipient))\n    (ok true)\n  )\n)\n\n;; Mint Tokens\n(begin\n  (let ((result (ft-mint? ${tokenSymbol} MAXSUPPLY (var-get contract-owner))))\n    (print\n      {\n        event: "mint",\n        to: (var-get contract-owner),\n        amount: MAXSUPPLY\n      }\n    )\n    result\n  )\n)\n`;
}

const networkObj = getNetwork(CONFIG.NETWORK);
const network = CONFIG.NETWORK;

async function deployContract(sourceCode: string, contractName: string) {
  try {
    // Derive child account from mnemonic
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const formattedContractName = contractName
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/\s+/g, "-")
      .toLowerCase();
    const senderAddress = getAddressFromPrivateKey(key, networkObj.version);
    const nextPossibleNonce = await getNextNonce(network, senderAddress);

    const txOptions: SignedContractDeployOptions = {
      contractName: formattedContractName,
      codeBody: sourceCode,
      clarityVersion: 2,
      network: networkObj,
      senderKey: key,
      nonce: nextPossibleNonce,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: BigInt(1_000_000), // 1 STX
    };

    const transaction = await makeContractDeploy(txOptions);
    const broadcastResponse = await broadcastTransaction(
      transaction,
      networkObj
    );

    if ("error" in broadcastResponse) {
      console.log("Transaction failed to broadcast");
      console.log(`Error: ${broadcastResponse.error}`);
      if (broadcastResponse.reason) {
        console.log(`Reason: ${broadcastResponse.reason}`);
      }
      if (broadcastResponse.reason_data) {
        console.log(
          `Reason Data: ${JSON.stringify(
            broadcastResponse.reason_data,
            null,
            2
          )}`
        );
      }
    } else {
      console.log("Transaction broadcasted successfully!");
      console.log(`FROM: ${address}`);
      console.log(`TXID: 0x${broadcastResponse.txid}`);
      console.log(`CONTRACT: ${address}.${formattedContractName}`);
    }
  } catch (error) {
    console.log(`Error deploying contract: ${error}`);
  }
}

//   const contractName = process.argv[2];
const tokenName = process.argv[2];
const tokenSymbol = process.argv[3];
const tokenDecimals = process.argv[4];
const tokenUri = process.argv[5];
const tokenMaxSupply = process.argv[6];

if (tokenName && tokenSymbol && tokenDecimals && tokenUri && tokenMaxSupply) {
  deployContract(
    GenerateTokenBasicContract(
      tokenName,
      tokenSymbol,
      tokenDecimals,
      tokenUri,
      tokenMaxSupply
    ),
    tokenName
  );
} else {
  console.log("Please provide the contract source code as an argument.");
}
