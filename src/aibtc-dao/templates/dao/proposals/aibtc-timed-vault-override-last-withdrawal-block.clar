(impl-trait <%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Override last withdrawal block in the timed vault extension")
(define-constant CFG_LAST_WITHDRAWAL_BLOCK u<%= it.last_withdrawal_block %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; override last withdrawal block in the timed vault
    (contract-call? '<%= it.timed_vault_contract %> override-last-withdrawal-block CFG_LAST_WITHDRAWAL_BLOCK)
  )
)
