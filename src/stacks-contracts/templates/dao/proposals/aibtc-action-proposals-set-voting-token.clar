(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  (contract-call? .aibtc-action-proposals set-voting-token .aibtc-token)
)
