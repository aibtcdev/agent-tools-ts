(impl-trait '<%= it.extension_trait %>)
(impl-trait '<%= it.action_trait %>)

(define-constant ERR_UNAUTHORIZED (err u10001))
(define-constant ERR_INVALID_PARAMS (err u10002))

(define-constant CFG_MESSAGE "Executed Action Proposal: Updated configuration in BTC timed vault extension")

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (run (parameters (buff 2048)))
  (let
    (
      (paramsTuple (unwrap! (from-consensus-buff?
        { accountHolder: (optional principal), amount: (optional uint), period: (optional uint) }
        parameters) ERR_INVALID_PARAMS))
      (optAccountHolder (get accountHolder paramsTuple))
      (optAmount (get amount paramsTuple))
      (optPeriod (get period paramsTuple))
    )
    (try! (is-dao-or-extension))
    ;; have to provide at least one
    (asserts! (or (is-some optAccountHolder) (is-some optAmount) (is-some optPeriod)) ERR_INVALID_PARAMS)
    ;; send the message
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true))
    ;; set account holder if present
    (and (is-some optAccountHolder)
      (let ((accountHolder (unwrap! optAccountHolder ERR_INVALID_PARAMS)))
        (try! (contract-call? '<%= timed_vault_sbtc %> set-account-holder accountHolder))
      )
    )
    ;; set amounts if present and within limits
    (and (is-some optAmount)
      (let ((amount (unwrap! optAmount ERR_INVALID_PARAMS)))
        (asserts! (>= amount u1000) ERR_INVALID_PARAMS)
        (asserts! (<= amount u10000000) ERR_INVALID_PARAMS)
        (try! (contract-call? '<%= timed_vault_sbtc %> set-withdrawal-amount amount))
      )
    )
    ;; set period if present and within limits
    (and (is-some optPeriod)
      (let ((period (unwrap! optPeriod ERR_INVALID_PARAMS)))
        (asserts! (>= period u6) ERR_INVALID_PARAMS)
        (asserts! (<= period u8064) ERR_INVALID_PARAMS)
        (try! (contract-call? '<%= timed_vault_sbtc %> set-withdrawal-period period))
      )
    )
    (ok true)
  )
)

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender '<%= it.base_dao_contract %>)
    (contract-call? '<%= it.base_dao_contract %> is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)
