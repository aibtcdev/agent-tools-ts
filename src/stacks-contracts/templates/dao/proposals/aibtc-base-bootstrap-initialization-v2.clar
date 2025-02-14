(impl-trait .aibtc-dao-traits-v2.proposal)

(define-constant CFG_DAO_MANIFEST_TEXT "<%= it.dao_manifest %>")
(define-constant CFG_DAO_MANIFEST_INSCRIPTION_ID "<%= it.dao_manifest_inscription_id %>")

(define-public (execute (sender principal))
  (begin
    ;; set initial dao extensions list
    (try! (contract-call? .aibtc-base-dao set-extensions
      (list
        {extension: .aibtc-dao-charter, enabled: true}
        {extension: .aibtc-action-proposals-v2, enabled: true}
        {extension: .aibtc-bank-account, enabled: true}
        {extension: .aibtc-core-proposals-v2, enabled: true}
        {extension: .aibtc-onchain-messaging, enabled: true}
        {extension: .aibtc-payments-invoices, enabled: true}
        {extension: .aibtc-token-owner, enabled: true}
        {extension: .aibtc-treasury, enabled: true}
      )
    ))
    ;; set initial action proposals list
    (try! (contract-call? .aibtc-base-dao set-extensions
      (list
        {extension: .aibtc-action-add-resource, enabled: true}
        {extension: .aibtc-action-allow-asset, enabled: true}
        {extension: .aibtc-action-send-message, enabled: true}
        {extension: .aibtc-action-set-account-holder, enabled: true}
        {extension: .aibtc-action-set-withdrawal-amount, enabled: true}
        {extension: .aibtc-action-set-withdrawal-period, enabled: true}
        {extension: .aibtc-action-toggle-resource-by-name, enabled: true}
      )
    ))
    ;; set DAO manifest in dao-charter extension
    (try! (contract-call? .aibtc-dao-charter set-dao-charter CFG_DAO_MANIFEST_TEXT none))
    ;; send DAO manifest as onchain message
    (try! (contract-call? .aibtc-onchain-messaging send CFG_DAO_MANIFEST_TEXT true))
    ;; allow assets in treasury
    (try! (contract-call? .aibtc-treasury allow-asset .aibtc-token true))
    ;; print manifest
    (print CFG_DAO_MANIFEST_TEXT)
    (ok true)
  )
)

