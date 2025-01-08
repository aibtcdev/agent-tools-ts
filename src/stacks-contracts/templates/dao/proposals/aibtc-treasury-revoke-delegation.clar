(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  ;; revokes STX delegation
  (contract-call? .aibtc-treasury revoke-delegate-stx)
)
