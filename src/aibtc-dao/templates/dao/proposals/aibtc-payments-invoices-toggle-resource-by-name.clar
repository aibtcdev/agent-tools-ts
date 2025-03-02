(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Toggle a resource enabled status by name")
(define-constant CFG_RESOURCE_NAME <%= it.resource_name %>)
(define-constant CFG_MESSAGE_CONTRACT <%= it.message_contract %>)
(define-constant CFG_PAYMENTS_CONTRACT <%= it.payments_contract %>)

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; toggle a resource enabled status by name
    (contract-call? <%= it.payments_contract %> toggle-resource-by-name CFG_RESOURCE_NAME)
  )
)
