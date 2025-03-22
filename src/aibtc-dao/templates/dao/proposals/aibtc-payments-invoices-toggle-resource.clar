(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Toggled a resource status by index in the payments/invoices extension")
(define-constant CFG_RESOURCE_INDEX u<%= it.resource_index %>)

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; toggle a resource enabled status by index
    (contract-call? '<%= it.payments_contract %> toggle-resource CFG_RESOURCE_INDEX)
  )
)
