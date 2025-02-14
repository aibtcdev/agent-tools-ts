(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Withdraw fungible tokens from the treasury")
(define-constant CFG_TOKEN_AMOUNT u1000) ;; in microFT
(define-constant CFG_RECIPIENT 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_TREASURY_CONTRACT .aibtc-treasury
;; was CFG_TOKEN_CONTRACT .aibtc-token

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; withdraw fungible tokens from the treasury
    (contract-call? .aibtc-treasury withdraw-ft .aibtc-token CFG_TOKEN_AMOUNT CFG_RECIPIENT)
  )
)
