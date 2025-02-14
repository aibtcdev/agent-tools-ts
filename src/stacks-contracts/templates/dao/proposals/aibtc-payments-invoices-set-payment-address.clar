(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set the payment address for invoices")
(define-constant CFG_PAYOUT_ADDRESS .aibtc-bank-account)
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_PAYMENTS_CONTRACT .aibtc-payments-invoices

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; set the payment address for invoices
    (contract-call? .aibtc-payments-invoices set-payment-address CFG_PAYOUT_ADDRESS)
  )
)
