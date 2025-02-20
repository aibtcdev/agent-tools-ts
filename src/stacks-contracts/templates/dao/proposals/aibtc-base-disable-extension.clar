(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Disabled extension in DAO")
(define-constant CFG_MESSAGE_CONTRACT <%= it.message_contract %>)
(define-constant CFG_BASE_DAO_CONTRACT <%= it.base_dao_contract %>)
(define-constant CFG_EXTENSION <%= it.extension_contract %>)

;; errors
(define-constant ERR_EXTENSION_NOT_FOUND (err u3003))

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; check that extension exists, avoids write if not
    (asserts! (contract-call? <%= it.base_dao_contract %> is-extension CFG_EXTENSION) ERR_EXTENSION_NOT_FOUND)
    ;; update extension status
    (try! (contract-call? <%= it.base_dao_contract %> set-extension CFG_EXTENSION false))
    (ok true)
  )
)
