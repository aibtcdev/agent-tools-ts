(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; withdraws fungible tokens from the treasury
  (contract-call? .aibtc-treasury withdraw-ft .aibtc-token u1000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
)
