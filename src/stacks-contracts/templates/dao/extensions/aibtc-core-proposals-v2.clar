;; title: aibtcdev-core-proposals
;; version: 2.0.0
;; summary: An extension that manages voting on proposals to execute Clarity code using a SIP-010 Stacks token.
;; description: This contract can make changes to core DAO functionality with a high voting threshold by executing Clarity code in the context of the DAO.

;; traits
;;
(impl-trait '<%= it.extension_trait %>)
(impl-trait '<%= it.core_proposal_trait %>)

(use-trait proposal-trait '<%= it.proposal_trait %>)
(use-trait treasury-trait '<%= it.treasury_trait %>)

;; constants
;;
(define-constant SELF (as-contract tx-sender))
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK block-height)

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u3000))
(define-constant ERR_FETCHING_TOKEN_DATA (err u3001))
(define-constant ERR_INSUFFICIENT_BALANCE (err u3002))
(define-constant ERR_PROPOSAL_NOT_FOUND (err u3003))
(define-constant ERR_PROPOSAL_ALREADY_EXECUTED (err u3004))
(define-constant ERR_PROPOSAL_VOTING_ACTIVE (err u3005))
(define-constant ERR_PROPOSAL_EXECUTION_DELAY (err u3006))
(define-constant ERR_SAVING_PROPOSAL (err u3007))
(define-constant ERR_PROPOSAL_ALREADY_CONCLUDED (err u3008))
(define-constant ERR_RETRIEVING_START_BLOCK_HASH (err u3009))
(define-constant ERR_VOTE_TOO_SOON (err u3010))
(define-constant ERR_VOTE_TOO_LATE (err u3011))
(define-constant ERR_ALREADY_VOTED (err u3012))
(define-constant ERR_FIRST_VOTING_PERIOD (err u3013))

;; voting configuration
(define-constant VOTING_DELAY u432) ;; 3 x 144 Bitcoin blocks, ~3 days
(define-constant VOTING_PERIOD u432) ;; 3 x 144 Bitcoin blocks, ~3 days
(define-constant VOTING_QUORUM u25) ;; 25% of liquid supply must participate
(define-constant VOTING_THRESHOLD u90) ;; 90% of votes must be in favor

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
  principal ;; proposal contract
  {
    createdAt: uint, ;; stacks block height for at-block calls
    caller: principal, ;; contract caller
    creator: principal, ;; proposal creator (tx-sender)
    startBlock: uint, ;; burn block height
    endBlock: uint, ;; burn block height
    votesFor: uint, ;; total votes for
    votesAgainst: uint, ;; total votes against
    liquidTokens: uint, ;; liquid tokens at start block
    concluded: bool, ;; has the proposal concluded
    metQuorum: bool, ;; did the proposal meet quorum
    metThreshold: bool, ;; did the proposal meet threshold
    passed: bool, ;; did the proposal pass
    executed: bool, ;; did the proposal execute
  }
)

