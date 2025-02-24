;; title: aibtc-dao-charter
;; version: 1.0.0
;; summary: An extension that manages the DAO charter and records the DAO's mission and values on-chain.
;; description: This contract allows the DAO to define its mission and values on-chain, which can be used to guide decision-making and proposals.
;; The charter is editable by the DAO through proposal with revisions stored on-chain.

;; traits
;;
(impl-trait '<%= it.extension_trait %>)
(impl-trait '<%= it.charter_trait %>)

;; constants
;;
(define-constant SELF (as-contract tx-sender))

;; error codes
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u8000))
(define-constant ERR_SAVING_CHARTER (err u8001))
(define-constant ERR_CHARTER_TOO_SHORT (err u8002))
(define-constant ERR_CHARTER_TOO_LONG (err u8003))

;; data vars
;;
(define-data-var daoCharter (string-ascii 4096) "")
(define-data-var currentVersion uint u0)

;; data maps
;;
(define-map CharterVersions
  uint ;; version number
  {
    burnHeight: uint, ;; burn block height
    createdAt: uint, ;; block height
    caller: principal, ;; contract caller
    sender: principal, ;; tx-sender
    charter: (string-ascii 4096), ;; charter text
    inscriptionId: (optional (buff 33))  ;; 32 bytes for txid + 1 byte for index
  }
)

;; public functions
;;
(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (set-dao-charter (charter (string-ascii 4096)) (inscriptionId (optional (buff 33))))
  (let
    (
      (newVersion (+ (var-get currentVersion) u1))
    )
    ;; check if sender is dao or extension
    (try! (is-dao-or-extension))
    ;; check length of charter
    (asserts! (>= (len charter) u1) ERR_CHARTER_TOO_SHORT)
    (asserts! (<= (len charter) u4096) ERR_CHARTER_TOO_LONG)
    ;; insert new charter version
    (asserts! (map-insert CharterVersions newVersion {
      burnHeight: burn-block-height,
      createdAt: block-height,
      caller: contract-caller,
      sender: tx-sender,
      charter: charter,
      inscriptionId: inscriptionId
    }) ERR_SAVING_CHARTER)
    ;; print charter info
    (print {
      notification: "set-dao-charter",
      payload: {
        burnHeight: burn-block-height,
        createdAt: block-height,
        caller: contract-caller,
        sender: tx-sender,
        dao: SELF,
        charter: charter,
        inscriptionId: inscriptionId,
        version: newVersion
      }
    })
    ;; increment charter version
    (var-set currentVersion newVersion)
    ;; set new charter
    (var-set daoCharter charter)
    ;; return success
    (ok true)
  )
)

;; read only functions
;;
(define-read-only (get-current-dao-charter-version)
  (if (> (var-get currentVersion) u0)
    (some (var-get currentVersion))
    none
  )
)

(define-read-only (get-current-dao-charter)
  (if (> (var-get currentVersion) u0)
    (some (var-get daoCharter))
    none
  )
)

(define-read-only (get-dao-charter (version uint))
  (map-get? CharterVersions version)
)

;; private functions
;;
(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender '<%= it.base_dao_contract %>)
    (contract-call? '<%= it.base_dao_contract %> is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)
