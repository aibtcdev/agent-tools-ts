(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Overwrote last withdrawal block in the STX timed vault extension")
(define-constant CFG_LAST_WITHDRAWAL_BLOCK u<%= it.last_withdrawal_block %>) ;; the last withdrawal block to set

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true)) ;; CFG_MESSAGE_CONTRACT
    ;; override last withdrawal block in the timed vault
    (contract-call? '<%= it.timed_vault_contract %> override-last-withdrawal-block CFG_LAST_WITHDRAWAL_BLOCK) ;; CFG_TIMED_VAULT_CONTRACT
  )
)
