(impl-trait <%= it.proposals_trait_v2 %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Override last withdrawal block")
(define-constant CFG_LAST_WITHDRAWAL_BLOCK <%= it.last_withdrawal_block %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; override last withdrawal block in the bank account
    (contract-call? <%= it.bank_account_contract %> override-last-withdrawal-block CFG_LAST_WITHDRAWAL_BLOCK)
  )
)
