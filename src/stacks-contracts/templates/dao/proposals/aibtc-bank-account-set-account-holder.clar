(impl-trait <%= it.proposals_trait_v2 %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set bank account holder")
(define-constant CFG_ACCOUNT_HOLDER <%= it.account_holder %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; set the account holder
    (contract-call? <%= it.bank_account_contract %> set-account-holder CFG_ACCOUNT_HOLDER)
  )
)
