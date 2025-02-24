;; title: aibtc-onchain-messaging
;; version: 1.0.0
;; summary: An extension to send messages on-chain to anyone listening to this contract.

;; traits
;;
(impl-trait '<%= it.extension_trait %>)
(impl-trait '<%= it.messaging_trait %>)

;; constants
;;
(define-constant INPUT_ERROR (err u4000))
(define-constant ERR_UNAUTHORIZED (err u4001))

;; public functions

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (send (msg (string-ascii 1048576)) (isFromDao bool))
  (begin
    (and isFromDao (try! (is-dao-or-extension)))
    (asserts! (> (len msg) u0) INPUT_ERROR)
    ;; print the message as the first event
    (print msg)
    ;; print the envelope info for the message
    (print {
      notification: "send",
      payload: {
        caller: contract-caller,
        height: stacks-block-height,
        isFromDao: isFromDao,
        sender: tx-sender,
      }
    })
    (ok true)
  )
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender '<%= it.dao_contract_address %>)
    (contract-call? '<%= it.dao_contract_address %> is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)
