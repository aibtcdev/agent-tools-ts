(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Updated the payment address in the BTC payment processor")
(define-constant CFG_PAYOUT_ADDRESS '<%= it.payout_address %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true))
    ;; set the payment address for invoices
    (contract-call? '<%= it.payments_sbtc_contract %> set-payment-address CFG_PAYOUT_ADDRESS)
  )
)
