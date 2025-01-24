(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; deposits STX to the treasury
  (contract-call? .aibtc-treasury deposit-stx u1000000)
)
