;; title: Mock sBTC Token
;; version: 1.0
;; summary: Mock implementation of sBTC for local testing
;; description: Implements SIP-010 trait and mimics mainnet sBTC token functionality

;; traits
;;

;; token definitions
(define-fungible-token sbtc-token)

;; constants
(define-constant ERR_NOT_OWNER (err u4))
(define-constant ERR_INVALID_SENDER (err u5))
(define-constant ERR_INVALID_RECIPIENT (err u6))
(define-constant ERR_INSUFFICIENT_BALANCE (err u7))
(define-constant token-decimals u8)
(define-constant INITIAL_SUPPLY u2100000000000000) ;; 21m sBTC with 8 decimals for testing

;; data vars
(define-data-var token-name (string-ascii 32) "sBTC")
(define-data-var token-symbol (string-ascii 10) "sBTC")
(define-data-var token-uri (optional (string-utf8 256)) (some u"https://ipfs.io/ipfs/bafkreibqnozdui4ntgoh3oo437lvhg7qrsccmbzhgumwwjf2smb3eegyqu"))

;; data maps
;;

;; public functions
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
(begin
;; Authorization check
(asserts! (or (is-eq tx-sender sender) (is-eq contract-caller sender)) ERR_NOT_OWNER)
;; Sender validation
(asserts! (not (is-eq sender recipient)) ERR_INVALID_SENDER)
;; Balance check
(asserts! (<= amount (ft-get-balance sbtc-token sender)) ERR_INSUFFICIENT_BALANCE)
;; Recipient validation - ensure not burning tokens
(asserts! (not (is-eq recipient (as-contract tx-sender))) ERR_INVALID_RECIPIENT)
;; Perform transfer
(try! (ft-transfer? sbtc-token amount sender recipient))
;; Handle memo if provided
(match memo to-print (print to-print) 0x)
(ok true)
)
)
;; faucet function for testing
(define-public (faucet)
(begin
(try! (ft-mint? sbtc-token u690000000 tx-sender)) ;; Mint 6.9 sBTC to tx-sender
(ok true)
)

)
;; read only functions
(define-read-only (get-name)
(ok (var-get token-name))
)
(define-read-only (get-symbol)
(ok (var-get token-symbol))

)
(define-read-only (get-decimals)
(ok token-decimals)
)

(define-read-only (get-balance (who principal))
(ok (ft-get-balance sbtc-token who))
)

(define-read-only (get-total-supply)
(ok (ft-get-supply sbtc-token))
)

(define-read-only (get-token-uri)
(ok (var-get token-uri))
)

;; initialize contract
(begin
;; Mint initial supply to contract deployer

(try! (ft-mint? sbtc-token INITIAL_SUPPLY tx-sender))
)