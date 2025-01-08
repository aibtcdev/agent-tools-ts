(impl-trait .aibtcdev-dao-traits-v1.proposal)


(define-public (execute (sender principal))
  (begin
    ;; set the account holder in the bank account
    (try! (contract-call? .aibtc-bank-account set-account-holder sender))
    ;; enable the extension in the dao
    (try! (contract-call? .aibtcdev-base-dao set-extension .aibtc-bank-account true))
    ;; fund the extension from the treasury
    (try! (contract-call? .aibtc-treasury withdraw-stx u10000000 .aibtc-bank-account))
    (ok true)
  )
)
