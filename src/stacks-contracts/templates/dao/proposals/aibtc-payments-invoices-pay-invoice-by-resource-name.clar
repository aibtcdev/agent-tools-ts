(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Pay an invoice for a resource by name")
(define-constant CFG_RESOURCE_NAME <%= it.resource_name %>)
(define-constant CFG_MEMO <%= it.memo %>)
(define-constant CFG_MESSAGE_CONTRACT <%= it.message_contract %>)
(define-constant CFG_PAYMENTS_CONTRACT <%= it.payments_contract %>)

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; pays an invoice for a resource by name
    (try! (contract-call? <%= it.payments_contract %> pay-invoice-by-resource-name CFG_RESOURCE_NAME CFG_MEMO))
    (ok true)
  )
)
