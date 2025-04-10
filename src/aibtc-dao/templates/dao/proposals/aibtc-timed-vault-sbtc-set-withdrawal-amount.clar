(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set withdrawal amount in the BTC timed vault extension")
(define-constant CFG_WITHDRAWAL_AMOUNT u<%= it.withdrawal_amount %>) ;; the withdrawal amount to set

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true))
    ;; set the withdrawal amount
    (contract-call? '<%= it.timed_vault_contract %> set-withdrawal-amount CFG_WITHDRAWAL_AMOUNT)
  )
)
