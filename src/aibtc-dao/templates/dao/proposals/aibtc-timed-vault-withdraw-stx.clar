(impl-trait <%= it.proposals_trait_v2 %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Withdraw STX from timed vault")

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; withdraw STX from the timed vault
    (contract-call? <%= it.timed_vault_contract %> withdraw-stx)
  )
)
