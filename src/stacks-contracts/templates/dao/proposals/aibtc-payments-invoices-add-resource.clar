(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Add a new resource available for invoicing")
(define-constant CFG_RESOURCE_NAME <%= it.resource_name %>)
(define-constant CFG_RESOURCE_DESCRIPTION <%= it.resource_description %>)
(define-constant CFG_RESOURCE_AMOUNT <%= it.resource_amount %>)
(define-constant CFG_RESOURCE_URL <%= it.resource_url %>)
(define-constant CFG_MESSAGE_CONTRACT <%= it.message_contract %>)
(define-constant CFG_PAYMENTS_CONTRACT <%= it.payments_contract %>)

(define-public (execute (sender principal))
  ;; adds a resource that can be used to pay invoices
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; add a resource to the payments contract
    (try! (contract-call? <%= it.payments_contract %> add-resource CFG_RESOURCE_NAME CFG_RESOURCE_DESCRIPTION CFG_RESOURCE_AMOUNT CFG_RESOURCE_URL))
    (ok true)
  )
)
