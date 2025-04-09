(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Added a new resource available in the BTC payment processor")
(define-constant CFG_RESOURCE_NAME u"<%= it.resource_name %>") ;; name of the resource
(define-constant CFG_RESOURCE_DESCRIPTION u"<%= it.resource_description %>") ;; description of the resource
(define-constant CFG_RESOURCE_AMOUNT u<%= it.resource_amount %>) ;; 0.01 BTC (8 decimals)
(define-constant CFG_RESOURCE_URL <% if (it.resource_url) { %> (some u"<%= it.resource_url %>") <% } else { %> none <% } %>)

(define-public (execute (sender principal))
  ;; adds a resource that can be used to pay invoices
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true))
    ;; add a resource to the payments contract
    (try! (contract-call? '<%= it.payments_sbtc_contract %> add-resource CFG_RESOURCE_NAME CFG_RESOURCE_DESCRIPTION CFG_RESOURCE_AMOUNT CFG_RESOURCE_URL))
    (ok true)
  )
)
