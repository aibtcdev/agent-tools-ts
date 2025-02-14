(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Toggle a resource enabled status by index")
(define-constant CFG_RESOURCE_INDEX u1)
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_PAYMENTS_CONTRACT .aibtc-payments-invoices

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; toggle a resource enabled status by index
    (contract-call? .aibtc-payments-invoices toggle-resource CFG_RESOURCE_INDEX)
  )
)
