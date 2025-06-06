(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set or updated the DAO charter extension")
(define-constant CFG_CHARTER_TEXT "<%= it.dao_charter_text %>")
(define-constant CFG_CHARTER_INSCRIPTION_ID "<%= it.dao_charter_inscription_id %>")

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; updates the charter for a dao
    (if (> (len CFG_CHARTER_INSCRIPTION_ID) u0)
      (contract-call? '<%= it.charter_contract %> set-dao-charter CFG_CHARTER_TEXT (some CFG_CHARTER_INSCRIPTION_ID))
      (contract-call? '<%= it.charter_contract %> set-dao-charter CFG_CHARTER_TEXT none)
    )
  )
)
