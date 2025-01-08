(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  ;; pays an invoice for a resource by index
  (begin
    (try! (contract-call? .aibtc-payments-invoices pay-invoice u1 none))
    (ok true)
  )
)
