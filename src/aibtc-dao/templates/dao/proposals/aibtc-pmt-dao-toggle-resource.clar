(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Toggled a resource status by index in the DAO payment processor")
(define-constant CFG_RESOURCE_INDEX u"<%= it.resource_index %>") ;; index of the resource

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true))
    ;; toggle a resource enabled status by index
    (contract-call? '<%= it.payments_dao_contract %> toggle-resource CFG_RESOURCE_INDEX)
  )
)
