(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Replaced proposal voting extensions")

;; errors
(define-constant ERR_EXTENSION_NOT_FOUND (err u3003))

(define-public (execute (sender principal))
  ;; replaces the core and action voting proposals in a dao
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; check that old extensions exist
    (asserts! (contract-call? <%= it.base_dao_contract %> is-extension <%= it.old_action_proposals_contract %>) ERR_EXTENSION_NOT_FOUND)
    (asserts! (contract-call? <%= it.base_dao_contract %> is-extension <%= it.old_core_proposals_contract %>) ERR_EXTENSION_NOT_FOUND)
    ;; disable old extensions
    (try! (contract-call? <%= it.base_dao_contract %> set-extension <%= it.old_action_proposals_contract %> false))
    (try! (contract-call? <%= it.base_dao_contract %> set-extension <%= it.old_core_proposals_contract %> false))
    ;; add new extensions
    (try! (contract-call? <%= it.base_dao_contract %> set-extension <%= it.new_action_proposals_contract %> true))
    (try! (contract-call? <%= it.base_dao_contract %> set-extension <%= it.new_core_proposals_contract %> true))
    (ok true)
  )
)
