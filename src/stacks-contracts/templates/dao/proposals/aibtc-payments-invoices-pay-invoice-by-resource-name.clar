(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  (begin 
    ;; pays an invoice for a resource by name
    (try! (contract-call? .aibtc-payments-invoices pay-invoice-by-resource-name u"example-resource" none))
    (ok true)
  )
)
