(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-constant ERR_EXTENSION_NOT_FOUND (err u404))

(define-public (execute (sender principal))
  ;; disables an extension in the DAO
  (begin
    ;; check that extension exists, avoids write if not
    (asserts! (contract-call? .aibtcdev-base-dao is-extension .aibtc-bank-account) ERR_EXTENSION_NOT_FOUND)
    ;; update extension status
    (try! (contract-call? .aibtcdev-base-dao set-extension .aibtc-bank-account true))
    (ok true)
  )
)
