(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Replaced extension in the base DAO")
(define-constant CFG_OLD_EXTENSION '<%= it.old_extension_contract %>)
(define-constant CFG_NEW_EXTENSION '<%= it.new_extension_contract %>)

;; errors
(define-constant ERR_EXTENSION_NOT_FOUND (err u30003))

(define-public (execute (sender principal))
  ;; replaces an extension in the DAO
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; check that old extension exists
    (asserts! (contract-call? '<%= it.base_dao_contract %> is-extension CFG_OLD_EXTENSION) ERR_EXTENSION_NOT_FOUND)
    ;; update extension status to false
    (try! (contract-call? '<%= it.base_dao_contract %> set-extension CFG_OLD_EXTENSION false))
    ;; add new extension to the dao
    (try! (contract-call? '<%= it.base_dao_contract %> set-extension CFG_NEW_EXTENSION true))
    (ok true)
  )
)
