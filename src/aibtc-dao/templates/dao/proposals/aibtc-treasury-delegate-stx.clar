(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Delegated STX for stacking in the treasury extension")
(define-constant CFG_AMOUNT u<%= it.delegate_amount %>)
(define-constant CFG_DELEGATE_TO '<%= it.delegate_to %>)

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; delegate STX for stacking
    (contract-call? '<%= it.treasury_contract %> delegate-stx CFG_AMOUNT CFG_DELEGATE_TO)
  )
)
