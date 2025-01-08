(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  (contract-call? .aibtc-action-proposals set-voting-token .aibtc-token)
)
