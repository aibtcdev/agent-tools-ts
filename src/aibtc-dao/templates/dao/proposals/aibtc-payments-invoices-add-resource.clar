(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Added a new resource available in the payments/invoices extension")
(define-constant CFG_RESOURCE_NAME "<%= it.resource_name %>")
(define-constant CFG_RESOURCE_DESCRIPTION "<%= it.resource_description %>")
(define-constant CFG_RESOURCE_AMOUNT u<%= it.resource_amount %>)
(define-constant CFG_RESOURCE_URL "<%= it.resource_url %>")

(define-public (execute (sender principal))
  ;; adds a resource that can be used to pay invoices
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; add a resource to the payments contract
    (try! (contract-call? '<%= it.payments_contract %> add-resource CFG_RESOURCE_NAME CFG_RESOURCE_DESCRIPTION CFG_RESOURCE_AMOUNT CFG_RESOURCE_URL))
    (ok true)
  )
)
