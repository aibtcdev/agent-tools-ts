(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Disabled extension in DAO")
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_BASE_DAO .aibtc-base-dao
;; was CFG_EXTENSION .aibtc-bank-account

;; errors
(define-constant ERR_EXTENSION_NOT_FOUND (err u3003))

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; check that extension exists, avoids write if not
    (asserts! (contract-call? .aibtc-base-dao is-extension .aibtc-bank-account) ERR_EXTENSION_NOT_FOUND)
    ;; update extension status
    (try! (contract-call? .aibtc-base-dao set-extension .aibtc-bank-account false))
    (ok true)
  )
)
