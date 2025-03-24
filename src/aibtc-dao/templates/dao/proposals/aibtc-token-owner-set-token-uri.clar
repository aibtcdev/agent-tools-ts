(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set token URI in the DAO token contract")
(define-constant CFG_TOKEN_URI "<%= it.token_uri %>")

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; set token uri in the token owner contract
    (contract-call? '<%= it.token_owner_contract %> set-token-uri CFG_TOKEN_URI)
  )
)
