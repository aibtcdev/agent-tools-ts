(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Toggled a resource status by name in the DAO payment processor")
(define-constant CFG_RESOURCE_NAME u"example-resource")

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true))
    ;; toggle a resource enabled status by name
    (contract-call? '<%= it.payments_dao_contract %> toggle-resource-by-name CFG_RESOURCE_NAME)
  )
)
