(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Overwrote last withdrawal block in the STX timed vault extension")
;; add 5 to avoid matching deployed height of contracts for testing
(define-constant CFG_LAST_WITHDRAWAL_BLOCK (+ burn-block-height u5))

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true)) ;; CFG_MESSAGE_CONTRACT
    ;; override last withdrawal block in the timed vault
    (contract-call? '<%= it.timed_vault_contract %> override-last-withdrawal-block CFG_LAST_WITHDRAWAL_BLOCK) ;; CFG_TIMED_VAULT_CONTRACT
  )
)
