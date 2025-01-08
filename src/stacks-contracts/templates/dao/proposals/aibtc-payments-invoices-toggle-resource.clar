(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; toggles enabled status for resource by index
  (contract-call? .aibtc-payments-invoices toggle-resource u1)
)
