(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Enabled extension in the base DAO")
(define-constant CFG_EXTENSION '<%= it.extension_contract %>)

(define-public (execute (sender principal))
  ;; enables an extension in the DAO
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; update extension status
    (try! (contract-call? '<%= it.base_dao_contract %> set-extension CFG_EXTENSION true))
    (ok true)
  )
)
