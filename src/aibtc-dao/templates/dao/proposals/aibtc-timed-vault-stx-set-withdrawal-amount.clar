(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set withdrawal amount in the STX timed vault extension")
(define-constant CFG_WITHDRAWAL_AMOUNT u<%= it.withdrawal_amount %>) ;; 10 STX (6 decimals)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true))
    ;; set the withdrawal amount
    (contract-call? '<%= it.timed_vault_contract %> set-withdrawal-amount CFG_WITHDRAWAL_AMOUNT)
  )
)