(define-map VoteRecords
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

(define-public (create-proposal (proposal <proposal-trait>))
  (let
    (
      (proposalContract (contract-of proposal))
      (createdAt block-height)
      (liquidTokens (try! (get-liquid-supply createdAt)))
      (startBlock (+ burn-block-height VOTING_DELAY))
      (endBlock (+ startBlock VOTING_PERIOD))
      (senderBalance (unwrap! (contract-call? '<%= it.token_contract_address %> get-balance tx-sender) ERR_FETCHING_TOKEN_DATA))
    )
    ;; liquidTokens is greater than zero
    (asserts! (> liquidTokens u0) ERR_FETCHING_TOKEN_DATA)
    ;; at least one voting period passed
    (asserts! (>= burn-block-height (+ DEPLOYED_BURN_BLOCK VOTING_PERIOD)) ERR_FIRST_VOTING_PERIOD)
    ;; caller has the required balance
    (asserts! (> senderBalance u0) ERR_INSUFFICIENT_BALANCE)
    ;; proposal was not already executed
    (asserts! (is-none (contract-call? '<%= it.dao_contract_address %> executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
    ;; print proposal creation event
    (print {
      notification: "create-proposal",
      payload: {
        proposal: proposalContract,
        caller: contract-caller,
        creator: tx-sender,
        createdAt: createdAt,
        startBlock: startBlock,
        endBlock: endBlock,
        liquidTokens: liquidTokens,
      }
    })
    ;; create the proposal
    (asserts! (map-insert Proposals proposalContract {
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
    ;; increment the proposal count
    (ok (var-set proposalCount (+ (var-get proposalCount) u1)))
))

(define-public (vote-on-proposal (proposal <proposal-trait>) (vote bool))
  (let
    (
      (proposalContract (contract-of proposal))
      (proposalRecord (unwrap! (map-get? Proposals proposalContract) ERR_PROPOSAL_NOT_FOUND))
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
    (asserts! (is-none (map-get? VoteRecords {proposal: proposalContract, voter: tx-sender})) ERR_ALREADY_VOTED)
    ;; print vote event
    (print {
      notification: "vote-on-proposal",
      payload: {
        proposal: proposalContract,
        caller: contract-caller,
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
    (ok (map-set VoteRecords {proposal: proposalContract, voter: tx-sender} senderBalance))
  )
)

(define-public (conclude-proposal (proposal <proposal-trait>))
  (let
    (
      (proposalContract (contract-of proposal))
      (proposalRecord (unwrap! (map-get? Proposals proposalContract) ERR_PROPOSAL_NOT_FOUND))
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
      (proposalExecuted (is-some (contract-call? '<%= it.dao_contract_address %> executed-at proposal)))
    )
    ;; proposal was not already concluded
    (asserts! (not (get concluded proposalRecord)) ERR_PROPOSAL_ALREADY_CONCLUDED)
    ;; proposal is past voting period
    (asserts! (>= burn-block-height (get endBlock proposalRecord)) ERR_PROPOSAL_VOTING_ACTIVE)
    ;; proposal is past execution delay
    (asserts! (>= burn-block-height (+ (get endBlock proposalRecord) VOTING_DELAY)) ERR_PROPOSAL_EXECUTION_DELAY)
    ;; print conclusion event
    (print {
      notification: "conclude-proposal",
      payload: {
        caller: contract-caller,
        concludedBy: tx-sender,
        proposal: proposalContract,
        metQuorum: metQuorum,
        metThreshold: metThreshold,
        passed: votePassed,
        executed: (and (not proposalExecuted) votePassed),
      }
    })
    ;; update the proposal record
    (map-set Proposals proposalContract
      (merge proposalRecord {
        concluded: true,
        metQuorum: metQuorum,
        metThreshold: metThreshold,
        passed: votePassed,
        executed: (and (not proposalExecuted) votePassed),
      })
    )
    ;; execute the proposal only if it passed, return false if err
    (ok (if (and (not proposalExecuted) votePassed)
      (match (contract-call? '<%= it.dao_contract_address %> execute proposal tx-sender) ok_ true err_ (begin (print {err:err_}) false))
      false
    ))
  )
)

;; read only functions
;;
(define-read-only (get-voting-power (who principal) (proposal <proposal-trait>))
  (let
    (
      (proposalRecord (unwrap! (map-get? Proposals (contract-of proposal)) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlockHash (unwrap! (get-block-hash (get createdAt proposalRecord)) ERR_RETRIEVING_START_BLOCK_HASH))
    )
    (at-block proposalBlockHash (contract-call? '<%= it.token_contract_address %> get-balance who))
  )
)

(define-read-only (get-proposal (proposal principal))
  (map-get? Proposals proposal)
)

(define-read-only (get-vote-record (proposal principal) (voter principal))
  (default-to u0 (map-get? VoteRecords {proposal: proposal, voter: voter}))
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

(define-private (get-block-hash (blockHeight uint))
  (get-block-info? id-header-hash blockHeight)
)
