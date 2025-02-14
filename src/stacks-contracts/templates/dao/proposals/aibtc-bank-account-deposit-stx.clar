(impl-trait '<%= it.proposals_trait_v2 %>)

(define-public (execute (sender principal))
  (contract-call? .aibtc-bank-account deposit-stx u10000000)
)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Deposit STX in bank account")
(define-constant CFG_DEPOSIT_AMOUNT <%= it.deposit_amount %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true)) ;; CFG_MESSAGE_CONTRACT
    ;; deposit STX in the bank account
    (contract-call? <%= it.bank_account_contract %> deposit-stx CFG_DEPOSIT_AMOUNT) ;; CFG_BANK_ACCOUNT_CONTRACT
  )
)
