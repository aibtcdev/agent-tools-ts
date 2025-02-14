(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Initializing new bank account")
(define-constant CFG_ACCOUNT_HOLDER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-constant CFG_AMOUNT_TO_FUND_STX u100) ;; set to 0 to skip, in microSTX
(define-constant CFG_AMOUNT_TO_FUND_FT u100) ;; set to 0 to skip, in microFT

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true)) ;; CFG_MESSAGE_CONTRACT
    ;; set the account holder in the bank account
    (try! (contract-call? .aibtc-bank-account set-account-holder CFG_ACCOUNT_HOLDER)) ;; CFG_NEW_BANK_ACCOUNT_CONTRACT
    ;; enable the extension in the dao
    (try! (contract-call? .aibtc-base-dao set-extension .aibtc-bank-account true)) ;; CFG_BASE_DAO, CFG_NEW_BANK_ACCOUNT_CONTRACT
    ;; fund the extension from the treasury
    (and (> CFG_AMOUNT_TO_FUND_STX u0)
      (try! (contract-call? .aibtc-treasury withdraw-stx CFG_AMOUNT_TO_FUND_STX .aibtc-bank-account))) ;; CFG_TREASURY_CONTRACT, CFG_NEW_BANK_ACCOUNT_CONTRACT
    (and (> CFG_AMOUNT_TO_FUND_FT u0)
      (try! (contract-call? .aibtc-treasury withdraw-ft .aibtc-token CFG_AMOUNT_TO_FUND_FT .aibtc-bank-account))) ;; CFG_TREASURY_CONTRACT, CFG_TOKEN_CONTRACT, CFG_NEW_BANK_ACCOUNT_CONTRACT
    (ok true)
  )
)
