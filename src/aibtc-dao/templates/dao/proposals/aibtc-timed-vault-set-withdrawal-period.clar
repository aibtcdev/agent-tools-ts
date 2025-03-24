(impl-trait <%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set withdrawal period in the timed vault extension")
(define-constant CFG_WITHDRAWAL_PERIOD u<%= it.withdrawal_period %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; set the withdrawal period
    (contract-call? '<%= it.timed_vault_contract %> set-withdrawal-period CFG_WITHDRAWAL_PERIOD)
  )
)
