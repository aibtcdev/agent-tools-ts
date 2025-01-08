(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  ;; toggles enabled status for resource by name
  (contract-call? .aibtc-payments-invoices toggle-resource-by-name u"example-resource")
)
