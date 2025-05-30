(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Withdrew BTC from the timed vault extension")

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true))
    ;; withdraw sBTC from the timed vault
    (contract-call? '<%= it.timed_vault_contract %> withdraw)
  )
)
