(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Transfer dao token ownership to new owner")
(define-constant CFG_NEW_OWNER <%= it.new_owner %>)
(define-constant CFG_MESSAGE_CONTRACT <%= it.message_contract %>)
(define-constant CFG_TOKEN_OWNER_CONTRACT <%= it.token_owner_contract %>)

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; transfer ownership to new owner
    (contract-call? CFG_TOKEN_OWNER_CONTRACT transfer-ownership CFG_NEW_OWNER)
  )
)
