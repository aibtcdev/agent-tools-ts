;; title: aibtcdev-direct-execute
;; version: 1.0.0
;; summary: An extension that manages voting on proposals to execute Clarity code using a SIP-010 Stacks token.
;; description: This contract can make changes to core DAO functionality with a high voting threshold by executing Clarity code in the context of the DAO.

;; traits
;;
(impl-trait '<%= it.extension_trait %>)
(impl-trait '<%= it.direct_execute_trait %>)

(use-trait ft-trait '<%= it.sip10_trait %>)
(use-trait proposal-trait '<%= it.proposal_trait %>)
(use-trait treasury-trait '<%= it.treasury_trait %>)


;; constants
;;

(define-constant SELF (as-contract tx-sender))
(define-constant VOTING_PERIOD u144) ;; 144 Bitcoin blocks, ~1 day
(define-constant VOTING_QUORUM u95) ;; 95% of liquid supply (total supply - treasury)

;; error messages - authorization
(define-constant ERR_UNAUTHORIZED (err u3000))
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u3001))

;; error messages - initialization
(define-constant ERR_NOT_INITIALIZED (err u3100))
(define-constant ERR_ALREADY_INITIALIZED (err u3101))

;; error messages - treasury
(define-constant ERR_TREASURY_MUST_BE_CONTRACT (err u3200))
(define-constant ERR_TREASURY_CANNOT_BE_SELF (err u3201))
(define-constant ERR_TREASURY_ALREADY_SET (err u3202))
(define-constant ERR_TREASURY_MISMATCH (err u3203))

;; error messages - voting token
(define-constant ERR_TOKEN_MUST_BE_CONTRACT (err u3300))
(define-constant ERR_TOKEN_NOT_INITIALIZED (err u3301))
(define-constant ERR_TOKEN_MISMATCH (err u3302))
(define-constant ERR_INSUFFICIENT_BALANCE (err u3303))

;; error messages - proposals
(define-constant ERR_PROPOSAL_NOT_FOUND (err u3400))
(define-constant ERR_PROPOSAL_ALREADY_EXECUTED (err u3401))
(define-constant ERR_PROPOSAL_STILL_ACTIVE (err u3402))
(define-constant ERR_SAVING_PROPOSAL (err u3403))
(define-constant ERR_PROPOSAL_ALREADY_CONCLUDED (err u3404))

;; error messages - voting
(define-constant ERR_VOTE_TOO_SOON (err u3500))
(define-constant ERR_VOTE_TOO_LATE (err u3501))
(define-constant ERR_ALREADY_VOTED (err u3502))
(define-constant ERR_ZERO_VOTING_POWER (err u3503))
(define-constant ERR_QUORUM_NOT_REACHED (err u3504))

;; data vars
;;
(define-data-var protocolTreasury principal SELF) ;; the treasury contract for protocol funds
(define-data-var votingToken principal SELF) ;; the FT contract used for voting

;; data maps
;;
(define-map Proposals
  principal ;; proposal contract
  {
    createdAt: uint, ;; block height
    caller: principal, ;; contract caller
    creator: principal, ;; proposal creator (tx-sender)
    startBlock: uint, ;; block height
    endBlock: uint, ;; block height
    votesFor: uint, ;; total votes for
    votesAgainst: uint, ;; total votes against
    concluded: bool, ;; has the proposal concluded
    passed: bool, ;; did the proposal pass
  }
)

(define-map VotingRecords
  {
    proposal: principal, ;; proposal contract
    voter: principal ;; voter address
  }
  uint ;; total votes
)

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (set-protocol-treasury (treasury <treasury-trait>))
  (let
    (
      (treasuryContract (contract-of treasury))
    )
    (try! (is-dao-or-extension))
    ;; treasury must be a contract
    (asserts! (not (is-standard treasuryContract)) ERR_TREASURY_MUST_BE_CONTRACT)
    ;; treasury cannot be the voting contract
    (asserts! (not (is-eq treasuryContract SELF)) ERR_TREASURY_CANNOT_BE_SELF)
    ;; treasury cannot be the same value
    (asserts! (not (is-eq treasuryContract (var-get protocolTreasury))) ERR_TREASURY_ALREADY_SET)
    (print {
      notification: "set-protocol-treasury",
      payload: {
        treasury: treasuryContract
      }
    })
    (ok (var-set protocolTreasury treasuryContract))
  )
)

(define-public (set-voting-token (token <ft-trait>))
  (let
    (
      (tokenContract (contract-of token))
    )
    (try! (is-dao-or-extension))
    ;; token must be a contract
    (asserts! (not (is-standard tokenContract)) ERR_TOKEN_MUST_BE_CONTRACT)
    (asserts! (is-eq (var-get votingToken) SELF) ERR_TOKEN_NOT_INITIALIZED)
    (asserts! (is-eq (var-get votingToken) tokenContract) ERR_TOKEN_MISMATCH)
    (print {
      notification: "set-voting-token",
      payload: {
        token: tokenContract
      }
    })
    (ok (var-set votingToken tokenContract))
  )
)

(define-public (create-proposal (proposal <proposal-trait>) (token <ft-trait>))
  (let
    (
      (proposalContract (contract-of proposal))
      (tokenContract (contract-of token))
    )
    ;; required variables must be set
    (asserts! (is-initialized) ERR_NOT_INITIALIZED)
    ;; token matches set voting token
    (asserts! (is-eq tokenContract (var-get votingToken)) ERR_TOKEN_MISMATCH)
    ;; caller has the required balance
    (asserts! (> (try! (contract-call? token get-balance tx-sender)) u0) ERR_INSUFFICIENT_BALANCE)
    ;; proposal was not already executed
    (asserts! (is-none (contract-call? '<%= it.dao_contract_address %> executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
    ;; print proposal creation event
    (print {
      notification: "create-proposal",
      payload: {
        proposal: proposalContract,
        creator: tx-sender,
        startBlock: burn-block-height,
        endBlock: (+ burn-block-height VOTING_PERIOD)
      }
    })
    ;; create the proposal
    (ok (asserts! (map-insert Proposals proposalContract {
      createdAt: burn-block-height,
      caller: contract-caller,
      creator: tx-sender,
      startBlock: burn-block-height,
      endBlock: (+ burn-block-height VOTING_PERIOD),
      votesFor: u0,
      votesAgainst: u0,
      concluded: false,
      passed: false,
    }) ERR_SAVING_PROPOSAL))
))

(define-public (vote-on-proposal (proposal <proposal-trait>) (token <ft-trait>) (vote bool))
  (let
    (
      (proposalContract (contract-of proposal))
      (proposalRecord (unwrap! (map-get? Proposals proposalContract) ERR_PROPOSAL_NOT_FOUND))
      (tokenContract (contract-of token))
      (senderBalance (try! (contract-call? token get-balance tx-sender)))
    )
    ;; required variables must be set
    (asserts! (is-initialized) ERR_NOT_INITIALIZED)
    ;; token matches set voting token
    (asserts! (is-eq tokenContract (var-get votingToken)) ERR_TOKEN_MISMATCH)
    ;; caller has the required balance
    (asserts! (> senderBalance u0) ERR_ZERO_VOTING_POWER)
    ;; proposal was not already executed
    (asserts! (is-none (contract-call? '<%= it.dao_contract_address %> executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
    ;; proposal is still active
    (asserts! (>= burn-block-height (get startBlock proposalRecord)) ERR_VOTE_TOO_SOON)
    (asserts! (< burn-block-height (get endBlock proposalRecord)) ERR_VOTE_TOO_LATE)
    ;; proposal not already concluded
    (asserts! (not (get concluded proposalRecord)) ERR_PROPOSAL_ALREADY_CONCLUDED)
    ;; vote not already cast
    (asserts! (is-none (map-get? VotingRecords {proposal: proposalContract, voter: tx-sender})) ERR_ALREADY_VOTED)
    ;; print vote event
    (print {
      notification: "vote-on-proposal",
      payload: {
        proposal: proposalContract,
        voter: tx-sender,
        amount: senderBalance
      }
    })
    ;; update the proposal record
    (map-set Proposals proposalContract
      (if vote
        (merge proposalRecord {votesFor: (+ (get votesFor proposalRecord) senderBalance)})
        (merge proposalRecord {votesAgainst: (+ (get votesAgainst proposalRecord) senderBalance)})
      )
    )
    ;; record the vote for the sender
    (ok (map-set VotingRecords {proposal: proposalContract, voter: tx-sender} senderBalance))
  )
)

(define-public (conclude-proposal (proposal <proposal-trait>) (treasury <treasury-trait>) (token <ft-trait>))
  (let
    (
      (proposalContract (contract-of proposal))
      (proposalRecord (unwrap! (map-get? Proposals proposalContract) ERR_PROPOSAL_NOT_FOUND))
      (tokenContract (contract-of token))
      (tokenTotalSupply (try! (contract-call? token get-total-supply)))
      (treasuryContract (contract-of treasury))
      (treasuryBalance (try! (contract-call? token get-balance treasuryContract)))
      (votePassed (> (get votesFor proposalRecord) (* tokenTotalSupply (- u100 treasuryBalance) VOTING_QUORUM)))
    )
    ;; required variables must be set
    (asserts! (is-initialized) ERR_NOT_INITIALIZED)
    ;; verify treasury matches protocol treasury
    (asserts! (is-eq treasuryContract (var-get protocolTreasury)) ERR_TREASURY_MISMATCH)
    ;; proposal was not already executed
    (asserts! (is-none (contract-call? '<%= it.dao_contract_address %> executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
    ;; proposal past end block height
    (asserts! (>= burn-block-height (get endBlock proposalRecord)) ERR_PROPOSAL_STILL_ACTIVE)
    ;; proposal not already concluded
    (asserts! (not (get concluded proposalRecord)) ERR_PROPOSAL_ALREADY_CONCLUDED)
    ;; print conclusion event
    (print {
      notification: "conclude-proposal",
      payload: {
        proposal: proposalContract,
        passed: votePassed
      }
    })
    ;; update the proposal record
    (map-set Proposals proposalContract
      (merge proposalRecord {
        concluded: true,
        passed: votePassed
      })
    )
    ;; execute the proposal only if it passed
    (and votePassed (try! (contract-call? '<%= it.dao_contract_address %> execute proposal tx-sender)))
    ;; return the result
    (ok votePassed)
  )
)

;; read only functions
;;

(define-read-only (get-protocol-treasury)
  (if (is-eq (var-get protocolTreasury) SELF)
    none
    (some (var-get protocolTreasury))
  )
)

(define-read-only (get-voting-token)
  (if (is-eq (var-get votingToken) SELF)
    none
    (some (var-get votingToken))
  )
)

(define-read-only (get-proposal (proposal principal))
  (map-get? Proposals proposal)
)

(define-read-only (get-total-votes (proposal principal) (voter principal))
  (default-to u0 (map-get? VotingRecords {proposal: proposal, voter: voter}))
)

(define-read-only (is-initialized)
  ;; check if the required variables are set
  (not (or
    (is-eq (var-get votingToken) SELF)
    (is-eq (var-get protocolTreasury) SELF)
  ))
)

(define-read-only (get-voting-period)
  VOTING_PERIOD
)

(define-read-only (get-voting-quorum)
  VOTING_QUORUM
)

;; private functions
;; 

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender '<%= it.dao_contract_address %>)
    (contract-call? '<%= it.dao_contract_address %> is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)
