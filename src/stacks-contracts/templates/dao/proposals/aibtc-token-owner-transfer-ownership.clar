(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; transfers ownership of the token uri to a new address
  (contract-call? .aibtc-token-owner transfer-ownership 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
)
