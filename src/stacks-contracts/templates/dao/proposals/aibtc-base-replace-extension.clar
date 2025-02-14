(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Replaced extension in DAO")
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_BASE_DAO .aibtc-base-dao
;; was CFG_OLD_EXTENSION .aibtc-bank-account
;; was CFG_NEW_EXTENSION .aibtc-bank-account

;; errors
(define-constant ERR_EXTENSION_NOT_FOUND (err u3003))

(define-public (execute (sender principal))
  ;; replaces an extension in the DAO
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; check that old extension exists
    (asserts! (contract-call? .aibtc-base-dao is-extension .aibtc-bank-account) ERR_EXTENSION_NOT_FOUND)
    ;; update extension status to false
    (try! (contract-call? .aibtc-base-dao set-extension .aibtc-bank-account false))
    ;; add new extension to the dao
    (try! (contract-call? .aibtc-base-dao set-extension .aibtc-bank-account true))
    (ok true)
  )
)
