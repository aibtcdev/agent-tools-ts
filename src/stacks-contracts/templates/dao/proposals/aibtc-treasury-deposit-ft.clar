(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; deposits fungible tokens to the treasury
  (contract-call? .aibtc-treasury deposit-ft .aibtc-token u1000)
)
