(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set or updated the account holder in the DAO token timed vault extension")
(define-constant CFG_ACCOUNT_HOLDER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true))
    ;; set the account holder
    (contract-call? '<%= it.timed_vault_contract %> set-account-holder CFG_ACCOUNT_HOLDER)
  )
)
