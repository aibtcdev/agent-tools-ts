(impl-trait '<%= it.extension_trait %>)
(impl-trait '<%= it.action_trait %>)

(define-constant ERR_UNAUTHORIZED (err u10001))
(define-constant ERR_INVALID_PARAMS (err u10002))

(define-constant CFG_MESSAGE "Executed Action Proposal: Added a resource in the payments/invoices extension")

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (run (parameters (buff 2048)))
  (let
    (
      (paramsTuple (unwrap! (from-consensus-buff?
        { name: (string-utf8 50), description: (string-utf8 255), price: uint, url: (optional (string-utf8 255)) }
        parameters) ERR_INVALID_PARAMS))
    )
    (try! (is-dao-or-extension))
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true))
    (try! (contract-call? '<%= it.payments_contract %> add-resource (get name paramsTuple) (get description paramsTuple) (get price paramsTuple) (get url paramsTuple)))
    (ok true)
  )
)

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender '<%= it.base_dao_contract %>)
    (contract-call? '<%= it.base_dao_contract %> is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)
