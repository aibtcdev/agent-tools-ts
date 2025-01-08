(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  ;; sets payment address for invoices
  (contract-call? .aibtc-payments-invoices set-payment-address .aibtc-bank-account)
)
