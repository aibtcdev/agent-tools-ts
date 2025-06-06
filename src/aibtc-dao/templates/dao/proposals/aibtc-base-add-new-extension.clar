(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Added new extension in the base DAO")
(define-constant CFG_NEW_EXTENSION '<%= it.new_extension_contract %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; adds and enables a new extension to the DAO
    (contract-call? '<%= it.base_dao_contract %> set-extension CFG_NEW_EXTENSION true)
  )
)
