(impl-trait <%= it.proposals_trait_v2 %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set bank account withdrawal amount")
(define-constant CFG_WITHDRAWAL_AMOUNT <%= it.withdrawal_amount %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; set the withdrawal amount
    (contract-call? <%= it.bank_account_contract %> set-withdrawal-amount CFG_WITHDRAWAL_AMOUNT)
  )
)
