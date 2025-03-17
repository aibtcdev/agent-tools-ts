(impl-trait '<%= it.extension_trait %>)
(impl-trait '<%= it.action_trait %>)

(define-constant ERR_UNAUTHORIZED (err u10001))
(define-constant ERR_INVALID_PARAMS (err u10002))

(define-constant CFG_MESSAGE "Executed Action Proposal: Set new account holder in timed vault extension")

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (run (parameters (buff 2048)))
  (let
    (
      (accountHolder (unwrap! (from-consensus-buff? principal parameters) ERR_INVALID_PARAMS))
    )
    (try! (is-dao-or-extension))
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true))
    (contract-call? '<%= it.timed_vault_contract %> set-account-holder accountHolder)
  )
)

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender '<%= it.base_dao_contract %>)
    (contract-call? '<%= it.base_dao_contract %> is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)