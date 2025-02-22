(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set the payment address for invoices")
(define-constant CFG_PAYOUT_ADDRESS <%= it.payout_address %>)
(define-constant CFG_MESSAGE_CONTRACT <%= it.message_contract %>)
(define-constant CFG_PAYMENTS_CONTRACT <%= it.payments_contract %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; set the payment address for invoices
    (contract-call? <%= it.payments_contract %> set-payment-address CFG_PAYOUT_ADDRESS)
  )
)
