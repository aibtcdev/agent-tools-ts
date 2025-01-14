(impl-trait '<%= it.extension_trait %>)
(impl-trait '<%= it.action_trait %>)

(define-constant ERR_UNAUTHORIZED (err u10001))
(define-constant ERR_INVALID_PARAMS (err u10002))
(define-constant ERR_PARAMS_OUT_OF_RANGE (err u10003))

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (run (parameters (buff 2048)))
  (let
    (
      (period (unwrap! (from-consensus-buff? uint parameters) ERR_INVALID_PARAMS))
    )
    (try! (is-dao-or-extension))
    ;; verify within limits for low quorum
    ;; more than 6 blocks (1hr), less than 1008 blocks (~1 week)
    (asserts! (and (> period u6) (< period u1008)) ERR_PARAMS_OUT_OF_RANGE)
    (contract-call? '<%= it.bank_account_contract_address %> set-withdrawal-period period)
  )
)

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender '<%= it.dao_contract_address %>)
    (contract-call? '<%= it.dao_contract_address %> is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)
