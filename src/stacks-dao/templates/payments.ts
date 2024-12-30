// templates/payments-contract.ts

import { TRAITS } from "../../constants";

export type PaymentsContractParams = {
  daoContractId: string;
  network: "mainnet" | "testnet";
};

export function generateContract(params: PaymentsContractParams): string {
  const { daoContractId, network } = params;

  return `;; title: AIBTCDev DAO Payments
;; version: 1.0.0
;; summary: An extension that provides payment processing.

;; traits
;;
(use-trait extension-trait '${TRAITS[network].EXTENSION})
(impl-trait '${TRAITS[network].RESOURCE})
(impl-trait '${TRAITS[network].INVOICE})

;; constants
;;

;; initially scoped to service provider deploying a contract
(define-constant DEPLOYER contract-caller)
(define-constant SELF (as-contract tx-sender))

;; math helpers (credit: ALEX)
(define-constant ONE_8 (pow u10 u8))

;; errors
(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_INVALID_PARAMS (err u1001))
(define-constant ERR_NAME_ALREADY_USED (err u1002))
(define-constant ERR_SAVING_RESOURCE_DATA (err u1003))
(define-constant ERR_DELETING_RESOURCE_DATA (err u1004))
(define-constant ERR_RESOURCE_NOT_FOUND (err u1005))
(define-constant ERR_RESOURCE_NOT_ENABLED (err u1006))
(define-constant ERR_USER_ALREADY_EXISTS (err u1007))
(define-constant ERR_SAVING_USER_DATA (err u1008))
(define-constant ERR_USER_NOT_FOUND (err u1009))
(define-constant ERR_INVOICE_ALREADY_PAID (err u1010))
(define-constant ERR_SAVING_INVOICE_DATA (err u1011))
(define-constant ERR_INVOICE_NOT_FOUND (err u1012))
(define-constant ERR_RECENT_PAYMENT_NOT_FOUND (err u1013))

;; data vars
;;

;; tracking counts for each map
(define-data-var userCount uint u0)
(define-data-var resourceCount uint u0)
(define-data-var invoiceCount uint u0)

;; tracking overall contract revenue
(define-data-var totalRevenue uint u0)

;; payout address, deployer can set
(define-data-var paymentAddress principal DEPLOYER)

;; data maps
;;

;; tracks user indexes by address
(define-map UserIndexes
  principal ;; user address
  uint      ;; user index
)

;; tracks full user data keyed by user index
;; can iterate over full map with userCount data-var
(define-map UserData
  uint ;; user index
  {
    address: principal,
    totalSpent: uint,
    totalUsed: uint,
  }
)

;; tracks resource indexes by resource name
(define-map ResourceIndexes
  (string-utf8 50) ;; resource name
  uint             ;; resource index
)

;; tracks resources added by deployer keyed by resource index
;; can iterate over full map with resourceCount data-var
(define-map ResourceData
  uint ;; resource index
  {
    createdAt: uint,
    enabled: bool,
    name: (string-utf8 50),
    description: (string-utf8 255),
    price: uint,
    totalSpent: uint,
    totalUsed: uint,
  }
)

;; tracks invoices paid by users requesting access to a resource
(define-map InvoiceData
  uint ;; invoice count
  {
    amount: uint,
    createdAt: uint,
    userIndex: uint,
    resourceName: (string-utf8 50),
    resourceIndex: uint,
  }
)

;; tracks last payment from user for a resource
(define-map RecentPayments
  {
    userIndex: uint,
    resourceIndex: uint,
  }
  uint ;; invoice count
)

;; read only functions
;;

;; returns total registered users
(define-read-only (get-total-users)
  (var-get userCount)
)

;; returns user index for address if known
(define-read-only (get-user-index (user principal))
  (map-get? UserIndexes user)
)

;; returns user data by user index if known
(define-read-only (get-user-data (index uint))
  (map-get? UserData index)
)

;; returns user data by address if known
(define-read-only (get-user-data-by-address (user principal))
  (get-user-data (unwrap! (get-user-index user) none))
)

;; returns total registered resources
(define-read-only (get-total-resources)
  (var-get resourceCount)
)

;; returns resource index for name if known
(define-read-only (get-resource-index (name (string-utf8 50)))
  (map-get? ResourceIndexes name)
)

;; returns resource data by resource index if known
(define-read-only (get-resource (index uint))
  (map-get? ResourceData index)
)

;; returns resource data by resource name if known
(define-read-only (get-resource-by-name (name (string-utf8 50)))
  (get-resource (unwrap! (get-resource-index name) none))
)

;; returns total registered invoices
(define-read-only (get-total-invoices)
  (var-get invoiceCount)
)

;; returns invoice data by invoice index if known
(define-read-only (get-invoice (index uint))
  (map-get? InvoiceData index)
)

;; returns invoice index by user index and resource index if known
(define-read-only (get-recent-payment (resourceIndex uint) (userIndex uint))
  (map-get? RecentPayments {
    userIndex: userIndex,
    resourceIndex: resourceIndex,
  })
)

;; returns invoice data by user index and resource index if known
(define-read-only (get-recent-payment-data (resourceIndex uint) (userIndex uint))
  (get-invoice (unwrap! (get-recent-payment resourceIndex userIndex) none))
)

;; returns invoice data by user address and resource name if known
(define-read-only (get-recent-payment-data-by-address (name (string-utf8 50)) (user principal))
  (get-recent-payment-data (unwrap! (get-resource-index name) none) (unwrap! (get-user-index user) none))
)

;; returns payment address
(define-read-only (get-payment-address)
  (some (var-get paymentAddress))
)

;; returns total revenue
(define-read-only (get-total-revenue)
  (var-get totalRevenue)
)

;; public functions
;;

(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender '${daoContractId})
    (contract-call? '${daoContractId} is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

;; sets payment address used for invoices
;; only accessible by deployer or current payment address
(define-public (set-payment-address (oldAddress principal) (newAddress principal))
  (begin
    ;; check that old address matches current address
    (asserts! (is-eq oldAddress (var-get paymentAddress)) ERR_UNAUTHORIZED)
    ;; address cannot be the same
    (asserts! (not (is-eq oldAddress newAddress)) ERR_UNAUTHORIZED)
    ;; check if caller is authorized
    (try! (is-dao-or-extension))
    ;; print details
    (print {
      notification: "set-payment-address",
      payload: {
        oldAddress: oldAddress,
        newAddress: newAddress,
        txSender: tx-sender,
        contractCaller: contract-caller,
      }
    })
    ;; set new payment address
    (ok (var-set paymentAddress newAddress))
  )
)

;; adds active resource that invoices can be generated for
(define-public (add-resource (name (string-utf8 50)) (description (string-utf8 255)) (price uint))
  (let
    (
      (newCount (+ (get-total-resources) u1))
    )
    ;; check if caller is authorized
    (try! (is-dao-or-extension))
    ;; check all values are provided
    (asserts! (> (len name) u0) ERR_INVALID_PARAMS)
    (asserts! (> (len description) u0) ERR_INVALID_PARAMS)
    (asserts! (> price u0) ERR_INVALID_PARAMS)
    ;; update ResourceIndexes map, check name is unique
    (asserts! (map-insert ResourceIndexes name newCount) ERR_NAME_ALREADY_USED)
    ;; update ResourceData map
    (asserts! (map-insert ResourceData
      newCount
      {
        createdAt: block-height,
        enabled: true,
        name: name,
        description: description,
        price: price,
        totalSpent: u0,
        totalUsed: u0,
      }
    ) ERR_SAVING_RESOURCE_DATA)
    ;; increment resourceCount
    (var-set resourceCount newCount)
    ;; print details
    (print {
      notification: "add-resource",
      payload: {
        resourceIndex: newCount,
        resourceData: (unwrap! (get-resource newCount) ERR_RESOURCE_NOT_FOUND),
        txSender: tx-sender,
        contractCaller: contract-caller
      }
    })
    ;; return new count
    (ok newCount)
  )
)

;; toggles enabled status for resource
(define-public (toggle-resource (index uint))
  (let
    (
      (resourceData (unwrap! (get-resource index) ERR_RESOURCE_NOT_FOUND))
      (newStatus (not (get enabled resourceData)))
    )
    ;; verify resource > 0
    (asserts! (> index u0) ERR_INVALID_PARAMS)
    ;; check if caller is authorized
    (try! (is-dao-or-extension))
    ;; update ResourceData map
    (map-set ResourceData
      index
      (merge resourceData {
        enabled: newStatus
      })
    )
    ;; print details
    (print {
      notification: "toggle-resource",
      payload: {
        resourceIndex: index,
        resourceData: (unwrap! (get-resource index) ERR_RESOURCE_NOT_FOUND),
        txSender: tx-sender,
        contractCaller: contract-caller
      }
    })
    ;; return based on set status
    (ok newStatus)
  )
)

;; toggles enabled status for resource by name
(define-public (toggle-resource-by-name (name (string-utf8 50)))
  (toggle-resource (unwrap! (get-resource-index name) ERR_RESOURCE_NOT_FOUND))
)

;; allows a user to pay an invoice for a resource
(define-public (pay-invoice (resourceIndex uint) (memo (optional (buff 34))))
  (let
    (
      (newCount (+ (get-total-invoices) u1))
      (lastAnchoredBlock (- block-height u1))
      (resourceData (unwrap! (get-resource resourceIndex) ERR_RESOURCE_NOT_FOUND))
      (userIndex (unwrap! (get-or-create-user contract-caller) ERR_USER_NOT_FOUND))
      (userData (unwrap! (get-user-data userIndex) ERR_USER_NOT_FOUND))
    )
    ;; check that resourceIndex is > 0
    (asserts! (> resourceIndex u0) ERR_INVALID_PARAMS)
    ;; check that resource is enabled
    (asserts! (get enabled resourceData) ERR_RESOURCE_NOT_ENABLED)
    ;; update InvoiceData map
    (asserts! (map-insert InvoiceData
      newCount
      {
        amount: (get price resourceData),
        createdAt: block-height,
        userIndex: userIndex,
        resourceName: (get name resourceData),
        resourceIndex: resourceIndex,
      }
    ) ERR_SAVING_INVOICE_DATA)
    ;; update RecentPayments map
    (map-set RecentPayments
      {
        userIndex: userIndex,
        resourceIndex: resourceIndex,
      }
      newCount
    )
    ;; update UserData map
    (map-set UserData
      userIndex
      (merge userData {
        totalSpent: (+ (get totalSpent userData) (get price resourceData)),
        totalUsed: (+ (get totalUsed userData) u1)
      })
    )
    ;; update ResourceData map
    (map-set ResourceData
      resourceIndex
      (merge resourceData {
        totalSpent: (+ (get totalSpent resourceData) (get price resourceData)),
        totalUsed: (+ (get totalUsed resourceData) u1)
      })
    )
    ;; update total revenue
    (var-set totalRevenue (+ (var-get totalRevenue) (get price resourceData)))
    ;; increment counter
    (var-set invoiceCount newCount)
    ;; print details
    (print {
      notification: "pay-invoice",
      payload: {
        invoiceIndex: newCount,
        invoiceData: (unwrap! (get-invoice newCount) ERR_INVOICE_NOT_FOUND),
        recentPayment: (unwrap! (get-recent-payment resourceIndex userIndex) ERR_RECENT_PAYMENT_NOT_FOUND),
        userIndex: userIndex,
        userData: (unwrap! (get-user-data userIndex) ERR_USER_NOT_FOUND),
        resourceIndex: resourceIndex,
        resourceData: (unwrap! (get-resource resourceIndex) ERR_RESOURCE_NOT_FOUND),
        totalRevenue: (var-get totalRevenue),
        txSender: tx-sender,
        contractCaller: contract-caller
      }
    })
    ;; return new count
    (ok newCount)
  )
)

(define-public (pay-invoice-by-resource-name (name (string-utf8 50)) (memo (optional (buff 34))))
  (pay-invoice (unwrap! (get-resource-index name) ERR_RESOURCE_NOT_FOUND) memo)
)

;; private functions
;;

(define-private (get-or-create-user (address principal))
  (match (map-get? UserIndexes address)
    value (ok value) ;; return index if found
    (let
      (
        ;; increment current index
        (newCount (+ (get-total-users) u1))
      )
      ;; update UserIndexes map, check address is unique
      (asserts! (map-insert UserIndexes address newCount) ERR_USER_ALREADY_EXISTS)
      ;; update UserData map
      (asserts! (map-insert UserData 
        newCount
        {
          address: address,
          totalSpent: u0,
          totalUsed: u0,
        }
      ) ERR_SAVING_USER_DATA)
      ;; save new index
      (var-set userCount newCount)
      ;; return new index
      (ok newCount)
    )
  )
)`;
}
