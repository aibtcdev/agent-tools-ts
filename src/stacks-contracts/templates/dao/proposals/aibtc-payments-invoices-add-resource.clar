(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Add a new resource available for invoicing")
(define-constant CFG_RESOURCE_NAME u"example-resource")
(define-constant CFG_RESOURCE_DESCRIPTION u"An example resource")
(define-constant CFG_RESOURCE_AMOUNT u1000000)
(define-constant CFG_RESOURCE_URL (some u"https://example.com")) ;; or none
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_PAYMENTS_CONTRACT .aibtc-payments-invoices

(define-public (execute (sender principal))
  ;; adds a resource that can be used to pay invoices
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; add a resource to the payments contract
    (try! (contract-call? .aibtc-payments-invoices add-resource CFG_RESOURCE_NAME CFG_RESOURCE_DESCRIPTION CFG_RESOURCE_AMOUNT CFG_RESOURCE_URL))
    (ok true)
  )
)
