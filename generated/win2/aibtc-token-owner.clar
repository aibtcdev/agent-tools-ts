;; title: aibtcdev-token-owner
;; version: 1.0.0
;; summary: An extension that provides management functions for the dao token

;; traits
;;
(impl-trait 'ST3VXT52QEQPZ5246A16RFNMR1PRJ96JK6YYX37N8.aibtcdev-dao-traits-v1.extension)
(impl-trait 'ST3VXT52QEQPZ5246A16RFNMR1PRJ96JK6YYX37N8.aibtcdev-dao-traits-v1.token-owner)

;; constants
;;

(define-constant ERR_UNAUTHORIZED (err u401))

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (set-token-uri (value (string-utf8 256)))
  (begin
    ;; check if caller is authorized
    (try! (is-dao-or-extension))
    ;; update token uri
    (try! (as-contract (contract-call? 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-stxcity set-token-uri value)))
    (ok true)
  )
)

(define-public (transfer-ownership (new-owner principal))
  (begin
    ;; check if caller is authorized
    (try! (is-dao-or-extension))
    ;; transfer ownership
    (try! (as-contract (contract-call? 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-stxcity transfer-ownership new-owner)))
    (ok true)
  )
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-base-dao)
    (contract-call? 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-base-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)