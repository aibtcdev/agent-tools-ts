;; title: aibtc-timed-vault
;; version: 1.0.0
;; summary: An extension that allows a principal to withdraw STX from the contract with given rules.

;; traits
;;
(impl-trait '<%= it.extension_trait %>)
(impl-trait '<%= it.timed_vault_trait %>)

;; constants
;;
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))
(define-constant VAULT_TOKEN "STX")

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u2000))
(define-constant ERR_INVALID (err u2001))
(define-constant ERR_NOT_ACCOUNT_HOLDER (err u2002))
(define-constant ERR_TOO_SOON (err u2003))
(define-constant ERR_INVALID_AMOUNT (err u2004))

;; data vars
;;
(define-data-var withdrawalPeriod uint u144) ;; 144 Bitcoin blocks, ~1 day
(define-data-var withdrawalAmount uint u10000000) ;; 10 STX (6 decimals)
(define-data-var lastWithdrawalBlock uint u0)
(define-data-var accountHolder principal SELF)


;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (set-account-holder (new principal))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (not (is-eq (var-get accountHolder) new)) ERR_INVALID)
    (ok (var-set accountHolder new))
  )
)

(define-public (set-withdrawal-period (period uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (> period u0) ERR_INVALID)
    (ok (var-set withdrawalPeriod period))
  )
)

(define-public (set-withdrawal-amount (amount uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (> amount u0) ERR_INVALID)
    (ok (var-set withdrawalAmount amount))
  )
)

(define-public (override-last-withdrawal-block (block uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (> block DEPLOYED_BURN_BLOCK) ERR_INVALID)
    (ok (var-set lastWithdrawalBlock block))
  )
)

(define-public (deposit (amount uint))
  (begin
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (print {
      notification: "deposit",
      payload: {
        amount: amount,
        caller: contract-caller,
        recipient: SELF
      }
    })
    (stx-transfer? amount contract-caller SELF)
  )
)

(define-public (withdraw)
  (begin
    ;; verify user is enabled in the map
    (try! (is-account-holder))
    ;; verify user is not withdrawing too soon
    (asserts! (>= burn-block-height (+ (var-get lastWithdrawalBlock) (var-get withdrawalPeriod))) ERR_TOO_SOON)
    ;; update last withdrawal block
    (var-set lastWithdrawalBlock burn-block-height)
    ;; print notification and transfer STX
    (print {
      notification: "withdraw",
      payload: {
        amount: (var-get withdrawalAmount),
        caller: contract-caller,
        recipient: (var-get accountHolder)
      }
    })
    (as-contract (stx-transfer? (var-get withdrawalAmount) SELF (var-get accountHolder)))
  )
)

;; read only functions
;;
(define-read-only (get-account-balance)
  (ok (stx-get-balance SELF))
)

(define-read-only (get-account-terms)
  {
    accountHolder: (var-get accountHolder),
    contractName: SELF,
    deployedBurnBlock: DEPLOYED_BURN_BLOCK,
    deployedStacksBlock: DEPLOYED_STACKS_BLOCK,
    lastWithdrawalBlock: (var-get lastWithdrawalBlock),
    vaultToken: VAULT_TOKEN,
    withdrawalAmount: (var-get withdrawalAmount),
    withdrawalPeriod: (var-get withdrawalPeriod),
  }
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender '<%= it.base_dao_contract %>)
    (contract-call? '<%= it.base_dao_contract %> is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)

(define-private (is-account-holder)
  (ok (asserts! (is-eq (var-get accountHolder) (get-standard-caller)) ERR_NOT_ACCOUNT_HOLDER))
)

(define-private (get-standard-caller)
  (let ((d (unwrap-panic (principal-destruct? contract-caller))))
    (unwrap-panic (principal-construct? (get version d) (get hash-bytes d)))
  )
)
