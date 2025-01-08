(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; revokes STX delegation
  (contract-call? .aibtc-treasury revoke-delegate-stx)
)
