(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; withdraws STX from the treasury
  (contract-call? .aibtc-treasury withdraw-stx u1000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
)
