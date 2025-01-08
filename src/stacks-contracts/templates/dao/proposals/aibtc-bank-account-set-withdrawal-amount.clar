(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  (contract-call? .aibtc-bank-account set-withdrawal-amount u10000000)
)
