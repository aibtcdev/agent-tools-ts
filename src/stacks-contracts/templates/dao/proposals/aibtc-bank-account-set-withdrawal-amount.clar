(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set bank account withdrawal amount")
(define-constant CFG_WITHDRAWAL_AMOUNT u10000000)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; set the withdrawal amount
    (contract-call? .aibtc-bank-account set-withdrawal-amount CFG_WITHDRAWAL_AMOUNT)
  )
)
