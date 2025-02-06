;; title: aibtcdev-action-proposals
;; version: 2.0.0
;; summary: An extension that manages voting on predefined actions using a SIP-010 Stacks token.
;; description: This contract allows voting on specific extension actions with a lower threshold than core proposals.

;; traits
;;
(impl-trait '<%= it.extension_trait %>)
(impl-trait '<%= it.action_proposals_trait %>)

(use-trait action-trait '<%= it.action_trait %>)
(use-trait treasury-trait '<%= it.treasury_trait %>)

;; constants
;;
(define-constant SELF (as-contract tx-sender))
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK block-height)

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u1000))
(define-constant ERR_INSUFFICIENT_BALANCE (err u1001))
(define-constant ERR_FETCHING_TOKEN_DATA (err u1002))
(define-constant ERR_PROPOSAL_NOT_FOUND (err u1003))
(define-constant ERR_PROPOSAL_VOTING_ACTIVE (err u1004))
(define-constant ERR_PROPOSAL_EXECUTION_DELAY (err u1005))
(define-constant ERR_ALREADY_PROPOSAL_AT_BLOCK (err u1006))
(define-constant ERR_SAVING_PROPOSAL (err u1007))
(define-constant ERR_PROPOSAL_ALREADY_CONCLUDED (err u1008))
(define-constant ERR_RETRIEVING_START_BLOCK_HASH (err u1009))
(define-constant ERR_VOTE_TOO_SOON (err u1010))
(define-constant ERR_VOTE_TOO_LATE (err u1011))
(define-constant ERR_ALREADY_VOTED (err u1012))
(define-constant ERR_INVALID_ACTION (err u1013))

;; voting configuration
(define-constant VOTING_DELAY u144) ;; 144 Bitcoin blocks, ~1 days
(define-constant VOTING_PERIOD u288) ;; 2 x 144 Bitcoin blocks, ~2 days
(define-constant VOTING_QUORUM u15) ;; 15% of liquid supply must participate
(define-constant VOTING_THRESHOLD u66) ;; 66% of votes must be in favor

;; contracts used for voting calculations
(define-constant VOTING_TOKEN_DEX '<%= it.token_dex_contract_address %>)
(define-constant VOTING_TOKEN_POOL '<%= it.token_pool_contract_address %>)
(define-constant VOTING_TREASURY '<%= it.treasury_contract_address %>)

;; data vars
;;
(define-data-var proposalCount uint u0) ;; total number of proposals
(define-data-var lastProposalCreated uint u0) ;; block height of last proposal created

;; data maps
;;
(define-map Proposals
  uint ;; proposal id
  {
    action: principal, ;; action contract
    parameters: (buff 2048), ;; action parameters
    createdAt: uint, ;; stacks block height for at-block calls
    caller: principal, ;; contract caller
    creator: principal, ;; proposal creator (tx-sender)
    startBlock: uint, ;; burn block height
    endBlock: uint, ;; burn block height
    votesFor: uint, ;; total votes for
    votesAgainst: uint, ;; total votes against
    liquidTokens: uint, ;; liquid tokens
    concluded: bool, ;; has the proposal concluded
    metQuorum: bool, ;; did the proposal meet quorum
    metThreshold: bool, ;; did the proposal meet threshold
    passed: bool, ;; did the proposal pass
    executed: bool, ;; did the proposal execute
  }
)

(define-map VoteRecords
  {
    proposalId: uint, ;; proposal id
    voter: principal ;; voter address
  }
  uint ;; total votes
)

;; public functions
;;
(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (propose-action (action <action-trait>) (parameters (buff 2048)))
  (let
    (
      (actionContract (contract-of action))
      (newId (+ (var-get proposalCount) u1))
      (createdAt block-height)
      (liquidTokens (try! (get-liquid-supply createdAt)))
      (startBlock (+ burn-block-height VOTING_DELAY))
      (endBlock (+ startBlock VOTING_PERIOD))
      (senderBalance (unwrap! (contract-call? '<%= it.token_contract_address %> get-balance tx-sender) ERR_FETCHING_TOKEN_DATA))
      (validAction (is-action-valid action))
    )
    ;; liquidTokens is greater than zero
    (asserts! (> liquidTokens u0) ERR_FETCHING_TOKEN_DATA)
    ;; verify this extension and action contract are active in dao
    (asserts! validAction ERR_INVALID_ACTION)
    ;; at least one stx block has passed since last proposal
    (asserts! (> createdAt (var-get lastProposalCreated)) ERR_ALREADY_PROPOSAL_AT_BLOCK)
    ;; caller has the required balance
    (asserts! (> senderBalance u0) ERR_INSUFFICIENT_BALANCE)
    ;; print proposal creation event
    (print {
      notification: "propose-action",
      payload: {
        proposalId: newId,
        action: actionContract,
        parameters: parameters,
        caller: contract-caller,
        creator: tx-sender,
        createdAt: createdAt,
        startBlock: startBlock,
        endBlock: endBlock,
        liquidTokens: liquidTokens,
      }
    })
    ;; create the proposal
    (asserts! (map-insert Proposals newId {
      action: actionContract,
      parameters: parameters,
      caller: contract-caller,
      creator: tx-sender,
      createdAt: createdAt,
      startBlock: startBlock,
      endBlock: endBlock,
      liquidTokens: liquidTokens,
      votesFor: u0,
      votesAgainst: u0,
      concluded: false,
      metQuorum: false,
      metThreshold: false,
      passed: false,
      executed: false,
    }) ERR_SAVING_PROPOSAL)
    ;; set last proposal created block height
    (var-set lastProposalCreated createdAt)
    ;; increment proposal count
    (ok (var-set proposalCount newId))
  )
)

(define-public (vote-on-proposal (proposalId uint) (vote bool))
  (let
    (
      (proposalRecord (unwrap! (map-get? Proposals proposalId) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlock (get createdAt proposalRecord))
      (proposalBlockHash (unwrap! (get-block-hash proposalBlock) ERR_RETRIEVING_START_BLOCK_HASH))
      (senderBalance (unwrap! (at-block proposalBlockHash (contract-call? '<%= it.token_contract_address %> get-balance tx-sender)) ERR_FETCHING_TOKEN_DATA))
    )
    ;; caller has the required balance
    (asserts! (> senderBalance u0) ERR_INSUFFICIENT_BALANCE)
    ;; proposal was not already concluded
    (asserts! (not (get concluded proposalRecord)) ERR_PROPOSAL_ALREADY_CONCLUDED)
    ;; proposal vote is still active
    (asserts! (>= burn-block-height (get startBlock proposalRecord)) ERR_VOTE_TOO_SOON)
    (asserts! (< burn-block-height (get endBlock proposalRecord)) ERR_VOTE_TOO_LATE)
    ;; vote not already cast
    (asserts! (is-none (map-get? VoteRecords {proposalId: proposalId, voter: tx-sender})) ERR_ALREADY_VOTED)
    ;; print vote event
    (print {
      notification: "vote-on-proposal",
      payload: {
        proposalId: proposalId,
        caller: contract-caller,
        voter: tx-sender,
        amount: senderBalance
      }
    })
    ;; update the proposal record
    (map-set Proposals proposalId
      (if vote
        (merge proposalRecord {votesFor: (+ (get votesFor proposalRecord) senderBalance)})
        (merge proposalRecord {votesAgainst: (+ (get votesAgainst proposalRecord) senderBalance)})
      )
    )
    ;; record the vote for the sender
    (ok (map-set VoteRecords {proposalId: proposalId, voter: tx-sender} senderBalance))
  )
)

(define-public (conclude-proposal (proposalId uint) (action <action-trait>))
  (let
    (
      (actionContract (contract-of action))
      (proposalRecord (unwrap! (map-get? Proposals proposalId) ERR_PROPOSAL_NOT_FOUND))
      (votesFor (get votesFor proposalRecord))
      (votesAgainst (get votesAgainst proposalRecord))
      (liquidTokens (get liquidTokens proposalRecord))
      (hasVotes (> (+ votesFor votesAgainst) u0))
      ;; quorum: check if enough total votes vs liquid supply
      (metQuorum (if hasVotes
        (>= (/ (* (+ votesFor votesAgainst) u100) liquidTokens) VOTING_QUORUM)
        false))
      ;; threshold: check if enough yes votes vs total votes
      (metThreshold (if hasVotes
        (>= (/ (* votesFor u100) (+ votesFor votesAgainst)) VOTING_THRESHOLD)
        false))
      ;; proposal passed if quorum and threshold are met
      (votePassed (and hasVotes metQuorum metThreshold))
      (validAction (is-action-valid action))
    )
    ;; proposal not already concluded
    (asserts! (not (get concluded proposalRecord)) ERR_PROPOSAL_ALREADY_CONCLUDED)
    ;; proposal is past voting period
    (asserts! (>= burn-block-height (get endBlock proposalRecord)) ERR_PROPOSAL_VOTING_ACTIVE)
    ;; proposal is past execution delay
    (asserts! (>= burn-block-height (+ (get endBlock proposalRecord) VOTING_DELAY)) ERR_PROPOSAL_EXECUTION_DELAY)
    ;; action must be the same as the one in proposal
    (asserts! (is-eq (get action proposalRecord) actionContract) ERR_INVALID_ACTION)
    ;; print conclusion event
    (print {
      notification: "conclude-proposal",
      payload: {
        caller: contract-caller,
        concludedBy: tx-sender,
        proposalId: proposalId,
        metQuorum: metQuorum,
        metThreshold: metThreshold,
        passed: votePassed,
        executed: (and votePassed validAction)
      }
    })
    ;; update the proposal record
    (map-set Proposals proposalId
      (merge proposalRecord {
        concluded: true,
        metQuorum: metQuorum,
        metThreshold: metThreshold,
        passed: votePassed,
        executed: (and votePassed validAction)
      })
    )
    ;; execute the action only if it passed, return false if err
    (ok (if (and votePassed validAction)
      (match (contract-call? action run (get parameters proposalRecord)) ok_ true err_ (begin (print {err:err_}) false))
      false
    ))
  )
)

;; read only functions
;;
(define-read-only (get-voting-power (who principal) (proposalId uint))
  (let
    (
      (proposalRecord (unwrap! (map-get? Proposals proposalId) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlockHash (unwrap! (get-block-hash (get createdAt proposalRecord)) ERR_RETRIEVING_START_BLOCK_HASH))
    )
    (at-block proposalBlockHash (contract-call? '<%= it.token_contract_address %> get-balance who))
  )
)

(define-read-only (get-proposal (proposalId uint))
  (map-get? Proposals proposalId)
)

(define-read-only (get-vote-record (proposalId uint) (voter principal))
  (default-to u0 (map-get? VoteRecords {proposalId: proposalId, voter: voter}))
)

(define-read-only (get-total-proposals)
  (var-get proposalCount)
)

(define-read-only (get-last-proposal-created)
  (var-get lastProposalCreated)
)

(define-read-only (get-voting-configuration)
  {
    self: SELF,
    deployedBurnBlock: DEPLOYED_BURN_BLOCK,
    deployedStacksBlock: DEPLOYED_STACKS_BLOCK,
    delay: VOTING_DELAY,
    period: VOTING_PERIOD,
    quorum: VOTING_QUORUM,
    threshold: VOTING_THRESHOLD,
    tokenDex: VOTING_TOKEN_DEX,
    tokenPool: VOTING_TOKEN_POOL,
    treasury: VOTING_TREASURY
  }
)

;; calculate the liquid supply of the dao token
(define-read-only (get-liquid-supply (blockHeight uint))
  (let
    (
      (blockHash (unwrap! (get-block-hash blockHeight) ERR_RETRIEVING_START_BLOCK_HASH))
      (totalSupply (unwrap! (at-block blockHash (contract-call? '<%= it.token_contract_address %> get-total-supply)) ERR_FETCHING_TOKEN_DATA))
      (dexBalance (unwrap! (at-block blockHash (contract-call? '<%= it.token_contract_address %> get-balance VOTING_TOKEN_DEX)) ERR_FETCHING_TOKEN_DATA))
      (poolBalance (unwrap! (at-block blockHash (contract-call? '<%= it.token_contract_address %> get-balance VOTING_TOKEN_POOL)) ERR_FETCHING_TOKEN_DATA))
      (treasuryBalance (unwrap! (at-block blockHash (contract-call? '<%= it.token_contract_address %> get-balance VOTING_TREASURY)) ERR_FETCHING_TOKEN_DATA))
    )
    (ok (- totalSupply (+ dexBalance poolBalance treasuryBalance)))
  )
)

;; private functions
;;
(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender '<%= it.dao_contract_address %>)
    (contract-call? '<%= it.dao_contract_address %> is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)

(define-private (is-action-valid (action <action-trait>))
  (let
    (
      (extensionActive (is-ok (as-contract (is-dao-or-extension))))
      (actionActive (contract-call? '<%= it.dao_contract_address %> is-extension (contract-of action)))
    )
    (and extensionActive actionActive)
  )
)

(define-private (get-block-hash (blockHeight uint))
  (get-block-info? id-header-hash blockHeight)
)
