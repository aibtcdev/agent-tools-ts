(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; delegates STX for stacking
  (contract-call? .aibtc-treasury delegate-stx u1000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
)
