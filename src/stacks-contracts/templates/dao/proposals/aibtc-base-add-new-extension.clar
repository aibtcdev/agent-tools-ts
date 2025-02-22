(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Added new extension to DAO")
(define-constant CFG_MESSAGE_CONTRACT <%= it.message_contract %>)
(define-constant CFG_BASE_DAO_CONTRACT <%= it.base_dao_contract %>)
(define-constant CFG_NEW_EXTENSION <%= it.new_extension_contract %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; adds and enables a new extension to the DAO
    (contract-call? <%= it.base_dao_contract %> set-extension CFG_NEW_EXTENSION true)
  )
)
