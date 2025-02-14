(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Deposit fungible tokens to the treasury")
(define-constant CFG_TOKEN_AMOUNT u1000) ;; in microFT
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_TREASURY_CONTRACT .aibtc-treasury
;; was CFG_TOKEN_CONTRACT .aibtc-token

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; deposit fungible tokens to the treasury
    (contract-call? .aibtc-treasury deposit-ft .aibtc-token CFG_TOKEN_AMOUNT)
  )
)
