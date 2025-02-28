;; @title Bonding Curve Token by STX.CITY
;; @version 2.0
;; @hash <%= it.hash %> 
;; @targetstx <%= it.target_stx %> 

;; Traits
(impl-trait '<%= it.sip10_trait %>)

;; Errors 
(define-constant ERR-UNAUTHORIZED u401)
(define-constant ERR-NOT-OWNER u402)
(define-constant ERR-INVALID-PARAMETERS u403)
(define-constant ERR-NOT-ENOUGH-FUND u101)

;; Constants
(define-constant MAXSUPPLY u<%= it.token_max_supply %>)

;; Variables
(define-fungible-token <%= it.token_symbol %> MAXSUPPLY)
(define-data-var contract-owner principal '<%= it.token_owner_contract %>) 

;; SIP-10 Functions
(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq from tx-sender) (err ERR-UNAUTHORIZED))
        (ft-transfer? <%= it.token_symbol %> amount from to)
    )
)

;; Define token metadata
(define-data-var token-uri (optional (string-utf8 256)) (some u"<%= it.token_uri %>"))

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
  (ok (ft-get-balance <%= it.token_symbol %> owner))
)
(define-read-only (get-name)
  (ok "<%= it.token_name %>")
)
(define-read-only (get-symbol)
  (ok "<%= it.token_symbol %>")
)
(define-read-only (get-decimals)
  (ok u<%= it.token_decimals %>)
)
(define-read-only (get-total-supply)
  (ok (ft-get-supply <%= it.token_symbol %>))
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
  (try! (send-stx '<%= it.token_deployment_fee_address %> u500000))
  (try! (ft-mint? <%= it.token_symbol %> u<%= it.dex_contract_mint_amount %> '<%= it.dex_contract %>))
  (try! (ft-mint? <%= it.token_symbol %> u<%= it.treasury_contract_mint_amount %> '<%= it.treasury_contract %>))
)