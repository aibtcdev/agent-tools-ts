;; @title Bonding Curve Token by STX.CITY
;; @version 2.0
;; @hash gK12_9LrdIDYy4AVcdjKWQ:nCcvmO-qxrmkG8G4rm1-eQ:8fhVhDM7Q3tUj1yejR_G5S9-4dM0_rkr1_MgOcn1B6nfTqTc6haOcKhM_bBsutw2sN1A9W2uHHITx3F76LZkTQ 
;; @targetstx 2000 

(impl-trait 'ST3VXT52QEQPZ5246A16RFNMR1PRJ96JK6YYX37N8.aibtcdev-dao-traits-v1.token)
;; SIP-10 Trait
(impl-trait 'ST3VXT52QEQPZ5246A16RFNMR1PRJ96JK6YYX37N8.sip-010-trait-ft-standard.sip-010-trait)

;; Errors 
(define-constant ERR-UNAUTHORIZED u401)
(define-constant ERR-NOT-OWNER u402)
(define-constant ERR-INVALID-PARAMETERS u403)
(define-constant ERR-NOT-ENOUGH-FUND u101)

;; Constants
(define-constant MAXSUPPLY u2100000000000000)

;; Variables
(define-fungible-token WIN2 MAXSUPPLY)
(define-data-var contract-owner principal 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-token-owner) 

;; SIP-10 Functions
(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq from tx-sender) (err ERR-UNAUTHORIZED))
        (ft-transfer? WIN2 amount from to)
    )
)

;; Define token metadata
(define-data-var token-uri (optional (string-utf8 256)) (some u"https://stacks.org"))

;; Set token uri
(define-public (set-token-uri (value (string-utf8 256)))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-UNAUTHORIZED))
        (var-set token-uri (some value))
        (ok (print {
              notification: "token-metadata-update",
              payload: {
                contract-id: (as-contract tx-sender),
                token-class: "ft"
              }
            })
        )
    )
)

;; Read-Only Functions
(define-read-only (get-balance (owner principal))
  (ok (ft-get-balance WIN2 owner))
)
(define-read-only (get-name)
  (ok "WINNER2")
)
(define-read-only (get-symbol)
  (ok "WIN2")
)
(define-read-only (get-decimals)
  (ok u8)
)
(define-read-only (get-total-supply)
  (ok (ft-get-supply WIN2))
)
(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; transfer ownership
(define-public (transfer-ownership (new-owner principal))
  (begin
    ;; Checks if the sender is the current owner
    (if (is-eq tx-sender (var-get contract-owner))
      (begin
        ;; Sets the new owner
        (var-set contract-owner new-owner)
        ;; Returns success message
        (ok "Ownership transferred successfully"))
      ;; Error if the sender is not the owner
      (err ERR-NOT-OWNER)))
)

(define-public (send-many (recipients (list 200 { to: principal, amount: uint, memo: (optional (buff 34)) })))
  (fold check-err (map send-token recipients) (ok true))
)

(define-private (check-err (result (response bool uint)) (prior (response bool uint)))
  (match prior ok-value result err-value (err err-value))
)

(define-private (send-token (recipient { to: principal, amount: uint, memo: (optional (buff 34)) }))
  (send-token-with-memo (get amount recipient) (get to recipient) (get memo recipient))
)

(define-private (send-token-with-memo (amount uint) (to principal) (memo (optional (buff 34))))
  (let ((transferOk (try! (transfer amount tx-sender to memo))))
    (ok transferOk)
  )
)

(define-private (send-stx (recipient principal) (amount uint))
  (begin
    (try! (stx-transfer? amount tx-sender recipient))
    (ok true)
  )
)

(begin
  ;; Send STX fees
  (try! (send-stx 'undefined u500000))
  ;; mint tokens to the dex_contract (20%)
  (try! (ft-mint? WIN2 (/ (* MAXSUPPLY u20) u100) 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-stxcity-dex))
  ;; mint tokens to the treasury (80%)
  (try! (ft-mint? WIN2 (/ (* MAXSUPPLY u80) u100) 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-stxcity-dex))
)