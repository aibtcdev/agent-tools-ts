(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Added new extension to DAO")

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; adds and enables a new extension to the DAO
    (contract-call? <%= it.base_dao_contract %> set-extension <%= it.new_extension_contract %> true)
  )
)
