(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "<%= it.message_to_send %>")

(define-public (execute (sender principal))
  ;; sends a verified message from the dao
  (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true)
)
