(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set token uri for dao token")

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; set token uri in the token owner contract
    (contract-call? <%= it.token_owner_contract %> set-token-uri <%= it.token_uri %>)
  )
)
