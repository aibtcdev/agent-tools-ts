(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Replaced core and action proposal voting extensions in the base DAO")
(define-constant CFG_OLD_ACTION_PROPOSALS '<%= it.old_action_proposals_contract %>)
(define-constant CFG_OLD_CORE_PROPOSALS '<%= it.old_core_proposals_contract %>)
(define-constant CFG_NEW_ACTION_PROPOSALS '<%= it.new_action_proposals_contract %>)
(define-constant CFG_NEW_CORE_PROPOSALS '<%= it.new_core_proposals_contract %>)

;; errors
(define-constant ERR_EXTENSION_NOT_FOUND (err u30003))

(define-public (execute (sender principal))
  ;; replaces the core and action voting proposals in a dao
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; check that old extensions exist
    (asserts! (contract-call? '<%= it.base_dao_contract %> is-extension CFG_OLD_ACTION_PROPOSALS) ERR_EXTENSION_NOT_FOUND)
    (asserts! (contract-call? '<%= it.base_dao_contract %> is-extension CFG_OLD_CORE_PROPOSALS) ERR_EXTENSION_NOT_FOUND)
    ;; disable old extensions
    (try! (contract-call? '<%= it.base_dao_contract %> set-extension CFG_OLD_ACTION_PROPOSALS false))
    (try! (contract-call? '<%= it.base_dao_contract %> set-extension CFG_OLD_CORE_PROPOSALS false))
    ;; add new extensions
    (try! (contract-call? '<%= it.base_dao_contract %> set-extension CFG_NEW_ACTION_PROPOSALS true))
    (try! (contract-call? '<%= it.base_dao_contract %> set-extension CFG_NEW_CORE_PROPOSALS true))
    (ok true)
  )
)
