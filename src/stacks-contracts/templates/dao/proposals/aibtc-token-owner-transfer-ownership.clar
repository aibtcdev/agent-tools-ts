(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Transfer dao token ownership to new owner")
(define-constant CFG_NEW_OWNER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_TOKEN_OWNER_CONTRACT .aibtc-token-owner

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; transfer ownership to new owner
    (contract-call? .aibtc-token-owner transfer-ownership CFG_NEW_OWNER)
  )
)
