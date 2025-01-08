(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; pays an invoice for a resource by index
  (begin
    (try! (contract-call? .aibtc-payments-invoices pay-invoice u1 none))
    (ok true)
  )
)
