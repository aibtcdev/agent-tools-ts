(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Added new extension to DAO")
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_BASE_DAO .aibtc-base-dao
;; was CFG_NEW_EXTENSION .aibtc-bank-account

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; adds and enables a new extension to the DAO
    (contract-call? .aibtc-base-dao set-extension .aibtc-bank-account true)
  )
)
