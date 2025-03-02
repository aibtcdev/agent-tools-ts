(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Deposit fungible tokens to the treasury")
(define-constant CFG_TOKEN_AMOUNT <%= it.token_amount %>) ;; in microFT
(define-constant CFG_MESSAGE_CONTRACT <%= it.message_contract %>)
(define-constant CFG_TREASURY_CONTRACT <%= it.treasury_contract %>)
(define-constant CFG_TOKEN_CONTRACT <%= it.token_contract %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; deposit fungible tokens to the treasury
    (contract-call? <%= it.treasury_contract %> deposit-ft <%= it.token_contract %> CFG_TOKEN_AMOUNT)
  )
)
