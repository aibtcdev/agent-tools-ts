(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Replaced proposal voting extensions")
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_BASE_DAO .aibtc-base-dao
;; was CFG_OLD_ACTION_PROPOSALS .aibtc-action-proposals
;; was CFG_OLD_CORE_PROPOSALS .aibtc-core-proposals
;; was CFG_NEW_ACTION_PROPOSALS .aibtc-action-proposals-v2
;; was CFG_NEW_CORE_PROPOSALS .aibtc-core-proposals-v2

;; errors
(define-constant ERR_EXTENSION_NOT_FOUND (err u3003))

(define-public (execute (sender principal))
  ;; replaces the core and action voting proposals in a dao
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; check that old extensions exist
    (asserts! (contract-call? .aibtc-base-dao is-extension .aibtc-action-proposals) ERR_EXTENSION_NOT_FOUND)
    (asserts! (contract-call? .aibtc-base-dao is-extension .aibtc-core-proposals) ERR_EXTENSION_NOT_FOUND)
    ;; disable old extensions
    (try! (contract-call? .aibtc-base-dao set-extension .aibtc-action-proposals false))
    (try! (contract-call? .aibtc-base-dao set-extension .aibtc-core-proposals false))
    ;; add new extensions
    (try! (contract-call? .aibtc-base-dao set-extension .aibtc-action-proposals-v2 true))
    (try! (contract-call? .aibtc-base-dao set-extension .aibtc-core-proposals-v2 true))
    (ok true)
  )
)
