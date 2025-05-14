import { ClarityVersion } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNextNonce,
  sendToLLM,
  ToolResponse,
} from "../utilities";
import {
  ContractDeployer,
  DeployedSingleContract,
  SingleContract,
} from "./services/contract-deployer";

const usage =
  "Usage: bun run deploy-dao-governance.ts <contractName> [clarityVersion]";
const usageExample =
  "Example: bun run deploy-dao-governance.ts my-dao-governance 2";

interface ExpectedArgs {
  contractName: string;
  clarityVersion?: ClarityVersion;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [contractName, clarityVersion] = process.argv.slice(2);

  if (!contractName) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // if clarity version provided, convert to valid
  let clarityVer = ClarityVersion.Clarity2;
  if (clarityVersion) {
    const parsedVersion = parseInt(clarityVersion);
    if (isNaN(parsedVersion) || parsedVersion < 1 || parsedVersion > 3) {
      const errorMessage = [
        `Invalid clarity version: ${clarityVersion}`,
        usage,
        usageExample,
      ].join("\n");
      throw new Error(errorMessage);
    }
    // set clarity version based on the parsed value
    if (parsedVersion === 1) {
      clarityVer = ClarityVersion.Clarity1;
    } else if (parsedVersion === 2) {
      clarityVer = ClarityVersion.Clarity2;
    } else if (parsedVersion === 3) {
      clarityVer = ClarityVersion.Clarity3;
    }
  }

  // return validated arguments
  return {
    contractName,
    clarityVersion: clarityVer,
  };
}

const daoGovernanceContract = `
;; SIP010: Fungible Token Standard
;; Reference the standard trait instead of defining our own
(impl-trait 'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait)

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_NOT_FOUND (err u101))
(define-constant ERR_ALREADY_VOTED (err u102))
(define-constant ERR_VOTING_CLOSED (err u103))
(define-constant ERR_INSUFFICIENT_TOKENS (err u104))
(define-constant ERR_PROPOSAL_EXECUTED (err u105))
(define-constant ERR_PROPOSAL_NOT_APPROVED (err u106))

;; Define token
(define-fungible-token gov-token u1000000) ;; 1M total supply
(define-data-var token-name (string-ascii 32) "GovToken")
(define-data-var token-symbol (string-ascii 10) "GT")
(define-data-var token-uri (optional (string-utf8 256)) (some u"https://example.com/token"))

;; Proposal data
(define-map proposals
  { id: uint }
  {
    proposer: principal,
    text: (string-ascii 256),
    amount: uint,
    recipient: principal,
    start-block: uint,
    end-block: uint,
    yes-votes: uint,
    no-votes: uint,
    executed: bool
  }
)

(define-map votes
  { proposal-id: uint, voter: principal }
  { amount: uint, vote: bool }
)

(define-data-var proposal-count uint u0)
(define-constant VOTING_DURATION u1440) ;; ~10 days
(define-constant MIN_TOKENS_TO_PROPOSE u10000) ;; 1% of supply

;; SIP-010 functions
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
    (match (ft-transfer? gov-token amount sender recipient)
      response (begin
        (print memo)
        (ok response))
      error (err error)
    )
  )
)

(define-read-only (get-name)
  (ok (var-get token-name))
)

(define-read-only (get-symbol)
  (ok (var-get token-symbol))
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance gov-token account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply gov-token))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; DAO functions
(define-public (mint-tokens (recipient principal) (amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (ft-mint? gov-token amount recipient)
  )
)

(define-public (submit-proposal (text (string-ascii 256)) (amount uint) (recipient principal))
  (let
    (
      (proposal-id (+ (var-get proposal-count) u1))
      (proposer-balance (ft-get-balance gov-token tx-sender))
    )
    (asserts! (>= proposer-balance MIN_TOKENS_TO_PROPOSE) ERR_INSUFFICIENT_TOKENS)
    (map-set proposals
      { id: proposal-id }
      {
        proposer: tx-sender,
        text: text,
        amount: amount,
        recipient: recipient,
        start-block: block-height,
        end-block: (+ block-height VOTING_DURATION),
        yes-votes: u0,
        no-votes: u0,
        executed: false
      }
    )
    (var-set proposal-count proposal-id)
    (ok proposal-id)
  )
)

(define-public (vote (proposal-id uint) (vote-for bool) (amount uint))
  (let
    (
      (proposal (unwrap! (map-get? proposals { id: proposal-id }) ERR_NOT_FOUND))
      (voter tx-sender)
    )
    (asserts! (<= block-height (get end-block proposal)) ERR_VOTING_CLOSED)
    (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: voter })) ERR_ALREADY_VOTED)
    (asserts! (>= (ft-get-balance gov-token voter) amount) ERR_INSUFFICIENT_TOKENS)
    (map-set votes
      { proposal-id: proposal-id, voter: voter }
      { amount: amount, vote: vote-for }
    )
    (map-set proposals
      { id: proposal-id }
      (merge proposal
        {
          yes-votes: (if vote-for (+ (get yes-votes proposal) amount) (get yes-votes proposal)),
          no-votes: (if vote-for (get no-votes proposal) (+ (get no-votes proposal) amount))
        }
      )
    )
    (ok true)
  )
)

(define-public (execute-proposal (proposal-id uint))
  (let
    (
      (proposal (unwrap! (map-get? proposals { id: proposal-id }) ERR_NOT_FOUND))
    )
    (asserts! (> block-height (get end-block proposal)) ERR_VOTING_CLOSED)
    (asserts! (not (get executed proposal)) ERR_PROPOSAL_EXECUTED)
    (asserts! (> (get yes-votes proposal) (get no-votes proposal)) ERR_PROPOSAL_NOT_APPROVED)
    (map-set proposals
      { id: proposal-id }
      (merge proposal { executed: true })
    )
    (try! (as-contract (ft-transfer? gov-token (get amount proposal) tx-sender (get recipient proposal))))
    (ok true)
  )
)

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals { id: proposal-id })
)

;; Initial token mint
(ft-mint? gov-token u200000 CONTRACT_OWNER)`;

async function main(): Promise<ToolResponse<DeployedSingleContract>> {
  // validate and store provided args
  const args = validateArgs();

  // setup network and wallet info
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  // setup deployment details
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  const contractDeployer = new ContractDeployer(CONFIG.NETWORK, address, key);

  // Force Clarity version 2 regardless of input
  const contract: SingleContract = {
    name: args.contractName,
    source: daoGovernanceContract,
    clarityVersion: ClarityVersion.Clarity2, // Force Clarity 2
  };

  const deploymentDetails = await contractDeployer.deployContract(
    contract,
    nextPossibleNonce
  );

  // return deployment details
  return {
    success: true,
    message: `DAO Governance Contract deployed successfully: ${address}.${args.contractName}`,
    data: {
      ...deploymentDetails,
      source:
        "DAO Governance Contract with voting mechanisms and token distribution", // Simplified description
    },
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
